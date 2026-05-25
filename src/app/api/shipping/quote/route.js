import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShippingQuote } from "@/lib/shipping";

export async function POST(request) {
  try {
    const body = await request.json();
    const { comboId, buyerCity, buyerZip } = body;

    if (!comboId || !buyerCity) {
      return NextResponse.json(
        { error: "comboId e buyerCity são obrigatórios." },
        { status: 400 },
      );
    }

    const combo = await prisma.combo.findFirst({
      where: { id: comboId, active: true },
      select: { totalPrice: true },
    });

    if (!combo) {
      return NextResponse.json({ error: "Combo não encontrado ou inativo." }, { status: 404 });
    }

    const quote = await getShippingQuote({
      city: buyerCity,
      destinationZip: buyerZip,
      subtotal: Number(combo.totalPrice),
    });

    return NextResponse.json({
      subtotal: Number(combo.totalPrice),
      ...quote,
      totalAmount: Number(combo.totalPrice) + Number(quote.shippingCost || 0),
    });
  } catch (error) {
    console.error("Erro ao cotar frete:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao calcular frete." },
      { status: 500 },
    );
  }
}
