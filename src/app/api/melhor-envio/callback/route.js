import { exchangeMelhorEnvioCode, getMelhorEnvioRedirectUri, saveMelhorEnvioToken } from '@/lib/melhorEnvioAuth';

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
      codeBlock: getMelhorEnvioRedirectUri(),
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
    const data = await exchangeMelhorEnvioCode(code);
    const { payload, saved } = await saveMelhorEnvioToken(data);

    return htmlResponse(renderPage({
      title: saved ? 'Melhor Envio autorizado' : 'Token do Melhor Envio gerado',
      intro: saved
        ? 'Pronto. O token foi salvo no KV/Redis e o frete já pode ser calculado no checkout.'
        : 'O token foi gerado, mas não encontrei KV/Redis para salvar automaticamente. Copie estas variáveis para a Vercel como Sensitive e faça redeploy.',
      warning: saved ? '' : 'Trate estes valores como senha. Não envie por WhatsApp, print ou GitHub.',
      codeBlock: saved ? 'Você pode fechar esta página.' : `MELHOR_ENVIO_TOKEN=${payload.access_token || ''}
MELHOR_ENVIO_REFRESH_TOKEN=${payload.refresh_token || ''}
MELHOR_ENVIO_TOKEN_TYPE=${payload.token_type || 'Bearer'}`,
    }));
  } catch (callbackError) {
    return htmlResponse(renderPage({
      title: 'Erro no callback',
      intro: 'Não foi possível processar o retorno do Melhor Envio.',
      codeBlock: callbackError.message,
    }), 500);
  }
}
