function formatMoney(value = 0) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

function getOrderStatusLabel(status = '') {
  const labels = {
    paid: 'PAGO',
    pending: 'A PAGAR',
    cancelled: 'CANCELADO',
    refunded: 'REEMBOLSADO',
  };

  return labels[status] || String(status || 'PENDENTE').toUpperCase();
}

function getOrderText(order) {
  const items = (order.items || [])
    .map((item) => `${item.quantity}x ${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''}`)
    .join('\n');

  return [
    `Pedido: ${order.id}`,
    `Status: ${getOrderStatusLabel(order.status)}`,
    `Cliente: ${order.customer?.name || ''}`,
    `Email: ${order.customer?.email || ''}`,
    `Telefone: ${order.customer?.phone || ''}`,
    `Entrega: ${order.shipping?.label || ''}`,
    `Endereco: ${order.customer?.address || ''}, ${order.customer?.number || ''} - ${order.customer?.neighborhood || ''} - ${order.customer?.city || ''}/${order.customer?.state || ''} - ${order.customer?.zip || ''}`,
    `Itens:\n${items}`,
    `Subtotal: ${formatMoney(order.amounts?.subtotal)}`,
    `Desconto: ${formatMoney(order.amounts?.discount)}`,
    `Frete: ${formatMoney(order.amounts?.shipping)}`,
    `Total: ${formatMoney(order.amounts?.total)}`,
    order.coupon?.code ? `Cupom: ${order.coupon.code}` : '',
  ].filter(Boolean).join('\n');
}

function getOrderHtml(order) {
  const items = (order.items || [])
    .map((item) => `<li>${item.quantity}x ${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} - ${formatMoney(item.unitPrice)}</li>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2>Novo status de pedido: ${getOrderStatusLabel(order.status)}</h2>
      <p><strong>Pedido:</strong> ${order.id}</p>
      <p><strong>Cliente:</strong> ${order.customer?.name || ''}<br />
      <strong>Email:</strong> ${order.customer?.email || ''}<br />
      <strong>Telefone:</strong> ${order.customer?.phone || ''}</p>
      <p><strong>Entrega:</strong> ${order.shipping?.label || ''}<br />
      ${order.customer?.address || ''}, ${order.customer?.number || ''} - ${order.customer?.neighborhood || ''}<br />
      ${order.customer?.city || ''}/${order.customer?.state || ''} - ${order.customer?.zip || ''}</p>
      <h3>Itens</h3>
      <ul>${items}</ul>
      <p><strong>Subtotal:</strong> ${formatMoney(order.amounts?.subtotal)}<br />
      <strong>Desconto:</strong> ${formatMoney(order.amounts?.discount)}<br />
      <strong>Frete:</strong> ${formatMoney(order.amounts?.shipping)}<br />
      <strong>Total:</strong> ${formatMoney(order.amounts?.total)}</p>
      ${order.coupon?.code ? `<p><strong>Cupom:</strong> ${order.coupon.code}</p>` : ''}
    </div>
  `;
}

export async function sendOrderEmail(order, subjectPrefix = 'Pedido Obsidian') {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !to.length || !from) {
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `${order.id}-${order.status}-${order.updatedAt || order.createdAt}`.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to,
      subject: `${subjectPrefix} ${order.id} - ${getOrderStatusLabel(order.status)}`,
      html: getOrderHtml(order),
      text: getOrderText(order),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Erro ao enviar email pelo Resend.');
  }

  return response.json();
}
