import { z } from 'zod';
import {
  calculateCouponDiscount,
  getActiveCouponByCode,
  normalizeCouponCode,
} from '@/lib/coupons';

const ValidateCouponSchema = z.object({
  code: z.string().min(1).max(32),
  subtotal: z.number().min(0),
});

export async function POST(request) {
  try {
    const payload = await request.json();
    const validation = ValidateCouponSchema.safeParse(payload);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Cupom invalido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const code = normalizeCouponCode(validation.data.code);
    const coupon = await getActiveCouponByCode(code);

    if (!coupon) {
      return new Response(JSON.stringify({ error: 'Cupom nao encontrado ou inativo.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const discountAmount = calculateCouponDiscount(validation.data.subtotal, coupon);

    return new Response(JSON.stringify({
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        influencerName: coupon.influencerName,
        commissionPercent: coupon.commissionPercent,
        commissionFixed: coupon.commissionFixed,
      },
      discountAmount,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return new Response(JSON.stringify({ error: 'Erro ao validar cupom.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
