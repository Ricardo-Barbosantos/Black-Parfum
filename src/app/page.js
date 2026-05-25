import Link from "next/link";
import ComboCard from "@/components/store/ComboCard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getActiveCombos() {
  try {
    return await prisma.combo.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { decant: true },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar combos ativos:", error);
    return [];
  }
}

export default async function Home() {
  const combos = await getActiveCombos();

  return (
    <main>
      <section className="mx-auto flex min-h-[62vh] max-w-7xl flex-col justify-center px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.32em] text-gold">Obsidian Parfums</p>
          <h1 className="mt-5 font-display text-5xl leading-tight text-white md:text-7xl">
            Combos de decantes para descobrir sua próxima assinatura.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
            Escolhas refinadas em conjuntos de 3 fragrâncias. Experimente, compare e compre com pagamento seguro.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#combos" className="gold-button">Ver combos</a>
            <Link href="/admin/decantes" className="ghost-button">Painel admin</Link>
          </div>
        </div>
      </section>

      <section id="combos" className="mx-auto max-w-7xl px-5 pb-20">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">Loja</p>
            <h2 className="mt-2 font-display text-4xl text-white">Combos ativos</h2>
          </div>
          <p className="text-sm text-white/50">{combos.length} combo(s) disponível(is)</p>
        </div>

        {combos.length === 0 ? (
          <div className="luxury-panel rounded-lg p-8 text-center text-white/65">
            Nenhum combo ativo por enquanto. Cadastre decantes e crie um combo no painel admin.
          </div>
        ) : (
          <div className="grid gap-6">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
