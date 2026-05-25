"use client";

import { useState } from "react";
import { FREE_SHIPPING_LABEL, isFreeShippingRegion } from "@/lib/shipping";

export default function CheckoutButton({ comboId }) {
  const [form, setForm] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerCity: "Vitória da Conquista",
    buyerZip: "",
    shippingServiceId: "",
    paymentMethod: "checkout",
  });
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [pix, setPix] = useState(null);
  const [error, setError] = useState("");
  const freeShipping = isFreeShippingRegion(form.buyerCity);

  async function handleQuoteShipping() {
    setQuoting(true);
    setError("");
    setQuote(null);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId, buyerCity: form.buyerCity, buyerZip: form.buyerZip }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível calcular o frete.");
      }

      setQuote(data);
      setForm((current) => ({
        ...current,
        shippingServiceId: data.shippingServiceId || data.options?.[0]?.serviceId || "",
      }));
    } catch (quoteError) {
      setError(quoteError.message);
    } finally {
      setQuoting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPix(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comboId,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          buyerCity: form.buyerCity,
          buyerZip: form.buyerZip,
          shippingServiceId: form.shippingServiceId,
          paymentMethod: form.paymentMethod,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível iniciar o pagamento.");
      }

      if (data.qr_code || data.qr_code_base64) {
        setPix(data);
        return;
      }

      window.location.href = data.init_point;
    } catch (checkoutError) {
      setError(checkoutError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="luxury-panel rounded-lg p-5">
      <h2 className="font-display text-2xl text-white">Comprar agora</h2>
      <div className="mt-5 grid gap-4">
        <div>
          <label className="label" htmlFor="buyerName">Nome</label>
          <input
            id="buyerName"
            className="field"
            placeholder="Seu nome completo"
            value={form.buyerName}
            onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="buyerEmail">E-mail</label>
          <input
            id="buyerEmail"
            className="field"
            type="email"
            placeholder="voce@email.com"
            value={form.buyerEmail}
            onChange={(event) => setForm((current) => ({ ...current, buyerEmail: event.target.value }))}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="buyerCity">Cidade</label>
            <input
              id="buyerCity"
              className="field"
              placeholder="Vitória da Conquista"
              value={form.buyerCity}
              onChange={(event) => {
                setQuote(null);
                setForm((current) => ({ ...current, buyerCity: event.target.value, shippingServiceId: "" }));
              }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="buyerZip">CEP</label>
            <input
              id="buyerZip"
              className="field"
              placeholder="45000-000"
              value={form.buyerZip}
              onChange={(event) => {
                setQuote(null);
                setForm((current) => ({ ...current, buyerZip: event.target.value, shippingServiceId: "" }));
              }}
            />
          </div>
        </div>
        <div
          className={`rounded-md border p-3 text-sm ${
            freeShipping
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
              : "border-amber-400/25 bg-amber-500/10 text-amber-100"
          }`}
        >
          {freeShipping
            ? FREE_SHIPPING_LABEL
            : "Fora de Vitória da Conquista, calcule o frete pelo Melhor Envio antes de pagar."}
        </div>
        {!freeShipping && (
          <button type="button" onClick={handleQuoteShipping} disabled={quoting} className="ghost-button w-full">
            {quoting ? "Calculando frete..." : "Calcular frete"}
          </button>
        )}
        {!freeShipping && quote?.options?.length > 0 && (
          <div>
            <label className="label" htmlFor="shippingServiceId">Frete</label>
            <select
              id="shippingServiceId"
              className="field"
              value={form.shippingServiceId}
              onChange={(event) => setForm((current) => ({ ...current, shippingServiceId: event.target.value }))}
              required
            >
              {quote.options.map((option) => (
                <option key={option.serviceId} value={option.serviceId}>
                  {option.label} - {option.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  {option.deliveryTime ? ` - ${option.deliveryTime} dias` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {quote && (
          <div className="rounded-md border border-white/10 bg-black/30 p-3 text-sm text-white/75">
            <p>Produtos: {quote.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p>Frete: {Number(quote.shippingCost || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p className="mt-1 font-bold text-gold">
              Total: {quote.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        )}
        <div>
          <label className="label" htmlFor="paymentMethod">Pagamento</label>
          <select
            id="paymentMethod"
            className="field"
            value={form.paymentMethod}
            onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
          >
            <option value="checkout">Checkout Pro</option>
            <option value="pix">PIX</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {pix && (
        <div className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-white/80">
          {pix.qr_code_base64 && (
            <img
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code PIX"
              className="mx-auto mb-3 h-44 w-44"
            />
          )}
          <p className="break-all">{pix.qr_code}</p>
        </div>
      )}

      <button type="submit" disabled={loading} className="gold-button mt-5 w-full">
        {loading ? "Gerando pagamento..." : "Comprar"}
      </button>
    </form>
  );
}
