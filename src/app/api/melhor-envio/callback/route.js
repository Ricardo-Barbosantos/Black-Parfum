function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsidianparfums.site';
}

function getRedirectUri() {
  return process.env.MELHOR_ENVIO_REDIRECT_URI || `${getBaseUrl()}/api/melhor-envio/callback`;
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function renderPage({ title, intro, codeBlock, warning }) {
  return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body { margin: 0; background: #070707; color: #f7f1df; font-family: Arial, sans-serif; }
          main { max-width: 760px; margin: 0 auto; padding: 48px 20px; }
          h1 { color: #c9a84c; font-size: 28px; margin: 0 0 12px; }
          p { color: #d8d1bd; line-height: 1.6; }
          pre { white-space: pre-wrap; word-break: break-word; background: #111; border: 1px solid #2b2414; color: #fff; padding: 18px; border-radius: 8px; }
          .warn { background: rgba(201,168,76,.12); border: 1px solid rgba(201,168,76,.35); padding: 14px; border-radius: 8px; color: #f4e7c3; }
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p>${intro}</p>
          ${warning ? `<p class="warn">${warning}</p>` : ''}
          ${codeBlock ? `<pre>${codeBlock}</pre>` : ''}
        </main>
      </body>
    </html>`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return htmlResponse(renderPage({
      title: 'Autorização recusada',
      intro: `O Melhor Envio retornou erro: ${error}.`,
    }), 400);
  }

  if (!code) {
    return htmlResponse(renderPage({
      title: 'Callback do Melhor Envio ativo',
      intro: 'Use esta URL como redirecionamento após autorização no cadastro do aplicativo Melhor Envio.',
      codeBlock: getRedirectUri(),
    }));
  }

  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return htmlResponse(renderPage({
      title: 'Código recebido',
      intro: 'O Melhor Envio enviou o código de autorização, mas ainda faltam MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET na Vercel para trocar esse código por token automaticamente.',
      codeBlock: `MELHOR_ENVIO_AUTH_CODE=${code}`,
      warning: 'Depois de adicionar Client ID e Client Secret na Vercel, autorize novamente para gerar o token final.',
    }));
  }

  try {
    const apiUrl = process.env.MELHOR_ENVIO_API_URL || 'https://www.melhorenvio.com.br';
    const response = await fetch(`${apiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(),
        code,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return htmlResponse(renderPage({
        title: 'Erro ao gerar token',
        intro: 'O Melhor Envio retornou erro ao trocar o código por token.',
        codeBlock: JSON.stringify(data, null, 2),
      }), 500);
    }

    return htmlResponse(renderPage({
      title: 'Token do Melhor Envio gerado',
      intro: 'Copie estas variáveis para a Vercel como Sensitive. Depois faça redeploy.',
      warning: 'Trate estes valores como senha. Não envie por WhatsApp, print ou GitHub.',
      codeBlock: `MELHOR_ENVIO_TOKEN=${data.access_token || ''}
MELHOR_ENVIO_REFRESH_TOKEN=${data.refresh_token || ''}
MELHOR_ENVIO_TOKEN_TYPE=${data.token_type || 'Bearer'}
MELHOR_ENVIO_TOKEN_EXPIRES_IN=${data.expires_in || ''}`,
    }));
  } catch (callbackError) {
    return htmlResponse(renderPage({
      title: 'Erro no callback',
      intro: 'Não foi possível processar o retorno do Melhor Envio.',
      codeBlock: callbackError.message,
    }), 500);
  }
}
