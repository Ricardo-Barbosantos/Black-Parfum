import { MercadoPagoConfig, Preference } from 'mercadopago';

export function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');
  }

  return accessToken;
}

export function getMercadoPagoPreference() {
  const accessToken = getMercadoPagoAccessToken();

  const client = new MercadoPagoConfig({ accessToken });
  return new Preference(client);
}

export async function getMercadoPagoPayment(paymentId) {
  if (!paymentId) throw new Error('ID do pagamento não informado.');

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Erro ao consultar pagamento no Mercado Pago.');
  }

  return data;
}

/**
 * Cria um pagamento direto pelo Mercado Pago (checkout transparente).
 * Suporta PIX, Boleto e Cartão de Crédito (via token).
 */
export async function createMercadoPagoPayment({
  paymentMethodId,   // 'pix' | 'boleto' | 'visa' | 'master' | etc.
  token,             // token do cartão gerado pelo SDK JS (apenas para crédito)
  installments,      // número de parcelas (apenas para crédito)
  transactionAmount, // valor total em número
  description,
  externalReference, // orderId
  notificationUrl,
  payer,             // { email, firstName, lastName, identification?: { type, number } }
  metadata,
}) {
  const accessToken = getMercadoPagoAccessToken();

  const body = {
    transaction_amount: Number(transactionAmount),
    description: description || 'Obsidian Parfums',
    payment_method_id: paymentMethodId,
    external_reference: externalReference,
    notification_url: notificationUrl,
    payer: {
      email: payer.email,
      first_name: payer.firstName || '',
      last_name: payer.lastName || '',
      ...(payer.identification ? { identification: payer.identification } : {}),
    },
    metadata: metadata || {},
  };

  // Cartão de crédito requer token e parcelas
  if (token) {
    body.token = token;
    body.installments = Number(installments) || 1;
  }

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': externalReference,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = data.message || data.cause?.[0]?.description || data.error || 'Erro ao criar pagamento.';
    throw new Error(errMsg);
  }

  return data;
}
