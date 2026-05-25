export default function DecantBadge({ decant }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <p className="font-semibold text-white">{decant.name}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">{decant.ml}ml</p>
    </div>
  );
}
