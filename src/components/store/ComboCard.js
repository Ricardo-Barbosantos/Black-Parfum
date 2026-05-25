import Link from "next/link";
import DecantBadge from "./DecantBadge";

export default function ComboCard({ combo }) {
  const decants = combo.items.map((item) => item.decant);

  return (
    <article className="luxury-panel grid overflow-hidden rounded-lg md:grid-cols-[0.95fr_1.05fr]">
      <div
        className="min-h-72 bg-cover bg-center"
        style={{ backgroundImage: `url(${combo.coverImage || decants[0]?.imageUrl || "/perfume.jpg"})` }}
      />
      <div className="flex flex-col justify-between gap-8 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Combo com 3 decantes</p>
          <h2 className="mt-3 font-display text-3xl text-white">{combo.name}</h2>
          <div className="mt-5 grid gap-3">
            {decants.map((decant) => (
              <DecantBadge key={decant.id} decant={decant} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-3xl text-gold">
            {Number(combo.totalPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <Link className="gold-button" href={`/combo/${combo.id}`}>
            Ver combo
          </Link>
        </div>
      </div>
    </article>
  );
}
