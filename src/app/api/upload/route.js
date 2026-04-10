import { promises as fs } from 'fs';
import path from 'path';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 🛡️ SECURITY: Impedir Path Traversal (evitar filenames hackers como "../../../etc/passwd")
    // Limpamos o nome do arquivo, removendo espaços e caracteres perigosos.
    const safeFilename = file.name.replaceAll(/[^a-zA-Z0-9.\-_]/g, '');
    const finalFilename = `${Date.now()}_${safeFilename}`;
    
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    
    // Garante que a pasta existe
    await fs.mkdir(photosDir, { recursive: true });
    
    // Salva o arquivo em public/photos/
    await fs.writeFile(path.join(photosDir, finalFilename), buffer);

    return new Response(JSON.stringify({ success: true, url: `/photos/${finalFilename}` }), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Erro no Upload:", error);
    return new Response(JSON.stringify({ error: 'Erro ao fazer upload no servidor.' }), { status: 500 });
  }
}
