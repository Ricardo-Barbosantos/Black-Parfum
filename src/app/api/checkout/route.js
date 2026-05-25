import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMercadoPagoPayment, getMercadoPagoPreference } from "@/lib/mercadopago";
import { getShippingQuote } from "@/lib/shipping";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      comboId,
      buyerEmail,
      buyerName,
      buyerCity,
      buyerZip,
      shippingServiceId,
      paymentMethod = "checkout",
    } = body;

    if (!comboId || !buyerEmail || !buyerName || !buyerCity) {
      return NextResponse.json(
        { error: "comboId, buyerEmail, buyerName e buyerCity são obrigatórios." },
        { status: 400 },
      );
    }

    const combo = await prisma.combo.findFirst({
      where: { id: comboId, active: true },
      include: {
        items: {
          include: { decant: true },
        },
      },
    });

    if (!combo) {
      return NextResponse.json({ error: "Combo não encontrado ou inativo." }, { status: 404 });
    }

    const subtotal = Number(combo.totalPrice);
    const shipping = await getShippingQuote({
      city: buyerCity,
      destinationZip: buyerZip,
      subtotal,
      selectedServiceId: shippingServiceId,
    });
    const shippingCost = Number(shipping.shippingCost || 0);
    const amount = Number((subtotal + shippingCost).toFixed(2));

    const order = await prisma.order.create({
      data: {
        comboId: combo.id,
        buyerName,
        buyerEmail,
        buyerCity,
        buyerZip: buyerZip || null,
        subtotal,
        shippingCost,
        totalAmount: amount,
        shippingLabel: shipping.shippingLabel,
        shippingServiceId: shipping.shippingServiceId,
        shippingServiceName: shipping.shippingServiceName,
        shippingDeliveryTime: shipping.shippingDeliveryTime,
        status: "pending",
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (paymentMethod === "pix") {
      const mercadoPagoPayment = getMercadoPagoPayment();
      const payment = await mercadoPagoPayment.create({
        body: {
          transaction_amount: amount,
          description: `Combo ${combo.name} + frete - Obsidian Parfums`,
          payment_method_id: "pix",
          payer: {
            email: buyerEmail,
            first_name: buyerName,
          },
          external_reference: order.id,
          notification_url: `${siteUrl}/api/webhook/mercadopago`,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { mpPaymentId: String(payment.id) },
      });

      return NextResponse.json({
        orderId: order.id,
        paymentId: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    }

    const mercadoPagoPreference = getMercadoPagoPreference();
    const preference = await mercadoPagoPreference.create({
      body: {
        external_reference: order.id,
        notification_url: `${siteUrl}/api/webhook/mercadopago`,
        payer: {
          name: buyerName,
          email: buyerEmail,
        },
        items: [
          {
            id: combo.id,
            title: `${combo.name} + frete`,
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: `${siteUrl}/combo/${combo.id}?status=approved`,
          pending: `${siteUrl}/combo/${combo.id}?status=pending`,
          failure: `${siteUrl}/combo/${combo.id}?status=rejected`,
        },
        auto_return: "approved",
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: preference.id ? String(preference.id) : null },
    });

    return NextResponse.json({
      orderId: order.id,
      preferenceId: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento no Mercado Pago." },
      { status: 500 },
    );
  }
}
