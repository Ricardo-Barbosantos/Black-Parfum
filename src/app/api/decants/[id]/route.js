import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    const decant = await prisma.decant.update({
      where: { id: params.id },
      data: {
        name: body.name,
        ml: Number(body.ml),
        price: Number(body.price),
        imageUrl: body.imageUrl || null,
        available: Boolean(body.available),
      },
    });

    return NextResponse.json(decant);
  } catch (error) {
    console.error("Erro ao atualizar decante:", error);
    return NextResponse.json({ error: "Erro ao atualizar decante." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await prisma.decant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir decante:", error);
    return NextResponse.json(
      { error: "Erro ao excluir decante. Verifique se ele está vinculado a algum combo." },
      { status: 500 },
    );
  }
}
