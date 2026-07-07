import crypto from 'crypto';

export const sendToMetaCAPI = async ({
  eventName,
  eventTime = Math.floor(Date.now() / 1000),
  eventId,
  userData,
  customData,
  eventSourceUrl,
}) => {
  const pixelId = '1531972801990161'; // Explicitly set as requested
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('CAPI ignorado: META_ACCESS_TOKEN não está configurado.');
    return;
  }

  const hash = (str) => {
    if (!str) return undefined;
    return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
  };

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime,
        action_source: 'website',
        event_id: eventId,
        event_source_url: eventSourceUrl || 'https://obsidianparfums.com.br',
        user_data: {
          client_ip_address: userData.client_ip_address,
          client_user_agent: userData.client_user_agent,
          em: hash(userData.em), // Email hash
          ph: hash(userData.ph?.replace(/\D/g, '')), // Phone hash
          fn: hash(userData.fn),
          ln: hash(userData.ln),
          zp: hash(userData.zp?.replace(/\D/g, '')),
          ct: hash(userData.ct),
          st: hash(userData.st),
          country: hash('BR'),
        },
        custom_data: {
          currency: customData.currency || 'BRL',
          value: customData.value,
          content_name: customData.content_name,
          content_type: customData.content_type || 'product',
          content_ids: customData.content_ids,
          num_items: customData.num_items,
        },
      },
    ],
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.error) {
      console.error('Meta CAPI Error:', result.error);
    } else {
      console.log(`CAPI Event [${eventName}] Sent Successfully:`, result);
    }
  } catch (err) {
    console.error('Failed to send Meta CAPI request:', err);
  }
};
