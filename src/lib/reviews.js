import { kv } from '@vercel/kv';
import Redis from 'ioredis';

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (e) {
    console.error("Erro ao iniciar Redis:", e);
  }
}

export const getReviews = async () => {
  let reviews = [];
  if (process.env.KV_REST_API_URL) {
    try {
      reviews = await kv.get('obsidian_reviews') || await kv.get('black_parfum_reviews') || [];
    } catch (e) {}
  } else if (redis) {
    try {
      let data = await redis.get('obsidian_reviews');
      if (!data) data = await redis.get('black_parfum_reviews');
      if (data) reviews = JSON.parse(data);
    } catch (e) {}
  }
  return reviews;
};

export const saveReviews = async (reviews) => {
  let saved = false;
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set('obsidian_reviews', reviews);
      saved = true;
    } catch (e) {}
  }
  if (!saved && redis) {
    try {
      await redis.set('obsidian_reviews', JSON.stringify(reviews));
      saved = true;
    } catch (e) {}
  }
  return saved;
};
