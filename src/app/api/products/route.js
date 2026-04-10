import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

// Função de Sanitização: Remove tentativas de injeção de script (XSS)
const sanitizeString = (str) => {
  if (typeof str !== 'string' || !str) return '';
  return str.replace(/<[^>]*>?/gm, ''); 
};

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    return new Response(fileContents, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro ao carregar os produtos' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // 🛡️ SECURITY 1: Basic Authentication
    const authHeader = request.headers.get('authorization');
    const correctEmail = process.env.ADMIN_EMAIL || 'admin@admin.enter';
    const correctPassword = process.env.ADMIN_PASSWORD || 'Blackparfum@2026';
    const expectedAuth = `Basic ${Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64')}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Acesso Negado! Tentativa bloqueada.' }), { status: 401 });
    }

    const payload = await request.json();
    
    // 🛡️ SECURITY 2: Validação de Estrutura do Payload (Anti JSON-Injection)
    if (!Array.isArray(payload)) {
      return new Response(JSON.stringify({ error: 'Payload inválido. Esperado um array.' }), { status: 400 });
    }

    // 🛡️ SECURITY 3: Sanitização Limpa (Anti XSS)
    const sanitizedProducts = payload.map(product => {
      return {
        id: sanitizeString(String(product.id)),
        name: sanitizeString(product.name),
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        compareAtPrice: product.compareAtPrice ? (typeof product.compareAtPrice === 'number' ? product.compareAtPrice : parseFloat(product.compareAtPrice)) : null,
        image: sanitizeString(product.image),
        images: Array.isArray(product.images) ? product.images.map(img => sanitizeString(img)) : [sanitizeString(product.image)],
        isOnSale: Boolean(product.isOnSale),
        rating: typeof product.rating === 'number' ? product.rating : parseFloat(product.rating) || 5,
        discountPercent: typeof product.discountPercent === 'number' ? product.discountPercent : parseInt(product.discountPercent) || 0,
        installments: sanitizeString(product.installments),
        category: sanitizeString(product.category) || 'Perfume',
        brand: sanitizeString(product.brand) || 'Outra',
        gender: sanitizeString(product.gender) || 'Unissex'
      };
    });

    await fs.writeFile(dataFilePath, JSON.stringify(sanitizedProducts, null, 2), 'utf8');
    return new Response(JSON.stringify({ success: true, products: sanitizedProducts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Erro na API de Produtos:', error);
    return new Response(JSON.stringify({ error: 'Erro ao atualizar os produtos no disco' }), { status: 500 });
  }
}
