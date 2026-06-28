import { z } from 'zod';
import { getAdminFromRequest, verifyAuthToken } from '@/lib/auth';
import { getProducts, saveProducts, INITIAL_PRODUCTS, stripAdminProductFields } from '@/lib/products';

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().min(0, "Preço deve ser positivo"),
  compareAtPrice: z.number().nullable().optional(),
  image: z.string().min(1),
  images: z.array(z.string()).optional(),
  isOnSale: z.boolean().optional(),
  active: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  dupeOf: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  sizes: z.string().optional(),
  description: z.string().optional(),
  topNotes: z.string().optional(),
  heartNotes: z.string().optional(),
  baseNotes: z.string().optional(),
  olfactoryFamily: z.string().optional(),
  videoUrl: z.string().optional()
});

const ProductsArraySchema = z.array(ProductSchema);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const products = await getProducts();
    const responseProducts = getAdminFromRequest(request)
      ? products
      : products.map(stripAdminProductFields);

    return new Response(JSON.stringify(responseProducts), {
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      } 
    });
  } catch (error) {
    console.error('Falha crítica no GET:', error);
    return new Response(JSON.stringify(INITIAL_PRODUCTS.map(stripAdminProductFields)), { status: 200 });
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
      else if (false && authHeader.startsWith('Basic ')) {
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

    const sanitizedProducts = await saveProducts(validation.data);

    return new Response(JSON.stringify({ success: true, products: sanitizedProducts, source: 'cloud' }), { status: 200 });
  } catch (error) {
    console.error('ERRO AO SALVAR NO BANCO:', error);
    return new Response(JSON.stringify({ error: 'Erro ao salvar no banco de dados: ' + error.message }), { status: 500 });
  }
}
