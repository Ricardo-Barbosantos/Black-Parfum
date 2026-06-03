import { kv } from '@vercel/kv';
import Redis from 'ioredis';

const COUPONS_KEY = 'obsidian_coupons';

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Erro ao iniciar Redis de cupons:', error);
  }
}

function cleanText(value = '') {
  return String(value).replace(/<[^>]*>?/gm, '').trim();
}

export function normalizeCouponCode(value = '') {
  return cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 32);
}

function clampPercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 80);
}

function clampMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Number(Math.min(Math.max(number, 0), 100000).toFixed(2));
}

export function sanitizeCoupon(coupon = {}) {
  const code = normalizeCouponCode(coupon.code);

  return {
    id: cleanText(coupon.id) || `coupon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    code,
    discountPercent: clampPercent(coupon.discountPercent),
    influencerName: cleanText(coupon.influencerName).slice(0, 80),
    commissionPercent: clampPercent(coupon.commissionPercent),
    commissionFixed: clampMoney(coupon.commissionFixed),
    active: coupon.active !== false,
    createdAt: cleanText(coupon.createdAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getCoupons() {
  let coupons = [];

  if (process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get(COUPONS_KEY);
      if (Array.isArray(data)) coupons = data;
    } catch (error) {
      console.error('Erro ao ler cupons no KV:', error);
    }
  }

  if (!coupons.length && redis) {
    try {
      const data = await redis.get(COUPONS_KEY);
      if (data) coupons = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler cupons no Redis:', error);
    }
  }

  return Array.isArray(coupons)
    ? coupons.map(sanitizeCoupon).filter((coupon) => coupon.code && coupon.discountPercent > 0)
    : [];
}

export async function saveCoupons(coupons = []) {
  const seen = new Set();
  const sanitizedCoupons = coupons
    .map(sanitizeCoupon)
    .filter((coupon) => {
      if (!coupon.code || coupon.discountPercent <= 0 || seen.has(coupon.code)) return false;
      seen.add(coupon.code);
      return true;
    });

  let saved = false;

  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(COUPONS_KEY, sanitizedCoupons);
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar cupons no KV:', error);
    }
  }

  if (!saved && redis) {
    try {
      await redis.set(COUPONS_KEY, JSON.stringify(sanitizedCoupons));
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar cupons no Redis:', error);
    }
  }

  if (!saved) {
    throw new Error('Nenhum banco de dados disponivel para salvar cupons.');
  }

  return sanitizedCoupons;
}

export async function getActiveCouponByCode(code) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;

  const coupons = await getCoupons();
  return coupons.find((coupon) => coupon.active && coupon.code === normalizedCode) || null;
}

export function calculateCouponDiscount(subtotal, coupon) {
  const value = Number(subtotal || 0);
  if (!coupon || !Number.isFinite(value) || value <= 0) return 0;

  const discount = value * (Number(coupon.discountPercent || 0) / 100);
  return Number(Math.min(value, discount).toFixed(2));
}

export function calculateInfluencerCommission(discountedSubtotal, coupon) {
  if (!coupon) return 0;

  if (Number(coupon.commissionFixed || 0) > 0) {
    return Number(coupon.commissionFixed.toFixed(2));
  }

  const base = Number(discountedSubtotal || 0);
  const commission = base * (Number(coupon.commissionPercent || 0) / 100);
  return Number(Math.max(0, commission).toFixed(2));
}
