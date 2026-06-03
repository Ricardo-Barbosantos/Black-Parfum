import { z } from 'zod';
import { getAdminFromRequest } from '@/lib/auth';
import { getCoupons, saveCoupons } from '@/lib/coupons';

const CouponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(32),
  discountPercent: z.number().min(0.01).max(80),
  influencerName: z.string().max(80).optional(),
  commissionPercent: z.number().min(0).max(80).optional(),
  commissionFixed: z.number().min(0).max(100000).optional(),
  active: z.boolean().optional(),
  createdAt: z.string().optional(),
});

const CouponsSchema = z.array(CouponSchema).max(200);

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request) {
  if (!getAdminFromRequest(request)) return unauthorized();

  const coupons = await getCoupons();
  return new Response(JSON.stringify({ coupons }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request) {
  if (!getAdminFromRequest(request)) return unauthorized();

  try {
    const payload = await request.json();
    const validation = CouponsSchema.safeParse(payload);

    if (!validation.success) {
      return new Response(JSON.stringify({
        error: 'Dados de cupom invalidos.',
        details: validation.error.format(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const coupons = await saveCoupons(validation.data);
    return new Response(JSON.stringify({ success: true, coupons }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao salvar cupons:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao salvar cupons.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
