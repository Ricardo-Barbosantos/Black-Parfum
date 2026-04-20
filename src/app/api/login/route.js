import { generateAuthToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Verificar credenciais EXCLUSIVAMENTE via variáveis de ambiente por segurança
    const correctEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctEmail || !correctPassword) {
      console.error("ERRO: ADMIN_EMAIL ou ADMIN_PASSWORD não configurados no servidor.");
      return new Response(JSON.stringify({ error: 'Erro de configuração do servidor.' }), { status: 500 });
    }

    if (email.toLowerCase() !== correctEmail || password !== correctPassword) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), { status: 401 });
    }

    // Gerar token JWT
    const tokenPayload = {
      email: email,
      role: 'admin'
    };

    const token = generateAuthToken(tokenPayload);

    return new Response(JSON.stringify({
      success: true,
      token,
      message: 'Login realizado com sucesso.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return new Response(JSON.stringify({ error: 'Erro durante o processo de login.' }), { status: 500 });
  }
}

// Permitir requisições OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}