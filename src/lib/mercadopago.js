import { MercadoPagoConfig, Preference } from 'mercadopago';

export function getMercadoPagoPreference() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');
  }

  const client = new MercadoPagoConfig({ accessToken });
  return new Preference(client);
}
