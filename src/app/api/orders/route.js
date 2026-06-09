import { z } from 'zod';
import { getAdminFromRequest } from '@/lib/auth';
import { deleteOrder, getOrders, updateOrderStatus } from '@/lib/orders';

const UpdateOrderSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['delete', 'status']),
  status: z.enum(['pending', 'paid', 'cancelled', 'refunded']).optional(),
});

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request) {
  if (!getAdminFromRequest(request)) return unauthorized();

  const orders = await getOrders();
  return new Response(JSON.stringify({ orders }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request) {
  if (!getAdminFromRequest(request)) return unauthorized();

  try {
    const payload = await request.json();
    const validation = UpdateOrderSchema.safeParse(payload);

    if (!validation.success) {
      return new Response(JSON.stringify({
        error: 'Dados invalidos para pedido.',
        details: validation.error.format(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id, action, status } = validation.data;
    const orders = action === 'delete'
      ? await deleteOrder(id)
      : await updateOrderStatus(id, status || 'pending');

    return new Response(JSON.stringify({ success: true, orders }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao atualizar pedido.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
