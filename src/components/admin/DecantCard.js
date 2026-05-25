"use client";

export default function DecantCard({ decant, onToggle, onEdit, onDelete }) {
  return (
    <article className="luxury-panel overflow-hidden rounded-lg">
      <div
        className="h-44 bg-cover bg-center"
        style={{ backgroundImage: `url(${decant.imageUrl || "/perfume.jpg"})` }}
      />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">{decant.ml}ml</p>
          <h3 className="mt-1 font-display text-xl text-white">{decant.name}</h3>
          <p className="mt-2 text-sm text-white/60">
            {Number(decant.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggle(decant)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              decant.available ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
            }`}
          >
            {decant.available ? "Disponível" : "Indisponível"}
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={() => onEdit(decant)} className="ghost-button px-3 py-1">
              Editar
            </button>
            <button type="button" onClick={() => onDelete(decant)} className="ghost-button px-3 py-1">
              Excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
