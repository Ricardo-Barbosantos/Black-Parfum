import { kv } from '@vercel/kv';
import Redis from 'ioredis';

const TOKEN_KEY = 'obsidian_melhor_envio_token';
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const DEFAULT_API_URL = 'https://melhorenvio.com.br';

let redis = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Erro ao iniciar Redis do Melhor Envio:', error);
  }
}

export function getMelhorEnvioApiUrl() {
  const rawUrl = process.env.MELHOR_ENVIO_API_URL || DEFAULT_API_URL;

  try {
    const url = new URL(rawUrl.trim());
    if (url.hostname === 'www.melhorenvio.com.br') {
      url.hostname = 'melhorenvio.com.br';
    }
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_API_URL;
  }
}

export function getMelhorEnvioRedirectUri() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsidianparfums.site';
  return process.env.MELHOR_ENVIO_REDIRECT_URI || `${siteUrl}/api/melhor-envio/callback`;
}

export function getMelhorEnvioScopes() {
  return process.env.MELHOR_ENVIO_SCOPES || 'shipping-calculate';
}

function buildTokenPayload(data) {
  const expiresIn = Number(data.expires_in || 0);

  return {
    access_token: data.access_token || '',
    refresh_token: data.refresh_token || '',
    token_type: data.token_type || 'Bearer',
    expires_in: expiresIn,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : null,
    updated_at: new Date().toISOString(),
  };
}

async function getStoredToken() {
  if (process.env.KV_REST_API_URL) {
    try {
      const token = await kv.get(TOKEN_KEY);
      if (token?.access_token) return token;
    } catch (error) {
      console.error('Erro ao ler token Melhor Envio no KV:', error);
    }
  }

  if (redis) {
    try {
      const data = await redis.get(TOKEN_KEY);
      if (data) return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler token Melhor Envio no Redis:', error);
    }
  }

  if (process.env.MELHOR_ENVIO_TOKEN) {
    return {
      access_token: process.env.MELHOR_ENVIO_TOKEN,
      refresh_token: process.env.MELHOR_ENVIO_REFRESH_TOKEN || '',
      token_type: process.env.MELHOR_ENVIO_TOKEN_TYPE || 'Bearer',
      expires_at: null,
    };
  }

  return null;
}

export async function saveMelhorEnvioToken(data) {
  const payload = buildTokenPayload(data);

  if (!payload.access_token) {
    throw new Error('Resposta do Melhor Envio sem access_token.');
  }

  let saved = false;

  if (process.env.KV_REST_API_URL) {
    await kv.set(TOKEN_KEY, payload);
    saved = true;
  }

  if (redis) {
    await redis.set(TOKEN_KEY, JSON.stringify(payload));
    saved = true;
  }

  return { payload, saved };
}

export async function exchangeMelhorEnvioCode(code) {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET precisam estar configurados.');
  }

  const response = await fetch(`${getMelhorEnvioApiUrl()}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getMelhorEnvioRedirectUri(),
      code,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Erro ao trocar o código por token do Melhor Envio.');
  }

  return data;
}

async function refreshMelhorEnvioToken(refreshToken) {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Token do Melhor Envio expirado. Autorize o aplicativo novamente.');
  }

  const response = await fetch(`${getMelhorEnvioApiUrl()}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Erro ao renovar token do Melhor Envio.');
  }

  return saveMelhorEnvioToken(data);
}

export async function getMelhorEnvioAccessToken() {
  const token = await getStoredToken();

  if (!token?.access_token) {
    throw new Error('Melhor Envio ainda não foi autorizado.');
  }

  if (!token.expires_at || Date.now() < Number(token.expires_at) - TOKEN_REFRESH_MARGIN_MS) {
    return token.access_token;
  }

  const refreshed = await refreshMelhorEnvioToken(token.refresh_token);
  return refreshed.payload.access_token;
}
