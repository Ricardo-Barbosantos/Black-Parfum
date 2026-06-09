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
