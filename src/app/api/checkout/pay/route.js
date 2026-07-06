import { z } from 'zod';
import { createMercadoPagoPayment } from '@/lib/mercadopago';
import { calculateMelhorEnvioShipping, getLocalShippingQuote } from '@/lib/shipping';
import { getControlledStock, getProducts, isProductActive, isProductSoldOut } from '@/lib/products';
import { addOrder, buildPendingOrder, createOrderId, sanitizeOrder } from '@/lib/orders';
import { sendOrderEmail } from '@/lib/notifications';
import {
  calculateCouponDiscount,
  calculateInfluencerCommission,
  getActiveCouponByCode,
  normalizeCouponCode,
} from '@/lib/coupons';

const PaySchema = z.object({
  cart: z.array(z.object({
    id: z.string().min(1),
    cartItemId: z.string().optional(),
    selectedSize: z.string().optional(),
    quantity: z.number().int().min(1).max(20),
  })).min(1),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    deliveryMethod: z.enum(['home', 'pickup']),
    zip: z.string().optional(),
    number: z.string().optional(),
    address: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  paymentMethod: z.enum(['pix', 'boleto', 'credit_card']),
  cardToken: z.string().optional(),
  cardInstallments: z.number().int().min(1).max(12).optional(),
  cpf: z.string().optional(),
  shippingServiceId: z.string().optional(),
  couponCode: z.string().max(32).optional(),
});

function buildValidatedItems(cart, products) {
  const requestedByProduct = cart.reduce((acc, cartItem) => {
    acc[cartItem.id] = (acc[cartItem.id] || 0) + Number(cartItem.quantity || 0);
    return acc;
  }, {});

  return cart.map((cartItem) => {
    const product = products.find((item) => item.id === cartItem.id);
    if (!product) throw new Error(`Produto não encontrado: ${cartItem.id}`);
    if (!isProductActive(product)) throw new Error(`Produto inativo: ${product.name}`);
    if (isProductSoldOut(product)) throw new Error(`Produto esgotado: ${product.name}`);

    const quantity = Number(cartItem.quantity);
    const unitPrice = Number(product.price);
    const stock = getControlledStock(product);

    if (stock !== null && requestedByProduct[product.id] > stock) {
      throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${stock}`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Produto com preço inválido: ${product.name}`);
    }

    return {
      orderItem: {
        productId: product.id,
        cartItemId: cartItem.cartItemId || product.id,
        name: product.name,
        selectedSize: cartItem.selectedSize || '',
        quantity,
        unitPrice,
        total: Number((unitPrice * quantity).toFixed(2)),
      },
    };
  });
}

async function getCouponSummary({ couponCode, subtotal }) {
  const code = normalizeCouponCode(couponCode || '');
  if (!code) return { coupon: null, discountAmount: 0, discountedSubtotal: subtotal, commissionAmount: 0 };

  const coupon = await getActiveCouponByCode(code);
  if (!coupon) throw new Error('Cupom não encontrado ou inativo.');

  const discountAmount = calculateCouponDiscount(subtotal, coupon);
  const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
  const commissionAmount = calculateInfluencerCommission(discountedSubtotal, coupon);

  return { coupon, discountAmount, discountedSubtotal, commissionAmount };
}

