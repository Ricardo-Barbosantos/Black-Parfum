export const FREE_SHIPPING_CITY = 'Vitória da Conquista';

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeZip(value = '') {
  return value.replace(/\D/g, '');
}

export function isFreeShippingRegion(city = '') {
  return normalizeText(city).includes(normalizeText(FREE_SHIPPING_CITY));
}

export function getLocalShippingQuote({ deliveryMethod, city }) {
  if (deliveryMethod === 'pickup') {
    return {
      cost: 0,
      label: 'Retirada na loja',
      free: true,
    };
  }

  if (isFreeShippingRegion(city)) {
    return {
      cost: 0,
      label: `Frete grátis para ${FREE_SHIPPING_CITY}`,
      free: true,
    };
  }

  return null;
}

export async function calculateMelhorEnvioShipping({ destinationZip, subtotal }) {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const originZip = normalizeZip(process.env.MELHOR_ENVIO_ORIGIN_ZIP || '');
  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT || 'Obsidian Parfums (contato@obsidianparfums.site)';
  const apiUrl = process.env.MELHOR_ENVIO_API_URL || 'https://www.melhorenvio.com.br';
  const cleanDestinationZip = normalizeZip(destinationZip);

  if (!token || !originZip) {
    throw new Error('Melhor Envio ainda não está configurado.');
  }

  if (cleanDestinationZip.length !== 8) {
    throw new Error('CEP inválido para cálculo de frete.');
  }

  const response = await fetch(`${apiUrl}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent,
    },
    body: JSON.stringify({
      from: { postal_code: originZip },
      to: { postal_code: cleanDestinationZip },
      products: [
        {
          id: 'pedido-obsidian',
          width: Number(process.env.MELHOR_ENVIO_PACKAGE_WIDTH || 12),
          height: Number(process.env.MELHOR_ENVIO_PACKAGE_HEIGHT || 4),
          length: Number(process.env.MELHOR_ENVIO_PACKAGE_LENGTH || 16),
          weight: Number(process.env.MELHOR_ENVIO_PACKAGE_WEIGHT || 0.3),
          insurance_value: Number(subtotal || 0),
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

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível calcular o frete.');
  }

  return data
    .filter((service) => service.price && !service.error)
    .map((service) => ({
      id: String(service.id),
      name: service.name,
      company: service.company?.name || 'Transportadora',
      price: Number(service.price),
      deliveryTime: service.delivery_time,
      label: `${service.company?.name || 'Transportadora'} - ${service.name}`,
    }))
    .sort((a, b) => a.price - b.price);
}
