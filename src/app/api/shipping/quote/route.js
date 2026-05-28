import { calculateMelhorEnvioShipping, getLocalShippingQuote } from '@/lib/shipping';

function getErrorStatus(message = '') {
  if (message.includes('CEP inválido')) return 400;
  if (
    message.includes('não está configurado') ||
    message.includes('não foi autorizado') ||
    message.includes('expirado')
  ) {
    return 503;
  }

  return 500;
}

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
    console.error('Erro ao calcular frete:', error);
    const message = error.message || 'Não foi possível calcular o frete agora.';

    return new Response(JSON.stringify({
      error: message,
    }), {
      status: getErrorStatus(message),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
