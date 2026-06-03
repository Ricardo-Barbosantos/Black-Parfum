import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import { z } from 'zod';
import { getMercadoPagoPreference } from '@/lib/mercadopago';
import { calculateMelhorEnvioShipping, getLocalShippingQuote } from '@/lib/shipping';
import {
  calculateCouponDiscount,
  calculateInfluencerCommission,
  getActiveCouponByCode,
  normalizeCouponCode,
} from '@/lib/coupons';

const CheckoutSchema = z.object({
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
  shippingServiceId: z.string().optional(),
  couponCode: z.string().max(32).optional(),
});

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Erro ao iniciar Redis no checkout:', error);
  }
}

async function getProducts() {
  if (process.env.KV_REST_API_URL) {
    try {
      const products = await kv.get('obsidian_products') || await kv.get('black_parfum_products');
      if (Array.isArray(products)) return products;
    } catch (error) {
      console.error('KV checkout error:', error);
    }
  }

  if (redis) {
    try {
      const data = await redis.get('obsidian_products') || await redis.get('black_parfum_products');
      if (data) return JSON.parse(data);
    } catch (error) {
      console.error('Redis checkout error:', error);
    }
  }

  throw new Error('Não foi possível carregar os produtos para validar o carrinho.');
}

function buildValidatedItems(cart, products) {
  return cart.map((cartItem) => {
    const product = products.find((item) => item.id === cartItem.id);

    if (!product) {
      throw new Error(`Produto não encontrado: ${cartItem.id}`);
    }

    const quantity = Number(cartItem.quantity);
    const unitPrice = Number(product.price);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Produto com preço inválido: ${product.name}`);
    }

    return {
      id: cartItem.cartItemId || product.id,
      title: `${product.name}${cartItem.selectedSize ? ` (${cartItem.selectedSize})` : ''}`,
      quantity,
      unit_price: unitPrice,
      currency_id: 'BRL',
    };
  });
}

function applyDiscountToItems(items, discountAmount) {
  const discountCents = Math.round(Number(discountAmount || 0) * 100);
  if (discountCents <= 0) return items;

  const unitItems = items.flatMap((item) => (
    Array.from({ length: item.quantity }, (_, index) => ({
      ...item,
      id: `${item.id}-${index + 1}`,
      quantity: 1,
    }))
  ));

  const subtotalCents = unitItems.reduce((sum, item) => sum + Math.round(item.unit_price * 100), 0);
  if (subtotalCents <= 0) return items;

  let remainingDiscountCents = Math.min(discountCents, Math.max(0, subtotalCents - unitItems.length));

  return unitItems.map((item, index) => {
    const priceCents = Math.round(item.unit_price * 100);
    const suggestedShare = index === unitItems.length - 1
      ? remainingDiscountCents
      : Math.round((discountCents * priceCents) / subtotalCents);
    const appliedCents = Math.min(remainingDiscountCents, Math.max(0, Math.min(priceCents - 1, suggestedShare)));
    remainingDiscountCents -= appliedCents;

    return {
      ...item,
      unit_price: Number(((priceCents - appliedCents) / 100).toFixed(2)),
    };
  });
}

async function getCouponSummary({ couponCode, subtotal }) {
  const code = normalizeCouponCode(couponCode || '');
  if (!code) {
    return {
      coupon: null,
      discountAmount: 0,
      discountedSubtotal: subtotal,
      commissionAmount: 0,
    };
  }

  const coupon = await getActiveCouponByCode(code);
  if (!coupon) {
    throw new Error('Cupom nao encontrado ou inativo.');
  }

  const discountAmount = calculateCouponDiscount(subtotal, coupon);
  const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
  const commissionAmount = calculateInfluencerCommission(discountedSubtotal, coupon);

  return {
    coupon,
    discountAmount,
    discountedSubtotal,
    commissionAmount,
  };
}

async function getShipping({ customer, subtotal, shippingServiceId }) {
  const localShipping = getLocalShippingQuote({
    deliveryMethod: customer.deliveryMethod,
    city: customer.city || '',
  });

  if (localShipping) return localShipping;

  const options = await calculateMelhorEnvioShipping({
    destinationZip: customer.zip,
    subtotal,
  });

  if (!options.length) {
    throw new Error('Nenhuma opção de frete encontrada para esse CEP.');
  }

  const selectedOption = options.find((option) => option.id === shippingServiceId) || options[0];

  return {
    cost: selectedOption.price,
    label: selectedOption.label,
    free: false,
  };
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const validation = CheckoutSchema.safeParse(payload);

    if (!validation.success) {
      return new Response(JSON.stringify({
        error: 'Dados inválidos para checkout.',
        details: validation.error.format(),
      }), { status: 400 });
    }

    const { cart, customer, shippingServiceId, couponCode } = validation.data;

    const zip = String(customer.zip || '').replace(/\D/g, '');
    if (
      customer.deliveryMethod === 'home' &&
      (!customer.address || !customer.number || !customer.neighborhood || !customer.city || zip.length !== 8)
    ) {
      return new Response(JSON.stringify({ error: 'Preencha todos os dados de entrega.' }), { status: 400 });
    }

    const products = await getProducts();
    const items = buildValidatedItems(cart, products);
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const couponSummary = await getCouponSummary({ couponCode, subtotal });
    const discountedItems = applyDiscountToItems(items, couponSummary.discountAmount);
    const shipping = await getShipping({ customer, subtotal, shippingServiceId });
    const total = Number((couponSummary.discountedSubtotal + shipping.cost).toFixed(2));
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsidianparfums.site';
    const preference = getMercadoPagoPreference();

    const mpPreference = await preference.create({
      body: {
        payer: {
          name: customer.name,
          email: customer.email,
        },
        items: [
          ...discountedItems,
          ...(shipping.cost > 0 ? [{
            id: 'frete',
            title: `Frete - ${shipping.label}`,
            quantity: 1,
            unit_price: shipping.cost,
            currency_id: 'BRL',
          }] : []),
        ],
        metadata: {
          customer_name: customer.name,
          delivery_method: customer.deliveryMethod,
          shipping_label: shipping.label,
          shipping_cost: shipping.cost,
          coupon_code: couponSummary.coupon?.code || '',
          coupon_discount_percent: couponSummary.coupon?.discountPercent || 0,
          coupon_discount_amount: couponSummary.discountAmount,
          coupon_discounted_subtotal: couponSummary.discountedSubtotal,
          influencer_name: couponSummary.coupon?.influencerName || '',
          influencer_commission_percent: couponSummary.coupon?.commissionPercent || 0,
          influencer_commission_fixed: couponSummary.coupon?.commissionFixed || 0,
          influencer_commission_amount: couponSummary.commissionAmount,
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
        back_urls: {
          success: `${siteUrl}/?checkout=success`,
          pending: `${siteUrl}/?checkout=pending`,
          failure: `${siteUrl}/?checkout=failure`,
        },
        auto_return: 'approved',
      },
    });

    return new Response(JSON.stringify({
      init_point: mpPreference.init_point,
      sandbox_init_point: mpPreference.sandbox_init_point,
      subtotal,
      discount: {
        couponCode: couponSummary.coupon?.code || '',
        discountPercent: couponSummary.coupon?.discountPercent || 0,
        discountAmount: couponSummary.discountAmount,
        discountedSubtotal: couponSummary.discountedSubtotal,
      },
      influencerCommission: {
        influencerName: couponSummary.coupon?.influencerName || '',
        commissionPercent: couponSummary.coupon?.commissionPercent || 0,
        commissionFixed: couponSummary.coupon?.commissionFixed || 0,
        commissionAmount: couponSummary.commissionAmount,
      },
      shipping,
      total,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro no checkout Mercado Pago:', error);
    const publicMessage = error.message || 'Erro ao iniciar pagamento.';

    return new Response(JSON.stringify({
      error: publicMessage,
    }), { status: 500 });
  }
}
