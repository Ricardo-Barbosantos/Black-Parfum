export const FREE_SHIPPING_CITY = "Vitória da Conquista";
export const FREE_SHIPPING_LABEL = `Frete grátis para ${FREE_SHIPPING_CITY}`;

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeZip(zip = "") {
  return zip.replace(/\D/g, "");
}

function getPackageConfig() {
  return {
    width: Number(process.env.MELHOR_ENVIO_PACKAGE_WIDTH || 12),
    height: Number(process.env.MELHOR_ENVIO_PACKAGE_HEIGHT || 4),
    length: Number(process.env.MELHOR_ENVIO_PACKAGE_LENGTH || 16),
    weight: Number(process.env.MELHOR_ENVIO_PACKAGE_WEIGHT || 0.3),
    insurance_value: 0,
    quantity: 1,
  };
}

export function isFreeShippingRegion(city = "") {
  return normalizeText(city) === normalizeText(FREE_SHIPPING_CITY);
}

export function assertShippingEnv() {
  const required = {
    MELHOR_ENVIO_TOKEN: process.env.MELHOR_ENVIO_TOKEN,
    MELHOR_ENVIO_ORIGIN_ZIP: process.env.MELHOR_ENVIO_ORIGIN_ZIP,
    MELHOR_ENVIO_USER_AGENT: process.env.MELHOR_ENVIO_USER_AGENT,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Configure as variáveis do Melhor Envio: ${missing.join(", ")}.`);
  }
}

export async function calculateMelhorEnvioShipping({ destinationZip, subtotal }) {
  assertShippingEnv();

  const toPostalCode = normalizeZip(destinationZip);
  const fromPostalCode = normalizeZip(process.env.MELHOR_ENVIO_ORIGIN_ZIP);

  if (toPostalCode.length !== 8) {
    throw new Error("CEP de destino inválido.");
  }

  if (fromPostalCode.length !== 8) {
    throw new Error("CEP de origem do Melhor Envio inválido.");
  }

  const apiUrl = process.env.MELHOR_ENVIO_API_URL || "https://www.melhorenvio.com.br";
  const response = await fetch(`${apiUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
      "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT,
    },
    body: JSON.stringify({
      from: { postal_code: fromPostalCode },
      to: { postal_code: toPostalCode },
      products: [
        {
          id: "combo-decantes",
          width: getPackageConfig().width,
          height: getPackageConfig().height,
          length: getPackageConfig().length,
          weight: getPackageConfig().weight,
          insurance_value: Number(subtotal),
          quantity: 1,
        },
      ],
      options: {
        receipt: false,
        own_hand: false,
        collect: false,
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao calcular frete no Melhor Envio.");
  }

  return data
    .filter((service) => service.price && !service.error)
    .map((service) => ({
      serviceId: String(service.id),
      serviceName: service.name,
      companyName: service.company?.name,
      price: Number(service.price),
      deliveryTime: service.delivery_time,
      label: `${service.company?.name || "Transportadora"} - ${service.name}`,
    }))
    .sort((a, b) => a.price - b.price);
}

export async function getShippingQuote({ city, destinationZip, subtotal, selectedServiceId }) {
  if (isFreeShippingRegion(city)) {
    return {
      freeShipping: true,
      shippingCost: 0,
      shippingLabel: FREE_SHIPPING_LABEL,
      shippingServiceId: "free-vdc",
      shippingServiceName: FREE_SHIPPING_LABEL,
      shippingDeliveryTime: null,
      options: [],
    };
  }

  const options = await calculateMelhorEnvioShipping({ destinationZip, subtotal });

  if (options.length === 0) {
    throw new Error("Nenhuma opção de frete disponível para esse CEP.");
  }

  const selectedOption =
    options.find((option) => option.serviceId === String(selectedServiceId)) || options[0];

  return {
    freeShipping: false,
    shippingCost: selectedOption.price,
    shippingLabel: selectedOption.label,
    shippingServiceId: selectedOption.serviceId,
    shippingServiceName: selectedOption.serviceName,
    shippingDeliveryTime: selectedOption.deliveryTime,
    options,
  };
}
