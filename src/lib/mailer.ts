import nodemailer from "nodemailer";

type OrderWithCombo = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerCity?: string | null;
  buyerZip?: string | null;
  subtotal?: unknown;
  shippingCost?: unknown;
  shippingLabel?: string | null;
  totalAmount?: unknown;
  status: string;
  createdAt: Date;
  combo: {
    name: string;
    totalPrice: unknown;
    items: Array<{
      decant: {
        name: string;
        ml: number;
        price: unknown;
      };
    }>;
  };
};

function formatCurrency(value: unknown) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Configuracao SMTP incompleta.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOrderConfirmation(order: OrderWithCombo) {
  const transporter = getTransporter();
  const decants = order.combo.items.map(({ decant }) => decant);
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(order.createdAt);

  const html = `
    <div style="background:#070707;color:#f7f1df;font-family:Arial,sans-serif;padding:32px">
      <div style="max-width:640px;margin:0 auto;border:1px solid #2d2614;padding:28px">
        <h1 style="color:#c9a84c;margin:0 0 8px">Obsidian Parfums</h1>
        <p style="margin:0 0 24px;color:#d9c991">Sua notinha foi confirmada.</p>
        <p>Olá, <strong>${order.buyerName}</strong>.</p>
        <p>Recebemos a aprovação do pagamento do combo <strong>${order.combo.name}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <tbody>
            ${decants
              .map(
                (decant) => `
                  <tr>
                    <td style="border-bottom:1px solid #2d2614;padding:10px 0">${decant.name} - ${decant.ml}ml</td>
                    <td style="border-bottom:1px solid #2d2614;padding:10px 0;text-align:right">${formatCurrency(decant.price)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
        <p><strong>Produtos:</strong> ${formatCurrency(order.subtotal || order.combo.totalPrice)}</p>
        <p><strong>Frete:</strong> ${order.shippingLabel || "Frete grátis"} (${formatCurrency(order.shippingCost || 0)})</p>
        <p><strong>Valor pago:</strong> ${formatCurrency(order.totalAmount || order.combo.totalPrice)}</p>
        ${order.buyerCity ? `<p><strong>Cidade:</strong> ${order.buyerCity}${order.buyerZip ? ` - CEP ${order.buyerZip}` : ""}</p>` : ""}
        <p><strong>Data:</strong> ${date}</p>
        <p style="color:#9f936f;font-size:13px">Pedido ${order.id}</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.buyerEmail,
    subject: `Recibo Obsidian Parfums - ${order.combo.name}`,
    html,
  });
}
