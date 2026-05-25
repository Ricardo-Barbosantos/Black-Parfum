import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const includeItems = {
  items: {
    include: { decant: true },
  },
};

export async function GET() {
  try {
    const combos = await prisma.combo.findMany({
      orderBy: { createdAt: "desc" },
      include: includeItems,
    });

    return NextResponse.json(combos);
  } catch (error) {
    console.error("Erro ao listar combos:", error);
    return NextResponse.json({ error: "Erro ao listar combos." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const decantIds = Array.isArray(body.decantIds) ? body.decantIds : [];

    if (!body.name || body.totalPrice === undefined) {
      return NextResponse.json({ error: "Nome e preço total são obrigatórios." }, { status: 400 });
    }

    if (decantIds.length !== 3) {
      return NextResponse.json({ error: "O combo deve ter exatamente 3 decantes." }, { status: 400 });
    }

    const combo = await prisma.combo.create({
      data: {
        name: body.name,
        totalPrice: Number(body.totalPrice),
        coverImage: body.coverImage || null,
        active: Boolean(body.active),
        items: {
          create: decantIds.map((decantId) => ({ decantId })),
        },
      },
      include: includeItems,
    });

    return NextResponse.json(combo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar combo:", error);
    return NextResponse.json({ error: "Erro ao criar combo." }, { status: 500 });
  }
}
