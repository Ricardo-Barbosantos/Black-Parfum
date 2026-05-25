"use client";

import ComboSelector from "./ComboSelector";

export default function DecantSelectorModal({ open, decants, selectedIds, onToggle, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="luxury-panel max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Seleção visual</p>
            <h2 className="font-display text-2xl text-white">Escolha exatamente 3 decantes</h2>
          </div>
          <p className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
            {selectedIds.length}/3 selecionados
          </p>
        </div>

        <ComboSelector decants={decants} selectedIds={selectedIds} onToggle={onToggle} />

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="ghost-button">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={selectedIds.length !== 3} className="gold-button">
            Usar decantes
          </button>
        </div>
      </div>
    </div>
  );
}
