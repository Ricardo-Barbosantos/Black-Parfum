import { put } from '@vercel/blob';
import { verify } from 'jsonwebtoken';

// Função auxiliar para verificar o token JWT
const verifyAuthToken = (token) => {
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    return decoded;
  } catch (error) {
    return null;
  }
};

export async function POST(request) {
  try {
    // 🛡️ SECURITY: Melhorar o sistema de autenticação usando JWT
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Acesso negado: Token ausente ou inválido.' }), { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);

    if (!decoded) {
      return new Response(JSON.stringify({ error: 'Acesso negado: Token inválido.' }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado." }), { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Tipo de arquivo não permitido. Apenas imagens JPEG, PNG, WEBP e GIF são aceitas." }), { status: 400 });
    }

    // Validar tamanho do arquivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: "Arquivo muito grande. O tamanho máximo é 5MB." }), { status: 400 });
    }

    // Sanitizar nome do arquivo
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!allowedExtensions.includes(fileExtension)) {
      return new Response(JSON.stringify({ error: "Extensão de arquivo não permitida." }), { status: 400 });
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `photos/${Date.now()}_${safeFilename}`;

    // Sobe o arquivo para o Vercel Blob (Nuvem)
    const blob = await put(finalFilename, file, {
      access: 'public',
    });

    return new Response(JSON.stringify({ success: true, url: blob.url }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error("Erro no Upload Vercel Blob:", error);
    return new Response(JSON.stringify({ error: 'Erro ao fazer upload na nuvem Vercel.' }), { status: 500 });
  }
}
