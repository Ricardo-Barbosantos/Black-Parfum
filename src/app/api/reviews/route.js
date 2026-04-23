import { getReviews, saveReviews } from '@/lib/reviews';
import { verifyAuthToken } from '@/lib/auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const ReviewSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  text: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  date: z.string().optional()
});

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
            id: `rev_${randomUUID()}`,
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);
    if (!decoded || decoded.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
    }

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
