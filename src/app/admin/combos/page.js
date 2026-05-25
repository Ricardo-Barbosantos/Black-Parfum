"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DecantSelectorModal from "@/components/admin/DecantSelectorModal";

const emptyForm = {
  name: "",
  totalPrice: "",
  coverImage: "",
  active: true,
};

export default function AdminCombosPage() {
  const [combos, setCombos] = useState([]);
  const [decants, setDecants] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const selectedDecants = useMemo(
    () => decants.filter((decant) => selectedIds.includes(decant.id)),
    [decants, selectedIds],
  );

  const calculatedPrice = selectedDecants.reduce((sum, decant) => sum + Number(decant.price), 0);

  async function loadData() {
    const [comboResponse, decantResponse] = await Promise.all([
      fetch("/api/combos", { cache: "no-store" }),
      fetch("/api/decants?available=true", { cache: "no-store" }),
    ]);

    const comboData = await comboResponse.json();
    const decantData = await decantResponse.json();
    setCombos(Array.isArray(comboData) ? comboData : []);
    setDecants(Array.isArray(decantData) ? decantData : []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleDecant(decantId) {
    setSelectedIds((current) => {
      if (current.includes(decantId)) {
        return current.filter((id) => id !== decantId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, decantId];
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (selectedIds.length !== 3) {
      setMessage("Selecione exatamente 3 decantes.");
      return;
    }

    const payload = {
      ...form,
      totalPrice: Number(form.totalPrice || calculatedPrice),
      decantIds: selectedIds,
    };
    const url = editingId ? `/api/combos/${editingId}` : "/api/combos";
    const method = editingId ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Erro ao salvar combo.");
      return;
    }

    setForm(emptyForm);
    setSelectedIds([]);
    setEditingId(null);
    setMessage("Combo salvo com sucesso.");
    loadData();
  }

  function handleEdit(combo) {
    setEditingId(combo.id);
    setForm({
      name: combo.name,
      totalPrice: String(combo.totalPrice),
      coverImage: combo.coverImage || "",
      active: combo.active,
    });
    setSelectedIds(combo.items.map((item) => item.decantId));
  }

  async function handleDelete(combo) {
    if (!confirm(`Excluir o combo ${combo.name}?`)) return;

    const response = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Erro ao excluir combo.");
      return;
    }

    loadData();
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">Combos</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/decantes" className="ghost-button">Decantes</Link>
          <Link href="/" className="ghost-button">Loja</Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="luxury-panel h-fit rounded-lg p-5">
          <h2 className="font-display text-2xl text-white">{editingId ? "Editar combo" : "Criar combo"}</h2>
          <div className="mt-5 grid gap-4">
            <button type="button" onClick={() => setModalOpen(true)} className="ghost-button w-full">
              Selecionar decantes ({selectedIds.length}/3)
            </button>

            {selectedDecants.length > 0 && (
              <div className="grid gap-2">
                {selectedDecants.map((decant) => (
                  <div key={decant.id} className="rounded-md border border-white/10 bg-black/30 p-3 text-sm text-white/75">
                    {decant.name} - {decant.ml}ml
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="label" htmlFor="name">Nome do combo</label>
              <input id="name" className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="totalPrice">Preço total</label>
              <input
                id="totalPrice"
                className="field"
                type="number"
                min="0"
                step="0.01"
                placeholder={`Calculado: ${calculatedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
                value={form.totalPrice}
                onChange={(event) => setForm({ ...form, totalPrice: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="coverImage">Foto de capa</label>
              <input id="coverImage" className="field" placeholder="https://..." value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} />
            </div>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Combo ativo na loja
            </label>
          </div>

          {message && <p className="mt-4 rounded-md bg-white/5 p-3 text-sm text-white/70">{message}</p>}

          <div className="mt-5 flex gap-3">
            <button type="submit" className="gold-button flex-1">Salvar combo</button>
            {editingId && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setSelectedIds([]);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="grid gap-5">
          {combos.map((combo) => (
            <article key={combo.id} className="luxury-panel rounded-lg p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">{combo.active ? "Ativo" : "Inativo"}</p>
                  <h3 className="mt-2 font-display text-2xl text-white">{combo.name}</h3>
                  <p className="mt-2 text-white/60">
                    {Number(combo.totalPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {combo.items.map((item) => (
                      <span key={item.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                        {item.decant.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(combo)} className="ghost-button">Editar</button>
                  <button type="button" onClick={() => handleDelete(combo)} className="ghost-button">Excluir</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DecantSelectorModal
        open={modalOpen}
        decants={decants}
        selectedIds={selectedIds}
        onToggle={toggleDecant}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />
    </main>
  );
}
