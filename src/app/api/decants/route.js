import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const available = searchParams.get("available");
    const where = available === "true" ? { available: true } : {};

    const decants = await prisma.decant.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(decants);
  } catch (error) {
    console.error("Erro ao listar decantes:", error);
    return NextResponse.json({ error: "Erro ao listar decantes." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.ml || body.price === undefined) {
      return NextResponse.json({ error: "Nome, ml e preço são obrigatórios." }, { status: 400 });
    }

    const decant = await prisma.decant.create({
      data: {
        name: body.name,
        ml: Number(body.ml),
        price: Number(body.price),
        imageUrl: body.imageUrl || null,
        available: Boolean(body.available),
      },
    });

    return NextResponse.json(decant, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar decante:", error);
    return NextResponse.json({ error: "Erro ao criar decante." }, { status: 500 });
  }
}
