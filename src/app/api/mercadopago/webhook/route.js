import crypto from 'node:crypto';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { updateOrderFromPayment } from '@/lib/orders';

function isValidMercadoPagoSignature(request, url, paymentId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = request.headers.get('x-signature') || '';
  const requestId = request.headers.get('x-request-id') || '';
  const ts = signature.split(',').find((part) => part.trim().startsWith('ts='))?.split('=')[1];
  const hash = signature.split(',').find((part) => part.trim().startsWith('v1='))?.split('=')[1];

  if (!ts || !hash || !requestId || !paymentId) return false;

  const idFromUrl = url.searchParams.get('data.id') || paymentId;
  const manifest = `id:${idFromUrl};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const hashBuffer = Buffer.from(hash);
  if (expectedBuffer.length !== hashBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, hashBuffer);
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const type = body.type || url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = String(
      body.data?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id') ||
      ''
    );

    if (type && type !== 'payment') {
      return new Response(JSON.stringify({ received: true, ignored: type }), { status: 200 });
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ received: true, ignored: 'missing_payment_id' }), { status: 200 });
    }

    if (!isValidMercadoPagoSignature(request, url, paymentId)) {
      return new Response(JSON.stringify({ error: 'Assinatura invalida.' }), { status: 401 });
    }

    const payment = await getMercadoPagoPayment(paymentId);
    const order = await updateOrderFromPayment(payment);

    return new Response(JSON.stringify({ received: true, orderId: order?.id || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro no webhook.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
