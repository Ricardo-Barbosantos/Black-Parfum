import { kv } from '@vercel/kv';

// 🛡️ REDE DE SEGURANÇA: Produtos iniciais caso o Banco de Dados ou o Arquivo falhem
const INITIAL_PRODUCTS = [
  {
    "id": "al-haramain",
    "name": "Al Haramain Miracle Dubai Eau de Parfum",
    "price": 500,
    "compareAtPrice": 999,
    "image": "/photos/1775830308715_Gemini_Generated_Image_4ftic54ftic54fti.png",
    "images": ["/photos/1775830308715_Gemini_Generated_Image_4ftic54ftic54fti.png"],
    "isOnSale": false,
    "rating": 5,
    "discountPercent": 20,
    "installments": "ou 8x de R$ 94,76",
    "category": "Perfume",
    "brand": "Paris Elysees",
    "gender": "Masculino"
  },
  {
    "id": "al-wataniah",
    "name": "Al Wataniah Bareeq Al Dhahab Eau de Parfum",
    "price": 312.55,
    "compareAtPrice": 359,
    "image": "/perfume.jpg",
    "images": ["/perfume.jpg"],
    "isOnSale": true,
    "rating": 5,
    "discountPercent": 8,
    "installments": "ou 8x de R$ 39,06",
    "category": "Perfume",
    "brand": "Outra",
    "gender": "Unissex"
  }
];

// Função de Sanitização
const sanitizeString = (str) => {
  if (typeof str !== 'string' || !str) return '';
  return str.replace(/<[^>]*>?/gm, ''); 
};

export async function GET() {
  try {
    let products = null;
    
    // 1. Tenta pegar da Nuvem (KV)
    if (process.env.KV_REST_API_URL) {
      try {
        products = await kv.get('black_parfum_products');
      } catch (e) { console.error("KV GET Error", e); }
    }
    
    // 2. Se falhar, usa os produtos CHUMBADOS (Garante que o site abre)
    if (!products || !Array.isArray(products)) {
        products = INITIAL_PRODUCTS;
        // Tenta salvar no KV para as próximas vezes
        if (process.env.KV_REST_API_URL) {
           await kv.set('black_parfum_products', products);
        }
    }
    
    return new Response(JSON.stringify(products), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Falha crítica no GET:', error);
    // Retorno de emergência absoluta
    return new Response(JSON.stringify(INITIAL_PRODUCTS), { status: 200 });
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const correctEmail = process.env.ADMIN_EMAIL || 'admin@admin.enter';
    const correctPassword = process.env.ADMIN_PASSWORD || 'Blackparfum@2026';
    const expectedAuth = `Basic ${Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64')}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Acesso Negado!' }), { status: 401 });
    }

    const payload = await request.json();
    if (!Array.isArray(payload)) return new Response("Inválido", { status: 400 });

    const sanitizedProducts = payload.map(product => ({
      id: sanitizeString(String(product.id)),
      name: sanitizeString(product.name),
      price: Number(product.price) || 0,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      image: sanitizeString(product.image),
      images: Array.isArray(product.images) ? product.images.map(img => sanitizeString(img)) : [sanitizeString(product.image)],
      isOnSale: Boolean(product.isOnSale),
      brand: sanitizeString(product.brand) || 'Outra',
      category: sanitizeString(product.category) || 'Perfume',
      gender: sanitizeString(product.gender) || 'Unissex'
    }));

    // Salva na Nuvem (KV)
    if (process.env.KV_REST_API_URL) {
        await kv.set('black_parfum_products', sanitizedProducts);
    }

    return new Response(JSON.stringify({ success: true, products: sanitizedProducts }), { status: 200 });
  } catch (error) {
    console.error('Falha crítica no PUT:', error);
    return new Response(JSON.stringify({ error: 'Erro ao salvar' }), { status: 500 });
  }
}
