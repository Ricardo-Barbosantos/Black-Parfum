export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    const correctEmail = process.env.ADMIN_EMAIL || 'admin@admin.enter';
    const correctPassword = process.env.ADMIN_PASSWORD || 'Blackparfum@2026';
    
    // Proteção Timing Attack básica
    if (email === correctEmail && password === correctPassword) {
      // Cria o token Base64 do Basic Auth
      const token = Buffer.from(`${email}:${password}`).toString('base64');
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'E-mail ou Senha incorretos.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro no servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
