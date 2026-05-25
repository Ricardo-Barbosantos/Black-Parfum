import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const includeItems = {
  items: {
    include: { decant: true },
  },
};

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const decantIds = Array.isArray(body.decantIds) ? body.decantIds : [];

    if (decantIds.length !== 3) {
      return NextResponse.json({ error: "O combo deve ter exatamente 3 decantes." }, { status: 400 });
    }

    const combo = await prisma.$transaction(async (tx) => {
      await tx.comboItem.deleteMany({ where: { comboId: params.id } });

      return tx.combo.update({
        where: { id: params.id },
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
    });

    return NextResponse.json(combo);
  } catch (error) {
    console.error("Erro ao atualizar combo:", error);
    return NextResponse.json({ error: "Erro ao atualizar combo." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await prisma.combo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir combo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir combo. Verifique se existem pedidos vinculados." },
      { status: 500 },
    );
  }
}
