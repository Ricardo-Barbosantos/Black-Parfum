import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().min(0, "Preço deve ser positivo"),
  compareAtPrice: z.number().nullable().optional(),
  image: z.string().min(1),
  images: z.array(z.string()).optional(),
  isOnSale: z.boolean().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional()
});

const ProductsArraySchema = z.array(ProductSchema);

// Função auxiliar para verificar o token JWT
const verifyAuthToken = (token) => {
  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    return decoded;
  } catch (error) {
    return null;
  }
};

// Configuração do Redis (Caso o KV da Vercel falhe)
let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (e) { console.error("Erro ao iniciar Redis:", e); }
}

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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let products = null;
    let source = 'fallback';
    
    // 1. Tenta pegar do KV da Vercel (REST)
    if (process.env.KV_REST_API_URL) {
      try {
        products = await kv.get('black_parfum_products');
        if (products && Array.isArray(products)) source = 'kv';
      } catch (e) {}
    }
    
    // 2. Tenta pegar do Redis (Protocolo Redis) Caso o anterior falhe
    if (source === 'fallback' && redis) {
      try {
        const data = await redis.get('black_parfum_products');
        if (data) {
          products = JSON.parse(data);
          if (Array.isArray(products)) source = 'redis';
        }
      } catch (e) { console.error("Redis GET Error", e); }
    }
    
    // 3. Se tudo falhar, usa os produtos iniciais
    if (source === 'fallback') {
        products = INITIAL_PRODUCTS;
    }
    
    return new Response(JSON.stringify(products), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'X-Data-Source': source,
        'Cache-Control': 'no-store, max-age=0'
      } 
    });
  } catch (error) {
    console.error('Falha crítica no GET:', error);
    return new Response(JSON.stringify(INITIAL_PRODUCTS), { status: 200 });
  }
}

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const correctEmail = process.env.ADMIN_EMAIL;
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctEmail || !correctPassword) {
        return new Response(JSON.stringify({ error: 'Erro de configuração do servidor' }), { status: 500 });
    }

    // Verificar autenticação: suporta ambos JWT e Basic Authentication
    let isAuthenticated = false;

    if (authHeader) {
      // Tentar autenticação JWT primeiro
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyAuthToken(token);
        if (decoded) {
          isAuthenticated = true;
        }
      }
      // Caso contrário, tentar autenticação Basic
      else if (authHeader.startsWith('Basic ')) {
        const expectedAuth = `Basic ${Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64')}`;
        if (authHeader === expectedAuth) {
          isAuthenticated = true;
        }
      }
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Acesso Negado!' }), { status: 401 });
    }

    const payload = await request.json();

    // Validação com Zod
    const validation = ProductsArraySchema.safeParse(payload);
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: 'Dados inválidos',
        details: validation.error.format()
      }), { status: 400 });
    }

    const sanitizedProducts = validation.data.map(product => ({
      ...product,
      id: product.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: sanitizeString(product.name),
      brand: sanitizeString(product.brand) || 'Outra',
      category: sanitizeString(product.category) || 'Perfume',
      gender: sanitizeString(product.gender) || 'Unissex'
    }));

    let saved = false;

    // Tenta salvar no KV (REST)
    if (process.env.KV_REST_API_URL) {
      try {
        await kv.set('black_parfum_products', sanitizedProducts);
        saved = true;
      } catch (e) {}
    }

    // Tenta salvar no Redis (Protocolo)
    if (!saved && redis) {
       await redis.set('black_parfum_products', JSON.stringify(sanitizedProducts));
       saved = true;
    }

    if (!saved) throw new Error("Nenhum banco de dados disponível (KV ou REDIS_URL)");

    return new Response(JSON.stringify({ success: true, products: sanitizedProducts, source: saved ? 'cloud' : 'fail' }), { status: 200 });
  } catch (error) {
    console.error('ERRO AO SALVAR NO BANCO:', error);
    return new Response(JSON.stringify({ error: 'Erro ao salvar no banco de dados: ' + error.message }), { status: 500 });
  }
}
