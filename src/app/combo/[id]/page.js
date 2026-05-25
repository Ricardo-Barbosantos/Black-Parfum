import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutButton from "@/components/store/CheckoutButton";
import DecantBadge from "@/components/store/DecantBadge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCombo(id) {
  try {
    return await prisma.combo.findFirst({
      where: { id, active: true },
      include: {
        items: {
          include: { decant: true },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar combo:", error);
    return null;
  }
}

export default async function ComboPage({ params }) {
  const combo = await getCombo(params.id);

  if (!combo) {
    notFound();
  }

  const decants = combo.items.map((item) => item.decant);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="luxury-panel overflow-hidden rounded-lg">
        <div
          className="min-h-[420px] bg-cover bg-center"
          style={{ backgroundImage: `url(${combo.coverImage || decants[0]?.imageUrl || "/perfume.jpg"})` }}
        />
        <div className="p-6 md:p-8">
          <Link href="/" className="text-sm text-gold">Voltar para a loja</Link>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-gold">Combo de 3 decantes</p>
          <h1 className="mt-3 font-display text-4xl text-white md:text-5xl">{combo.name}</h1>
          <p className="mt-5 max-w-2xl text-white/60">
            Uma curadoria pronta para experimentar fragrâncias com presença, profundidade e elegância.
          </p>
          <p className="mt-6 font-display text-4xl text-gold">
            {Number(combo.totalPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="luxury-panel rounded-lg p-5">
          <h2 className="font-display text-2xl text-white">Decantes inclusos</h2>
          <div className="mt-5 grid gap-3">
            {decants.map((decant) => (
              <DecantBadge key={decant.id} decant={decant} />
            ))}
          </div>
        </div>
        <CheckoutButton comboId={combo.id} />
      </aside>
    </main>
  );
}
