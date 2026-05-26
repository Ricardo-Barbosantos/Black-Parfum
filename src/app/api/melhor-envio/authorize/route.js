import { getMelhorEnvioApiUrl, getMelhorEnvioRedirectUri, getMelhorEnvioScopes } from '@/lib/melhorEnvioAuth';

export async function GET() {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;

  if (!clientId) {
    return new Response(JSON.stringify({
      error: 'MELHOR_ENVIO_CLIENT_ID não configurado.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authorizeUrl = new URL('/oauth/authorize', getMelhorEnvioApiUrl());
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', getMelhorEnvioRedirectUri());
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', getMelhorEnvioScopes());

  return Response.redirect(authorizeUrl.toString(), 302);
}
