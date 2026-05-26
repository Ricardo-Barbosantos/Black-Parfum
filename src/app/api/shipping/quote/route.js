import { calculateMelhorEnvioShipping, getLocalShippingQuote } from '@/lib/shipping';

export async function POST(request) {
  try {
    const { deliveryMethod, city, zip, subtotal } = await request.json();

    const localShipping = getLocalShippingQuote({ deliveryMethod, city });
    if (localShipping) {
      return new Response(JSON.stringify({
        options: [{
          id: 'local-free',
          label: localShipping.label,
          price: localShipping.cost,
          deliveryTime: null,
        }],
      }), { status: 200 });
    }

    const options = await calculateMelhorEnvioShipping({
      destinationZip: zip,
      subtotal: Number(subtotal || 0),
    });

    return new Response(JSON.stringify({ options }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Erro ao calcular frete.',
    }), { status: 500 });
  }
}
