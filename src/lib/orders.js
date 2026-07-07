import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import { decrementProductStock } from '@/lib/products';
import { sendOrderEmail } from '@/lib/notifications';
import { sendToMetaCAPI } from '@/lib/metaCAPI';

const ORDERS_KEY = 'obsidian_orders';

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (error) {
    console.error('Erro ao iniciar Redis de pedidos:', error);
  }
}

function cleanText(value = '') {
  return String(value || '').replace(/<[^>]*>?/gm, '').trim();
}

function normalizeMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

export function createOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `OP-${stamp}-${random}`;
}

export function mapMercadoPagoStatus(status = '') {
  if (status === 'approved') return 'paid';
  if (['cancelled', 'rejected', 'charged_back'].includes(status)) return 'cancelled';
  if (status === 'refunded') return 'refunded';
  return 'pending';
}

export function sanitizeOrder(order = {}) {
  return {
    id: cleanText(order.id) || createOrderId(),
    status: cleanText(order.status) || 'pending',
    paymentStatus: cleanText(order.paymentStatus || ''),
    paymentStatusDetail: cleanText(order.paymentStatusDetail || ''),
    paymentId: cleanText(order.paymentId || ''),
    preferenceId: cleanText(order.preferenceId || ''),
    initPoint: cleanText(order.initPoint || ''),
    sandboxInitPoint: cleanText(order.sandboxInitPoint || ''),
    stockDecremented: Boolean(order.stockDecremented),
    emailNotifiedAt: cleanText(order.emailNotifiedAt || ''),
    createdAt: cleanText(order.createdAt) || new Date().toISOString(),
    updatedAt: cleanText(order.updatedAt) || new Date().toISOString(),
    paidAt: cleanText(order.paidAt || ''),
    customer: {
      name: cleanText(order.customer?.name),
      email: cleanText(order.customer?.email),
      phone: cleanText(order.customer?.phone),
      deliveryMethod: cleanText(order.customer?.deliveryMethod || 'home'),
      zip: cleanText(order.customer?.zip),
      address: cleanText(order.customer?.address),
      number: cleanText(order.customer?.number),
      complement: cleanText(order.customer?.complement),
      neighborhood: cleanText(order.customer?.neighborhood),
      city: cleanText(order.customer?.city),
      state: cleanText(order.customer?.state),
    },
    shipping: {
      label: cleanText(order.shipping?.label),
      cost: normalizeMoney(order.shipping?.cost),
      free: Boolean(order.shipping?.free),
    },
    coupon: order.coupon ? {
      code: cleanText(order.coupon.code),
      discountPercent: normalizeMoney(order.coupon.discountPercent),
      discountAmount: normalizeMoney(order.coupon.discountAmount),
      influencerName: cleanText(order.coupon.influencerName),
      commissionPercent: normalizeMoney(order.coupon.commissionPercent),
      commissionFixed: normalizeMoney(order.coupon.commissionFixed),
      commissionAmount: normalizeMoney(order.coupon.commissionAmount),
    } : null,
    amounts: {
      subtotal: normalizeMoney(order.amounts?.subtotal),
      discount: normalizeMoney(order.amounts?.discount),
      shipping: normalizeMoney(order.amounts?.shipping),
      total: normalizeMoney(order.amounts?.total),
      paid: normalizeMoney(order.amounts?.paid),
    },
    items: Array.isArray(order.items) ? order.items.map((item) => ({
      productId: cleanText(item.productId),
      cartItemId: cleanText(item.cartItemId),
      name: cleanText(item.name),
      selectedSize: cleanText(item.selectedSize),
      quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
      unitPrice: normalizeMoney(item.unitPrice),
      total: normalizeMoney(item.total),
    })) : [],
  };
}

export async function getOrders() {
  let orders = [];

  if (process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get(ORDERS_KEY);
      if (Array.isArray(data)) orders = data;
    } catch (error) {
      console.error('Erro ao ler pedidos no KV:', error);
    }
  }

  if (!orders.length && redis) {
    try {
      const data = await redis.get(ORDERS_KEY);
      if (data) orders = JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler pedidos no Redis:', error);
    }
  }

  return Array.isArray(orders)
    ? orders.map(sanitizeOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];
}

export async function saveOrders(orders = []) {
  const sanitizedOrders = orders.map(sanitizeOrder).slice(0, 300);
  let saved = false;

  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(ORDERS_KEY, sanitizedOrders);
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar pedidos no KV:', error);
    }
  }

  if (!saved && redis) {
    try {
      await redis.set(ORDERS_KEY, JSON.stringify(sanitizedOrders));
      saved = true;
    } catch (error) {
      console.error('Erro ao salvar pedidos no Redis:', error);
    }
  }

  if (!saved) {
    throw new Error('Nenhum banco de dados disponivel para salvar pedidos.');
  }

  return sanitizedOrders;
}

