"use client";

export default function ComboSelector({ decants, selectedIds, onToggle }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {decants.map((decant) => {
        const selected = selectedIds.includes(decant.id);

        return (
          <button
            type="button"
            key={decant.id}
            onClick={() => onToggle(decant.id)}
            className={`overflow-hidden rounded-lg border text-left transition ${
              selected
                ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <div
              className="h-36 bg-cover bg-center"
              style={{ backgroundImage: `url(${decant.imageUrl || "/perfume.jpg"})` }}
            />
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gold">{decant.ml}ml</p>
              <h3 className="mt-1 font-semibold text-white">{decant.name}</h3>
              <p className="mt-2 text-sm text-white/55">
                {Number(decant.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
