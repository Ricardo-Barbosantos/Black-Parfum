import { kv } from '@vercel/kv';
import Redis from 'ioredis';

export const PRODUCTS_KEY = 'obsidian_products';
const LEGACY_PRODUCTS_KEY = 'black_parfum_products';

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Erro ao iniciar Redis de produtos:', error);
  }
}

export const INITIAL_PRODUCTS = [
  {
    id: 'al-haramain',
    name: 'Al Haramain Miracle Dubai Eau de Parfum',
    price: 500,
    compareAtPrice: 999,
    image: '/photos/1775830308715_Gemini_Generated_Image_4ftic54ftic54fti.png',
    images: ['/photos/1775830308715_Gemini_Generated_Image_4ftic54ftic54fti.png'],
    isOnSale: false,
    active: true,
    soldOut: false,
    stock: null,
    purchasePrice: null,
    dupeOf: '',
    rating: 5,
    discountPercent: 20,
    installments: 'ou 8x de R$ 94,76',
    category: 'Perfume',
    brand: 'Paris Elysees',
    gender: 'Masculino',
  },
  {
    id: 'al-wataniah',
    name: 'Al Wataniah Bareeq Al Dhahab Eau de Parfum',
    price: 312.55,
    compareAtPrice: 359,
    image: '/perfume.jpg',
    images: ['/perfume.jpg'],
    isOnSale: true,
    active: true,
    soldOut: false,
    stock: null,
    purchasePrice: null,
    dupeOf: '',
    rating: 5,
    discountPercent: 8,
    installments: 'ou 8x de R$ 39,06',
    category: 'Perfume',
    brand: 'Outra',
    gender: 'Unissex',
  },
];

export function cleanProductText(value = '') {
  return String(value || '').replace(/<[^>]*>?/gm, '').trim();
}

function normalizeMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? Number(number.toFixed(2)) : 0;
}

function normalizeOptionalMoney(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Number(number.toFixed(2)) : null;
}

function normalizeStock(value) {
  if (value === '' || value === null || typeof value === 'undefined') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.floor(number));
}

export function getControlledStock(product = {}) {
  return normalizeStock(product.stock);
}

export function isProductSoldOut(product = {}) {
  const stock = getControlledStock(product);
  return Boolean(product.soldOut) || (stock !== null && stock <= 0);
}

export function isProductActive(product = {}) {
  return product.active !== false;
}

export function sanitizeProduct(product = {}) {
  const stock = normalizeStock(product.stock);

  return {
    ...product,
    id: cleanProductText(product.id) || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanProductText(product.name),
    price: normalizeMoney(product.price),
    compareAtPrice: product.compareAtPrice === null ? null : normalizeMoney(product.compareAtPrice),
    image: cleanProductText(product.image) || '/photos/perfume.jpg',
    images: Array.isArray(product.images)
      ? product.images.map(cleanProductText).filter(Boolean)
      : [],
    isOnSale: Boolean(product.isOnSale),
    active: product.active !== false,
    soldOut: Boolean(product.soldOut) || (stock !== null && stock <= 0),
    stock,
    purchasePrice: normalizeOptionalMoney(product.purchasePrice),
    dupeOf: cleanProductText(product.dupeOf || ''),
    brand: cleanProductText(product.brand) || 'Outra',
    category: cleanProductText(product.category) || 'Perfume',
    gender: cleanProductText(product.gender) || 'Unissex',
    sizes: cleanProductText(product.sizes || ''),
    description: cleanProductText(product.description || ''),
    topNotes: cleanProductText(product.topNotes || ''),
    heartNotes: cleanProductText(product.heartNotes || ''),
    baseNotes: cleanProductText(product.baseNotes || ''),
    olfactoryFamily: cleanProductText(product.olfactoryFamily || ''),
    videoUrl: cleanProductText(product.videoUrl || ''),
  };
}

export function stripAdminProductFields(product = {}) {
  const { purchasePrice, dupeOf, ...publicProduct } = sanitizeProduct(product);
  return publicProduct;
}

export async function getProducts() {
  let products = null;

  if (process.env.KV_REST_API_URL) {
    try {
      products = await kv.get(PRODUCTS_KEY) || await kv.get(LEGACY_PRODUCTS_KEY);
      if (Array.isArray(products)) return products.map(sanitizeProduct);
    } catch (error) {
      console.error('Erro ao ler produtos no KV:', error);
    }
  }

  if (redis) {
    try {
      const data = await redis.get(PRODUCTS_KEY) || await redis.get(LEGACY_PRODUCTS_KEY);
      if (data) {
        products = JSON.parse(data);
        if (Array.isArray(products)) return products.map(sanitizeProduct);
      }
    } catch (error) {
      console.error('Erro ao ler produtos no Redis:', error);
    }
  }

  return INITIAL_PRODUCTS.map(sanitizeProduct);
}

export async function saveProducts(products = []) {
  const sanitizedProducts = products.map(sanitizeProduct);
  let saved = false;

  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(PRODUCTS_KEY, sanitizedProducts);
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar produtos no KV:', error);
    }
  }

  if (!saved && redis) {
    try {
      await redis.set(PRODUCTS_KEY, JSON.stringify(sanitizedProducts));
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar produtos no Redis:', error);
    }
  }

  if (!saved) {
    throw new Error('Nenhum banco de dados disponivel para salvar produtos.');
  }

  return sanitizedProducts;
}

export async function decrementProductStock(orderItems = []) {
  const products = await getProducts();
  let changed = false;

  const nextProducts = products.map((product) => {
    const quantity = orderItems
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (!quantity) return product;

    const stock = getControlledStock(product);
    if (stock === null) return product;

    const nextStock = Math.max(0, stock - quantity);
    changed = changed || nextStock !== stock;

    return {
      ...product,
      stock: nextStock,
      soldOut: nextStock <= 0 ? true : product.soldOut,
    };
  });

  if (changed) {
    await saveProducts(nextProducts);
  }

  return nextProducts;
}
