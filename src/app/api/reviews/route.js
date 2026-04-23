import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';

const ReviewSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1),
  text: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  date: z.string().optional()
});

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (e) { console.error("Erro ao iniciar Redis:", e); }
}

const getReviews = async () => {
    let reviews = [];
    if (process.env.KV_REST_API_URL) {
        try { reviews = await kv.get('black_parfum_reviews') || []; } catch(e) {}
    } else if (redis) {
        try { 
            const data = await redis.get('black_parfum_reviews'); 
            if(data) reviews = JSON.parse(data);
        } catch(e) {}
    }
    return reviews;
}

const saveReviews = async (reviews) => {
    let saved = false;
    if (process.env.KV_REST_API_URL) {
        try { await kv.set('black_parfum_reviews', reviews); saved = true; } catch(e) {}
    }
    if (!saved && redis) {
        try { await redis.set('black_parfum_reviews', JSON.stringify(reviews)); saved = true; } catch(e) {}
    }
    return saved;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const all = searchParams.get('all'); // admin flag

    let reviews = await getReviews();
    
    if (productId) {
        reviews = reviews.filter(r => r.productId === productId && (r.status === 'approved' || all));
    } else if (!all) {
       reviews = reviews.filter(r => r.status === 'approved');
    }

    return new Response(JSON.stringify(reviews), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const validation = ReviewSchema.safeParse(payload);
        if (!validation.success) {
            return new Response(JSON.stringify({ error: 'Dados inválidos', details: validation.error.format() }), { status: 400 });
        }
        
        const review = {
            ...validation.data,
            id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString(),
            status: 'pending' // always pending initially
        };

        const reviews = await getReviews();
        reviews.push(review);
        await saveReviews(reviews);

        return new Response(JSON.stringify({ success: true, review }), { status: 201 });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Erro ao salvar review' }), { status: 500 });
    }
}

export async function PUT(request) {
    // Admin only for modifying reviews
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });

    try {
        const payload = await request.json();
        const { id, status, action } = payload;
        
        let reviews = await getReviews();
        if (action === 'delete') {
            reviews = reviews.filter(r => r.id !== id);
        } else {
            const index = reviews.findIndex(r => r.id === id);
            if (index > -1) reviews[index].status = status;
        }

        await saveReviews(reviews);
        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e) {
        return new Response(JSON.stringify({ error: 'Erro ao atualizar review' }), { status: 500 });
    }
}
