import { getMelhorEnvioAccessToken, getMelhorEnvioApiUrl } from './melhorEnvioAuth';

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

function getQuoteZip(value = '') {
  const zip = normalizeZip(value);

  if (zip.length === 8) return zip;
  if (zip.length === 7 && zip.endsWith('000')) return `${zip}0`;
  if (zip.length === 6 && zip.endsWith('000')) return `${zip}00`;

  return zip;
}

function getApiErrorMessage(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    return [...new Set(data.map((item) => {
      if (!item?.error) return '';
      if (typeof item.error === 'string') return item.error;
      if (typeof item.error === 'object') {
        return Object.values(item.error).flat().filter(Boolean).join(' ');
      }
      return String(item.error);
    }).filter(Boolean))]
      .slice(0, 3)
      .join(' ');
  }

  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors)
      .flat()
      .filter(Boolean);

    if (messages.length > 0) return messages.join(' ');
  }

  return data.message || data.error || '';
}

function getServicePrice(service) {
  const value = service.custom_price ?? service.price;
  const price = Number(value);

  return Number.isFinite(price) && price > 0 ? price : null;
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
  const token = await getMelhorEnvioAccessToken();
  const originZip = getQuoteZip(process.env.MELHOR_ENVIO_ORIGIN_ZIP || '');
  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT || 'Obsidian Parfums (contato@obsidianparfums.site)';
  const apiUrl = getMelhorEnvioApiUrl();
  const cleanDestinationZip = getQuoteZip(destinationZip);

  if (!token || !process.env.MELHOR_ENVIO_ORIGIN_ZIP) {
    throw new Error('Melhor Envio ainda não está configurado.');
  }

  if (originZip.length !== 8) {
    throw new Error('CEP de origem do Melhor Envio inválido. Confira MELHOR_ENVIO_ORIGIN_ZIP na Vercel.');
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
    throw new Error(getApiErrorMessage(data) || 'Não foi possível calcular o frete.');
  }

  const quotes = Array.isArray(data) ? data : [];
  const options = quotes
    .map((service) => ({
      service,
      price: getServicePrice(service),
    }))
    .filter((quote) => quote.price && !quote.service.error)
    .map((quote) => ({
      id: String(quote.service.id),
      name: quote.service.name,
      company: quote.service.company?.name || 'Transportadora',
      price: quote.price,
      deliveryTime: quote.service.custom_delivery_time ?? quote.service.delivery_time,
      label: `${quote.service.company?.name || 'Transportadora'} - ${quote.service.name}`,
    }))
    .sort((a, b) => a.price - b.price);

  if (!options.length) {
    throw new Error(getApiErrorMessage(quotes) || 'Nenhuma opção de frete encontrada para esse CEP.');
  }

  return options;
}
