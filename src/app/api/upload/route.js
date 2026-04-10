import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    // 🛡️ SECURITY: Validar Token no Upload
    const authHeader = request.headers.get('authorization');
    const correctEmail = process.env.ADMIN_EMAIL || 'admin@admin.enter';
    const correctPassword = process.env.ADMIN_PASSWORD || 'Blackparfum@2026';
    const expectedAuth = `Basic ${Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64')}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Acesso Negado! Falso Upload bloqueado.' }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado." }), { status: 400 });
    }

    // 🛡️ SECURITY: Gerar nome seguro e subir para o Vercel Blob
    const safeFilename = file.name.replaceAll(/[^a-zA-Z0-9.\-_]/g, '');
    const finalFilename = `photos/${Date.now()}_${safeFilename}`;
    
    // Sobe o arquivo para o Vercel Blob (Nuvem)
    const blob = await put(finalFilename, file, {
      access: 'public',
    });

    return new Response(JSON.stringify({ success: true, url: blob.url }), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Erro no Upload Vercel Blob:", error);
    return new Response(JSON.stringify({ error: 'Erro ao fazer upload na nuvem Vercel.' }), { status: 500 });
  }
}