async function getShipping({ customer, subtotal, shippingServiceId }) {
  const localShipping = getLocalShippingQuote({
    deliveryMethod: customer.deliveryMethod,
    city: customer.city || '',
  });
  if (localShipping) return localShipping;

  const options = await calculateMelhorEnvioShipping({ destinationZip: customer.zip, subtotal });
  if (!options.length) throw new Error('Nenhuma opção de frete encontrada para esse CEP.');

  const selectedOption = options.find((o) => o.id === shippingServiceId) || options[0];
  return { cost: selectedOption.price, label: selectedOption.label, free: false };
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const validation = PaySchema.safeParse(payload);

    if (!validation.success) {
      return Response.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }

    const { cart, customer, paymentMethod, cardToken, cardInstallments, cpf, shippingServiceId, couponCode } = validation.data;

    const zip = String(customer.zip || '').replace(/\D/g, '');
    if (customer.deliveryMethod === 'home' && (!customer.address || !customer.number || !customer.neighborhood || !customer.city || zip.length !== 8)) {
      return Response.json({ error: 'Preencha todos os dados de entrega.' }, { status: 400 });
    }

    // Validar cartão
    if (paymentMethod === 'credit_card' && !cardToken) {
      return Response.json({ error: 'Token do cartão não informado.' }, { status: 400 });
    }

    // CPF obrigatório para boleto e recomendado para PIX
    const cleanCpf = String(cpf || '').replace(/\D/g, '');
    if (paymentMethod === 'boleto' && cleanCpf.length !== 11) {
      return Response.json({ error: 'CPF inválido. Informe o CPF para gerar o boleto.' }, { status: 400 });
    }

    const products = await getProducts();
    const validatedItems = buildValidatedItems(cart, products);
    const orderItems = validatedItems.map((item) => item.orderItem);
    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const couponSummary = await getCouponSummary({ couponCode, subtotal });
    const shipping = await getShipping({ customer, subtotal, shippingServiceId });
    
    // Verificacao de seguranca: desconto de PIX so entra se NAO tiver cupom
    let totalDiscount = couponSummary.discountAmount;
    let pixDiscountAmount = 0;
    
    if (paymentMethod === 'pix' && couponSummary.discountAmount === 0) {
      pixDiscountAmount = Number((subtotal * 0.05).toFixed(2));
      totalDiscount += pixDiscountAmount;
    }
    
    const discountedSubtotal = Number((subtotal - totalDiscount).toFixed(2));
    const total = Number((discountedSubtotal + shipping.cost).toFixed(2));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsidianparfums.site';
    const orderId = createOrderId();

    const nameParts = customer.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const payerIdentification = cleanCpf.length === 11
      ? { type: 'CPF', number: cleanCpf }
      : undefined;

    // Mapeamento de método para ID do MP
    const methodIdMap = { pix: 'pix', boleto: 'boleto', credit_card: undefined }; // cartão usa o token
    const mpPaymentMethodId = paymentMethod === 'credit_card' ? undefined : methodIdMap[paymentMethod];

    const mpPayment = await createMercadoPagoPayment({
      paymentMethodId: mpPaymentMethodId,
      token: paymentMethod === 'credit_card' ? cardToken : undefined,
      installments: paymentMethod === 'credit_card' ? (cardInstallments || 1) : undefined,
      transactionAmount: total,
      description: `Obsidian Parfums - Pedido ${orderId}`,
      externalReference: orderId,
      notificationUrl: `${siteUrl}/api/mercadopago/webhook`,
      payer: {
        email: customer.email,
        firstName,
        lastName,
        identification: payerIdentification,
      },
      metadata: {
        order_id: orderId,
        customer_name: customer.name,
        delivery_method: customer.deliveryMethod,
        shipping_label: shipping.label,
        shipping_cost: shipping.cost,
        coupon_code: couponSummary.coupon?.code || '',
        coupon_discount_amount: couponSummary.discountAmount,
        subtotal,
        total,
        address: customer.address || '',
        number: customer.number || '',
        complement: customer.complement || '',
        neighborhood: customer.neighborhood || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
      },
    });

    // Construir e salvar pedido
    const mpStatus = mpPayment.status; // 'approved' | 'pending' | 'rejected' etc.
    const order = sanitizeOrder({
      id: orderId,
      status: mpStatus === 'approved' ? 'paid' : mpStatus === 'rejected' ? 'cancelled' : 'pending',
      paymentStatus: mpStatus,
      paymentStatusDetail: mpPayment.status_detail || '',
      paymentId: String(mpPayment.id || ''),
      stockDecremented: mpStatus === 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: mpStatus === 'approved' ? new Date().toISOString() : '',
      customer,
      shipping,
      coupon: couponSummary.coupon ? {
        code: couponSummary.coupon.code,
        discountPercent: couponSummary.coupon.discountPercent,
        discountAmount: couponSummary.discountAmount,
        influencerName: couponSummary.coupon.influencerName,
        commissionPercent: couponSummary.coupon.commissionPercent,
        commissionFixed: couponSummary.coupon.commissionFixed,
        commissionAmount: couponSummary.commissionAmount,
      } : null,
      amounts: { subtotal, discount: totalDiscount, shipping: shipping.cost, total, paid: mpStatus === 'approved' ? total : 0 },
      items: orderItems,
    });

    await addOrder(order);

    try {
      await sendOrderEmail(order, 'Novo pedido');
    } catch (e) {
      console.error('Erro ao enviar email:', e);
    }

    if (mpStatus === 'rejected') {
      const detail = mpPayment.status_detail || '';
      const friendlyMsg = detail === 'cc_rejected_bad_filled_card_number' ? 'Número de cartão inválido.'
        : detail === 'cc_rejected_bad_filled_date' ? 'Data de validade inválida.'
        : detail === 'cc_rejected_bad_filled_other' ? 'Dado do cartão inválido.'
        : detail === 'cc_rejected_bad_filled_security_code' ? 'CVV inválido.'
        : detail === 'cc_rejected_insufficient_amount' ? 'Saldo insuficiente.'
        : detail === 'cc_rejected_high_risk' ? 'Pagamento recusado por segurança.'
        : 'Pagamento recusado. Verifique os dados do cartão.';
      return Response.json({ error: friendlyMsg, status: 'rejected' }, { status: 422 });
    }

    const response = {
      orderId,
      paymentId: mpPayment.id,
      status: mpStatus,
      paymentMethod,
      total,
    };

    // PIX: retornar QR Code
    if (paymentMethod === 'pix' && mpPayment.point_of_interaction?.transaction_data) {
      response.pixData = {
        qrCode: mpPayment.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: mpPayment.point_of_interaction.transaction_data.qr_code_base64,
      };
    }

    // Boleto: retornar linha digitável
    if (paymentMethod === 'boleto') {
      response.boletoData = {
        barcode: mpPayment.barcode?.content || '',
        externalResourceUrl: mpPayment.transaction_details?.external_resource_url || '',
        expirationDate: mpPayment.date_of_expiration || '',
      };
    }

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error('Erro no checkout transparente:', error);
    return Response.json({ error: error.message || 'Erro ao processar pagamento.' }, { status: 500 });
  }
}
