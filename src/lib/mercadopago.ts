import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function getAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  return accessToken;
}

export function getMercadoPagoPreference() {
  const client = new MercadoPagoConfig({ accessToken: getAccessToken() });
  return new Preference(client);
}

export function getMercadoPagoPayment() {
  const client = new MercadoPagoConfig({ accessToken: getAccessToken() });
  return new Payment(client);
}
