"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DecantCard from "@/components/admin/DecantCard";

const emptyForm = {
  name: "",
  ml: "5",
  price: "",
  imageUrl: "",
  available: true,
};

export default function AdminDecantesPage() {
  const [decants, setDecants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDecants() {
    setLoading(true);
    const response = await fetch("/api/decants", { cache: "no-store" });
    const data = await response.json();
    setDecants(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadDecants();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      ml: Number(form.ml),
      price: Number(form.price),
    };

    const url = editingId ? `/api/decants/${editingId}` : "/api/decants";
    const method = editingId ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Erro ao salvar decante.");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setMessage("Decante salvo com sucesso.");
    loadDecants();
  }

  function handleEdit(decant) {
    setEditingId(decant.id);
    setForm({
      name: decant.name,
      ml: String(decant.ml),
      price: String(decant.price),
      imageUrl: decant.imageUrl || "",
      available: decant.available,
    });
  }

  async function handleToggle(decant) {
    await fetch(`/api/decants/${decant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...decant, available: !decant.available }),
    });
    loadDecants();
  }

  async function handleDelete(decant) {
    if (!confirm(`Excluir o decante ${decant.name}?`)) return;

    const response = await fetch(`/api/decants/${decant.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Erro ao excluir decante.");
      return;
    }

    loadDecants();
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">Decantes</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/combos" className="ghost-button">Combos</Link>
          <Link href="/" className="ghost-button">Loja</Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={handleSubmit} className="luxury-panel h-fit rounded-lg p-5">
          <h2 className="font-display text-2xl text-white">{editingId ? "Editar decante" : "Novo decante"}</h2>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="label" htmlFor="name">Nome</label>
              <input id="name" className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ml">ML</label>
                <input id="ml" className="field" type="number" min="1" value={form.ml} onChange={(event) => setForm({ ...form, ml: event.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="price">Preço unitário</label>
                <input id="price" className="field" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="imageUrl">Foto</label>
              <input id="imageUrl" className="field" placeholder="https://..." value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
            </div>
            <label className="flex items-center gap-3 text-sm text-white/75">
              <input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />
              Disponível para combos
            </label>
          </div>

          {message && <p className="mt-4 rounded-md bg-white/5 p-3 text-sm text-white/70">{message}</p>}

          <div className="mt-5 flex gap-3">
            <button type="submit" className="gold-button flex-1">Salvar</button>
            {editingId && (
              <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div>
          {loading ? (
            <div className="luxury-panel rounded-lg p-8 text-white/60">Carregando decantes...</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {decants.map((decant) => (
                <DecantCard key={decant.id} decant={decant} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