export function buildPendingOrder({
  orderId,
  customer,
  orderItems,
  shipping,
  couponSummary,
  subtotal,
  total,
  mpPreference,
}) {
  return sanitizeOrder({
    id: orderId || createOrderId(),
    status: 'pending',
    paymentStatus: 'pending',
    preferenceId: mpPreference?.id || '',
    initPoint: mpPreference?.init_point || '',
    sandboxInitPoint: mpPreference?.sandbox_init_point || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer,
    shipping,
    coupon: couponSummary.coupon ? {
      code: couponSummary.coupon.code,
      discountPercent: couponSummary.coupon.discountPercent,
      discountAmount: couponSummary.discountAmount,
      influencerName: couponSummary.coupon.influencerName,
      commissionPercent: couponSummary.coupon.commissionPercent,
      commissionFixed: couponSummary.coupon.commissionFixed,
      commissionAmount: couponSummary.commissionAmount,
    } : null,
    amounts: {
      subtotal,
      discount: couponSummary.discountAmount,
      shipping: shipping.cost,
      total,
      paid: 0,
    },
    items: orderItems,
  });
}

export async function addOrder(order) {
  const orders = await getOrders();
  const nextOrders = [sanitizeOrder(order), ...orders.filter((item) => item.id !== order.id)];
  return saveOrders(nextOrders);
}

export async function deleteOrder(orderId) {
  const orders = await getOrders();
  return saveOrders(orders.filter((order) => order.id !== orderId));
}

export async function updateOrderStatus(orderId, status) {
  const orders = await getOrders();
  const nextOrders = orders.map((order) => (
    order.id === orderId
      ? sanitizeOrder({ ...order, status, updatedAt: new Date().toISOString() })
      : order
  ));
  return saveOrders(nextOrders);
}

export async function updateOrderFromPayment(payment = {}) {
  const orders = await getOrders();
  const orderId = cleanText(payment.external_reference || payment.metadata?.order_id || '');
  const paymentId = cleanText(payment.id || '');
  const index = orders.findIndex((order) => (
    (orderId && order.id === orderId) || (paymentId && order.paymentId === paymentId)
  ));

  if (index === -1) {
    return null;
  }

  const current = orders[index];
  const nextStatus = mapMercadoPagoStatus(payment.status);
  const paidNow = nextStatus === 'paid' && current.status !== 'paid';
  let nextOrder = sanitizeOrder({
    ...current,
    status: nextStatus,
    paymentStatus: cleanText(payment.status),
    paymentStatusDetail: cleanText(payment.status_detail),
    paymentId,
    updatedAt: new Date().toISOString(),
    paidAt: nextStatus === 'paid' ? (payment.date_approved || current.paidAt || new Date().toISOString()) : current.paidAt,
    amounts: {
      ...current.amounts,
      paid: normalizeMoney(payment.transaction_amount || current.amounts?.paid),
    },
  });

  if (nextStatus === 'paid' && !nextOrder.stockDecremented) {
    await decrementProductStock(nextOrder.items);
    nextOrder = sanitizeOrder({ ...nextOrder, stockDecremented: true });
  }

  const nextOrders = [...orders];
  nextOrders[index] = nextOrder;
  await saveOrders(nextOrders);

  if (paidNow) {
    try {
      await sendOrderEmail(nextOrder, 'Pedido pago');
      
      const nameParts = nextOrder.customer?.name?.trim().split(' ') || [];
      await sendToMetaCAPI({
        eventName: 'Purchase',
        eventId: nextOrder.id,
        userData: {
          em: nextOrder.customer?.email,
          fn: nameParts[0] || '',
          ln: nameParts.slice(1).join(' ') || nameParts[0] || '',
          zp: nextOrder.customer?.zip || '',
          ct: nextOrder.customer?.city || '',
          st: nextOrder.customer?.state || '',
        },
        customData: {
          value: nextOrder.amounts?.total || 0,
          currency: 'BRL',
          content_ids: nextOrder.items?.map(i => i.productId) || [],
          num_items: nextOrder.items?.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 0,
        }
      }).catch(err => console.error('CAPI async error:', err));
      
      nextOrder = sanitizeOrder({ ...nextOrder, emailNotifiedAt: new Date().toISOString() });
      const notifiedOrders = await getOrders();
      const notifiedIndex = notifiedOrders.findIndex((order) => order.id === nextOrder.id);
      if (notifiedIndex >= 0) {
        notifiedOrders[notifiedIndex] = nextOrder;
        await saveOrders(notifiedOrders);
      }
    } catch (error) {
      console.error('Erro ao enviar email do pedido pago:', error);
    }
  }

  return nextOrder;
}
