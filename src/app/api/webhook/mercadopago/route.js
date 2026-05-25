import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/mailer";
import { getMercadoPagoPayment } from "@/lib/mercadopago";

function normalizeStatus(status) {
  if (status === "approved") return "approved";
  if (status === "rejected" || status === "cancelled") return "rejected";
  return "pending";
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const type = body.type || body.topic || searchParams.get("type") || searchParams.get("topic");
    const paymentId = body.data?.id || body.id || searchParams.get("id") || searchParams.get("data.id");

    if (type && !String(type).includes("payment")) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "ID do pagamento não encontrado no webhook." }, { status: 400 });
    }

    const mercadoPagoPayment = getMercadoPagoPayment();
    const payment = await mercadoPagoPayment.get({ id: paymentId });
    const orderId = payment.external_reference;
    const status = normalizeStatus(payment.status);

    if (!orderId) {
      return NextResponse.json({ error: "Pagamento sem referência externa." }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        mpPaymentId: String(payment.id),
      },
      include: {
        combo: {
          include: {
            items: {
              include: { decant: true },
            },
          },
        },
      },
    });

    if (status === "approved") {
      try {
        await sendOrderConfirmation(order);
      } catch (emailError) {
        console.error("Pedido aprovado, mas o e-mail falhou:", emailError);
      }
    }

    return NextResponse.json({ ok: true, orderId: order.id, status });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook do Mercado Pago." },
      { status: 500 },
    );
  }
}
