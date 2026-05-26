import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import { z } from 'zod';
import { getMercadoPagoPreference } from '@/lib/mercadopago';
import { calculateMelhorEnvioShipping, getLocalShippingQuote } from '@/lib/shipping';

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
    city: z.string().optional(),
  }),
  shippingServiceId: z.string().optional(),
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

    const { cart, customer, shippingServiceId } = validation.data;

    if (customer.deliveryMethod === 'home' && (!customer.address || !customer.number || !customer.city)) {
      return new Response(JSON.stringify({ error: 'Preencha todos os dados de entrega.' }), { status: 400 });
    }

    const products = await getProducts();
    const items = buildValidatedItems(cart, products);
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shipping = await getShipping({ customer, subtotal, shippingServiceId });
    const total = Number((subtotal + shipping.cost).toFixed(2));
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsidianparfums.site';
    const preference = getMercadoPagoPreference();

    const mpPreference = await preference.create({
      body: {
        payer: {
          name: customer.name,
          email: customer.email,
        },
        items: [
          ...items,
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
          subtotal,
          total,
          address: customer.address || '',
          number: customer.number || '',
          complement: customer.complement || '',
          city: customer.city || '',
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
      shipping,
      total,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro no checkout Mercado Pago:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro ao iniciar pagamento.',
    }), { status: 500 });
  }
}
