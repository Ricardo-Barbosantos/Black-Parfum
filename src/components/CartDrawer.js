'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────
   UTILITÁRIOS
───────────────────────────────────────────── */
function isFreeShippingRegion(city = '') {
  return city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('vitoria da conquista');
}
function cleanZip(v = '') { return v.replace(/\D/g, '').slice(0, 8); }
function formatZip(v = '') { const z = cleanZip(v); return z.length <= 5 ? z : `${z.slice(0,5)}-${z.slice(5)}`; }
function formatPhone(v = '') {
  const c = v.replace(/\D/g, '').slice(0, 11);
  if (c.length <= 2) return c;
  if (c.length <= 6) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7)}`;
}
function getLookupZip(v = '') {
  const z = cleanZip(v);
  if (z.length === 8) return z;
  if (z.length === 7 && z.endsWith('000')) return `${z}0`;
  if (z.length === 6 && z.endsWith('000')) return `${z}00`;
  return '';
}
function formatMoney(v = 0) { return Number(v || 0).toFixed(2).replace('.', ','); }
function getCouponDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  const d = Number(subtotal || 0) * (Number(coupon.discountPercent || 0) / 100);
  return Number(Math.min(Number(subtotal || 0), d).toFixed(2));
}
function formatCpf(v = '') {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
function formatCardNumber(v = '') {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v = '') {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}/${d.slice(2)}`;
}

const GOLD = '#c9a84c';
const LIGHT_BG = '#f8f6f2';
const WHITE = '#ffffff';
const BORDER = '#e8e2d9';
const TEXT = '#1a1614';
const TEXT2 = '#6b6560';
const TEXT3 = '#a09992';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
/* Logo PIX oficial */
const IconPix = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
    <path fill="#4db6ac" d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"/>
    <path fill="#4db6ac" d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"/>
    <path fill="#4db6ac" d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z"/>
  </svg>
);
const IconCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#d4af37" strokeWidth="1.5"/>
    <path d="M2 10h20" stroke="#d4af37" strokeWidth="1.5"/>
    <path d="M6 15h4" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
/* Mastercard logo */
const MastercardLogo = () => (
  <svg width="36" height="22" viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="22" rx="3" fill="#f5f5f5"/>
    <circle cx="13.5" cy="11" r="7" fill="#EB001B"/>
    <circle cx="22.5" cy="11" r="7" fill="#F79E1B"/>
    <path d="M18 5.8a7 7 0 0 1 0 10.4A7 7 0 0 1 18 5.8z" fill="#FF5F00"/>
  </svg>
);
/* Visa logo */
const VisaLogo = () => (
  <svg width="36" height="22" viewBox="0 0 36 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="22" rx="3" fill="#f5f5f5"/>
    <text x="5" y="15" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="#1A1F71" letterSpacing="1">VISA</text>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <polyline points="9 12 11 14 15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTruck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
    <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconStar = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill={GOLD}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function CartDrawer({
  isOpen, onClose, cart, cartTotal, cartItemCount,
  onRemove, onIncrease, onDecrease,
  checkoutForm, onFormChange,
  onCheckout, checkoutLoading = false
}) {
  /* ─── Estados do Carrinho / Entrega ─── */
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  /* ─── Estados do Pagamento ─── */
  const [checkoutStep, setCheckoutStep] = useState('delivery'); // 'delivery' | 'payment' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '', installments: 1 });
  const [cpf, setCpf] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [pixData, setPixData] = useState(null);   // { qrCode, qrCodeBase64 }
  const [boletoData, setBoletoData] = useState(null);
  const [orderResult, setOrderResult] = useState(null); // { orderId, total }
  const [copied, setCopied] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ─── Detectar mobile ─── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ─── Carregar SDK do Mercado Pago ─── */
  useEffect(() => {
    if (checkoutStep !== 'payment') return;
    if (window.MercadoPago) { setMpLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => setMpLoaded(true);
    document.head.appendChild(script);
  }, [checkoutStep]);

  /* ─── Resetar tela de pagamento quando fechar ─── */
  useEffect(() => {
    if (!isOpen) {
      setCheckoutStep('delivery');
      setPaymentError('');
      setPixData(null);
      setBoletoData(null);
      setOrderResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* ─── Cálculos ─── */
  const isFreeDelivery = isFreeShippingRegion(checkoutForm.city || '');
  const hasValidZip = cleanZip(checkoutForm.zip || '').length === 8;
  const selectedShippingOption = isFreeDelivery ? null : shippingOptions.find(o => o.id === checkoutForm.shippingServiceId) || shippingOptions[0] || null;
  const shippingCost = isFreeDelivery ? 0 : Number(selectedShippingOption?.price || 0);
  const couponDiscount = getCouponDiscount(cartTotal, appliedCoupon);
  const pixDiscount = paymentMethod === 'pix' && couponDiscount === 0 ? Number((cartTotal * 0.05).toFixed(2)) : 0;
  const orderTotal = Number((cartTotal - couponDiscount + shippingCost).toFixed(2));
  const finalTotal = Number((orderTotal - pixDiscount).toFixed(2));

  const requiredFields = ['name', 'email', 'whatsapp', 'zip', 'address', 'number', 'neighborhood', 'city'];
  const isFieldMissing = (f) => {
    if (f === 'zip') return cleanZip(checkoutForm.zip || '').length !== 8;
    return !String(checkoutForm[f] || '').trim();
  };
  const missingFields = requiredFields.filter(isFieldMissing);
  const hasDeliveryAddressDetails = hasValidZip && ['address', 'number', 'neighborhood', 'city'].every(f => String(checkoutForm[f] || '').trim());
  const showFinalSummary = isFreeDelivery || Boolean(selectedShippingOption) || shippingLoading;

  /* ─── Estilos compartilhados (Delivery step) ─── */
  const inputStyle = (extra = {}) => ({ padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.95rem', minHeight: '38px', lineHeight: 1.2, color: '#111', background: '#fff', ...extra });
  const compactFieldStyle = { position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' };
  const compactLabelStyle = { position: 'absolute', top: '5px', left: '10px', color: '#777', fontSize: '0.63rem', fontWeight: 600, lineHeight: 1, pointerEvents: 'none', zIndex: 1 };
  const compactInputStyle = (extra = {}) => inputStyle({ width: '100%', minHeight: '44px', padding: '17px 10px 5px', fontSize: '0.93rem', fontWeight: 600, ...extra });
  const errorStyle = { color: '#dc2626', fontSize: '0.78rem', lineHeight: 1.35 };
  const sectionTitleStyle = { fontSize: '0.72rem', margin: 0, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' };
  const fieldError = (f) => {
    if (!submitted || !isFieldMissing(f)) return null;
    return <span style={errorStyle}>{f === 'zip' ? 'Informe um CEP válido.' : 'Campo obrigatório.'}</span>;
  };

  /* ─── Cupom ─── */
  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) { setAppliedCoupon(null); setCouponMessage('Digite um cupom.'); return; }
    setCouponLoading(true); setCouponMessage('');
    try {
      const res = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, subtotal: cartTotal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cupom inválido.');
      setAppliedCoupon(data.coupon); setCouponCode(data.coupon.code);
      setCouponMessage(`Cupom aplicado: ${data.coupon.discountPercent}% de desconto.`);
    } catch (e) { setAppliedCoupon(null); setCouponMessage(e.message || 'Não foi possível aplicar o cupom.'); }
    finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(''); };

  /* ─── Frete ─── */
  const loadShippingOptions = async ({ zip, city, form = checkoutForm }) => {
    const nz = cleanZip(zip || '');
    if (!nz || nz.length !== 8 || isFreeShippingRegion(city || '')) { setShippingOptions([]); setShippingError(''); return; }
    setShippingLoading(true); setShippingError('');
    try {
      const res = await fetch('/api/shipping/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryMethod: form.deliveryMethod, city, zip: nz, subtotal: cartTotal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível calcular o frete.');
      const opts = Array.isArray(data.options) ? data.options : [];
      setShippingOptions(opts);
      if (opts.length > 0 && !form.shippingServiceId) onFormChange({ ...form, shippingServiceId: opts[0].id });
    } catch (e) { setShippingOptions([]); setShippingError(e.message || 'Não conseguimos carregar as opções de frete agora.'); }
    finally { setShippingLoading(false); }
  };
  const lookupZip = async (rawZip, baseForm = checkoutForm) => {
    const lv = getLookupZip(rawZip);
    if (!lv) { setShippingOptions([]); setShippingError(''); setCepMessage(''); return; }
    setCepLoading(true); setCepMessage('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${lv}/json/`);
      const data = await res.json();
      if (!res.ok || data.erro) throw new Error('CEP não encontrado.');
      const nextForm = { ...baseForm, zip: formatZip(lv), address: data.logradouro || baseForm.address || '', neighborhood: data.bairro || baseForm.neighborhood || '', city: data.localidade || baseForm.city || '', state: data.uf || baseForm.state || '', shippingServiceId: '' };
      onFormChange(nextForm);
      loadShippingOptions({ zip: lv, city: nextForm.city, form: nextForm });
    } catch (e) { setShippingOptions([]); setShippingError(''); setCepMessage(e.message || 'Não encontramos esse CEP.'); }
    finally { setCepLoading(false); }
  };

  /* ─── Copiar código ─── */
  const copyText = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  /* ─── Processar Pagamento ─── */
  const handlePay = async () => {
    setPaymentError('');

    if (paymentMethod === 'credit_card') {
      // Tokenizar cartão via SDK do MP
      if (!mpLoaded || !window.MercadoPago) {
        setPaymentError('SDK de pagamento ainda carregando. Aguarde um momento.');
        return;
      }
      const [expM, expY] = (cardForm.expiry || '').split('/');
      if (!cardForm.number.replace(/\s/g,'') || !cardForm.name || !expM || !expY || !cardForm.cvv) {
        setPaymentError('Preencha todos os dados do cartão.');
        return;
      }
    }

    if (paymentMethod === 'boleto' && cpf.replace(/\D/g,'').length !== 11) {
      setPaymentError('Informe um CPF válido para gerar o boleto.');
      return;
    }

    setPaymentLoading(true);
    try {
      let cardToken = undefined;

      if (paymentMethod === 'credit_card') {
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: 'pt-BR' });
        const [expM, expY] = cardForm.expiry.split('/');
        const tokenResult = await mp.createCardToken({
          cardNumber: cardForm.number.replace(/\s/g, ''),
          cardholderName: cardForm.name,
          cardExpirationMonth: expM.trim(),
          cardExpirationYear: `20${expY.trim()}`,
          securityCode: cardForm.cvv,
        });
        if (tokenResult.error) throw new Error('Erro ao tokenizar cartão: ' + (tokenResult.error.cause?.[0]?.description || tokenResult.error));
        cardToken = tokenResult.id;
      }

      const res = await fetch('/api/checkout/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart.map(i => ({ id: i.id, cartItemId: i.cartItemId || i.id, selectedSize: i.selectedSize || '', quantity: i.quantity })),
          customer: checkoutForm,
          paymentMethod,
          cardToken,
          cardInstallments: cardForm.installments,
          cpf: cpf.replace(/\D/g, ''),
          shippingServiceId: checkoutForm.shippingServiceId || undefined,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento.');

      setOrderResult({ orderId: data.orderId, total: data.total });

      if (paymentMethod === 'pix' && data.pixData) {
        setPixData(data.pixData);
      } else {
        setCheckoutStep('success');
        if (onCheckout) onCheckout('__transparent__');
      }
    } catch (e) {
      setPaymentError(e.message || 'Erro ao processar pagamento.');
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     RENDER — TELA DE SUCESSO
  ───────────────────────────────────────────── */
  if (checkoutStep === 'success') {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(30,24,18,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: WHITE, borderRadius: 20, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', border: `1px solid ${BORDER}`, fontFamily: 'Inter, system-ui, sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}44)`, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <IconStar />
          </div>
          <div style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: TEXT3, marginBottom: 6, fontFamily: 'var(--font-cinzel, serif)' }}>Obsidian Parfums</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 6px', fontFamily: 'var(--font-cinzel, serif)' }}>Pedido Confirmado!</h2>
          <div style={{ width: 40, height: 2, background: GOLD, margin: '0 auto 20px' }} />
          <p style={{ color: TEXT2, fontSize: 13.5, lineHeight: 1.7, marginBottom: 20 }}>
            Obrigado pela sua compra! ✨<br />
            Seu pedido foi recebido com sucesso.<br />
            Enviaremos a confirmação para<br />
            <strong style={{ color: TEXT }}>{checkoutForm.email}</strong>
          </p>
          {orderResult && (
            <div style={{ background: LIGHT_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: 1 }}>Número do Pedido</span>
              <span style={{ fontSize: 12, color: TEXT, fontWeight: 700, fontFamily: 'monospace' }}>{orderResult.orderId}</span>
            </div>
          )}
          <button onClick={() => { setCheckoutStep('delivery'); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${GOLD}, #b8943c)`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: 1, boxShadow: `0 4px 20px ${GOLD}44` }}>
            Voltar à Loja
          </button>
        </div>
      </div>
    );
  }


  /* ─────────────────────────────────────────────
     RENDER — TELA DE PAGAMENTO
  ───────────────────────────────────────────── */
  if (checkoutStep === 'payment') {
    const methods = [
      { id: 'pix', Icon: IconPix, label: 'PIX', tag: '5% de desconto · aprovação imediata' },
      { id: 'credit_card', Icon: IconCard, label: 'Cartão de crédito ou débito', tag: 'Visa · Mastercard · Elo · Hipercard' },
    ];

    const fieldInput = { width: '100%', background: WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '11px 13px', color: TEXT, fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' };
    const fieldLabel = { fontSize: 10, letterSpacing: 1.2, color: TEXT3, textTransform: 'uppercase', display: 'block', marginBottom: 6, fontWeight: 600 };

    const focusGold = (e) => e.target.style.borderColor = GOLD;
    const blurBorder = (e) => e.target.style.borderColor = BORDER;

    // Tela PIX aguardando QR Code
    if (pixData) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: LIGHT_BG, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif', overflowY: 'auto' }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: WHITE, borderRadius: 20, padding: '36px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: TEXT3, marginBottom: 6, fontFamily: 'var(--font-cinzel, serif)' }}>Obsidian Parfums</div>
            <div style={{ width: 36, height: 2, background: GOLD, margin: '0 auto 20px' }} />

            {/* PIX Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <IconPix />
              <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'var(--font-cinzel, serif)' }}>Pague com PIX</h2>
            </div>
            <p style={{ color: TEXT2, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>Escaneie o QR code ou copie a chave.<br />Confirmação automática e imediata.</p>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {pixData.qrCodeBase64
                ? <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 10, boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }} />
                : <QRPattern />}
            </div>

            {pixData.qrCode && (
              <div style={{ background: LIGHT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, wordBreak: 'break-all', fontSize: 10.5, color: TEXT2, textAlign: 'left', lineHeight: 1.5 }}>
                {pixData.qrCode.slice(0, 70)}...
              </div>
            )}

            <button onClick={() => copyText(pixData.qrCode)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto 20px', padding: '12px 22px', borderRadius: 8, border: `1.5px solid ${GOLD}`, background: copied ? GOLD : 'transparent', color: copied ? '#fff' : GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? <IconCheck /> : <IconCopy />} {copied ? 'Copiado!' : 'Copiar chave PIX'}
            </button>

            {orderResult && (
              <div style={{ fontSize: 11, color: TEXT3, marginBottom: 16 }}>Pedido: <strong style={{ color: TEXT }}>{orderResult.orderId}</strong> · Total: <strong style={{ color: GOLD }}>R$ {formatMoney(finalTotal)}</strong></div>
            )}

            <p style={{ fontSize: 11, color: TEXT3, marginBottom: 20 }}>Após o pagamento, você receberá a confirmação por e-mail.</p>

            <button onClick={() => { setCheckoutStep('success'); if (onCheckout) onCheckout('__transparent__'); }}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: LIGHT_BG, color: TEXT2, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Já paguei — ver confirmação
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', background: '#f0f2f5', zIndex: 999, overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Top Header */}
        <div style={{ position: 'sticky', top: 0, background: WHITE, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={() => setCheckoutStep('delivery')} style={{ position: 'absolute', left: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: TEXT, fontFamily: 'var(--font-cinzel, serif)' }}>
            Obsidian <span style={{ color: GOLD }}>Parfums</span>
          </div>
        </div>

        <div style={{ paddingBottom: 160, maxWidth: 600, margin: '0 auto' }}>
          {/* Address */}
          <div style={{ background: WHITE, padding: 20, marginBottom: 8, cursor: 'pointer' }} onClick={() => setCheckoutStep('delivery')}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: TEXT }}>Endereços de Entrega</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 4 }}>{checkoutForm.name}</div>
                <div style={{ fontSize: 13, color: TEXT2, marginBottom: 4 }}>{checkoutForm.whatsapp}</div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.4 }}>{checkoutForm.address}{checkoutForm.number ? `, ${checkoutForm.number}` : ''}{checkoutForm.complement ? ` - ${checkoutForm.complement}` : ''}</div>
                <div style={{ fontSize: 13, color: TEXT2 }}>{checkoutForm.city}, {checkoutForm.state}, Brasil, {checkoutForm.zip}</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{ background: WHITE, padding: '20px 20px 10px', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: TEXT }}>Métodos de Pagamento</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {methods.map((m, idx) => (
                <div key={m.id} style={{ borderTop: idx ? `1px solid ${BORDER}` : 'none' }}>
                  <button onClick={() => setPaymentMethod(m.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${paymentMethod === m.id ? GOLD : '#ccc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {paymentMethod === m.id && <div style={{ width: 12, height: 12, borderRadius: '50%', background: GOLD }} />}
                    </div>
                    <span style={{ color: paymentMethod === m.id ? (m.id === 'pix' ? '#4db6ac' : GOLD) : TEXT3, display: 'flex' }}><m.Icon /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{m.label}</div>
                      {m.id === 'pix' && (
                        <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>5% de desconto</div>
                      )}
                      {m.id === 'credit_card' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                          <MastercardLogo />
                          <VisaLogo />
                          <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', height: 22, background: '#f0f0f0', borderRadius: 3, fontSize: 9, fontWeight: 800, color: '#555', letterSpacing: 0.5 }}>ELO</div>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', height: 22, background: '#f0f0f0', borderRadius: 3, fontSize: 9, fontWeight: 800, color: '#b22222', letterSpacing: 0.5 }}>HIPER</div>
                        </div>
                      )}
                    </div>
                  </button>
                  {paymentMethod === m.id && m.id === 'credit_card' && (
                    <div style={{ padding: '0 0 16px 34px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <input value={cardForm.number} onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))} onFocus={focusGold} onBlur={blurBorder} placeholder="Número do cartão" maxLength={19} style={fieldInput} />
                        </div>
                        <div>
                          <input value={cardForm.name} onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))} onFocus={focusGold} onBlur={blurBorder} placeholder="Nome impresso no cartão" style={fieldInput} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <input value={cardForm.expiry} onChange={e => setCardForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))} onFocus={focusGold} onBlur={blurBorder} placeholder="Validade (MM/AA)" maxLength={5} style={fieldInput} />
                          <input value={cardForm.cvv} onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} onFocus={focusGold} onBlur={blurBorder} placeholder="CVV" maxLength={4} type="password" style={fieldInput} />
                        </div>
                        <div>
                          <select value={cardForm.installments} onChange={e => setCardForm(f => ({ ...f, installments: Number(e.target.value) }))} style={{ ...fieldInput, cursor: 'pointer', appearance: 'auto' }}>
                            {[1,2,3,4,5].map(n => (
                              <option key={n} value={n}>{n}x de R$ {formatMoney(finalTotal / n)} sem juros</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {paymentError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                {paymentError}
              </div>
            )}
          </div>

          {/* Produtos e Resumo */}
          <div style={{ background: WHITE, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: TEXT }}>Resumo do Pedido</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 72, height: 72, borderRadius: 8, background: LIGHT_BG, border: `1px solid ${BORDER}`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>{item.quantity}x</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: TEXT, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}{item.selectedSize ? ` (${item.selectedSize})` : ''}</div>
                    <div style={{ fontSize: 13, color: TEXT2, marginTop: 6 }}>Qtd: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, display: 'flex', alignItems: 'flex-start' }}>R$ {formatMoney(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT2 }}>
                <span>Subtotal</span><span style={{ fontWeight: 600, color: TEXT }}>R$ {formatMoney(cartTotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
                  <span>Cupom ({appliedCoupon.code})</span><span style={{ fontWeight: 700 }}>- R$ {formatMoney(couponDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT2 }}>
                <span>Frete</span>
                <span style={{ fontWeight: 600, color: TEXT }}>{isFreeDelivery ? 'Grátis' : `R$ ${formatMoney(shippingCost)}`}</span>
              </div>
              {pixDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#009688' }}>
                  <span>Desconto PIX (5%)</span><span style={{ fontWeight: 700 }}>- R$ {formatMoney(pixDiscount)}</span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 12, color: TEXT3, justifyContent: 'center' }}>
              <IconShield /> Pagamento 100% seguro com criptografia
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        {/* Sticky Footer */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: WHITE, borderTop: `1px solid ${BORDER}`, padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '0 -4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ maxWidth: 600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, color: TEXT, fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: TEXT }}>R$ {formatMoney(finalTotal)}</span>
            </div>
            <button onClick={handlePay} disabled={paymentLoading}
              style={{ width: '100%', padding: '16px', borderRadius: 30, border: 'none', background: paymentLoading ? '#ccc' : `linear-gradient(135deg, #e11d48, #be123c)`, color: '#fff', fontWeight: 800, fontSize: 16, cursor: paymentLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: paymentLoading ? 'none' : `0 4px 15px rgba(225, 29, 72, 0.4)` }}>
              {paymentLoading ? 'Processando...' : 'Fazer o pedido'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     RENDER — PASSO 1: CARRINHO + ENTREGA
  ───────────────────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '520px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>

        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#111', fontFamily: 'var(--font-cinzel)' }}>Seu Carrinho ({cartItemCount})</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#111', lineHeight: '1' }}>×</button>
        </div>

        <div style={{ flex: '0 0 auto', maxHeight: '260px', overflowY: 'auto', padding: '15px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '60px', fontSize: '1rem' }}>Sua sacola está vazia.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map(item => (
                <div key={item.cartItemId || item.id} style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '14px', borderBottom: '1px solid #f4f4f4', paddingBottom: '15px', minHeight: '92px' }}>
                  <div style={{ width: '76px', height: '76px', position: 'relative', backgroundColor: '#fcfcfc', border: '1px solid #eaeaea', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <Image src={item.image || '/photos/perfume.jpg'} alt={item.name} width={60} height={60} style={{ objectFit: 'contain' }} />
                  </div>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111', lineHeight: '1.25', wordBreak: 'break-word' }}>{item.name}{item.selectedSize ? ` (${item.selectedSize})` : ''}</div>
                    <div style={{ color: '#111', fontWeight: '600', margin: '5px 0', fontSize: '1rem' }}>R$ {item.price.toFixed(2).replace('.', ',')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                        <button onClick={() => onDecrease(item.cartItemId || item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#e11d48', fontWeight: 700 }}>-</button>
                        <div style={{ padding: '4px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', background: '#fafafa', fontWeight: 600, color: '#111' }}>{item.quantity}</div>
                        <button onClick={() => onIncrease(item.cartItemId || item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#e11d48', fontWeight: 700 }}>+</button>
                      </div>
                      <button onClick={() => onRemove(item.cartItemId || item.id)} style={{ fontSize: '0.8rem', color: '#e11d48', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Remover</button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#111', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>← Adicionar mais produtos</button>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #eee', padding: '16px 20px 20px', backgroundColor: '#fcfcfc', boxShadow: '0 -5px 15px rgba(0,0,0,0.03)' }}>

            {/* Cupom */}
            <div style={{ border: '1px solid #eee', borderRadius: '6px', background: '#fff', padding: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: '8px' }}>
                <input type="text" placeholder="Cupom de desconto" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (appliedCoupon) setAppliedCoupon(null); if (couponMessage) setCouponMessage(''); }} style={inputStyle({ width: '100%', textTransform: 'uppercase' })} />
                <button type="button" onClick={applyCoupon} disabled={couponLoading} style={{ border: 'none', borderRadius: '4px', background: couponLoading ? '#777' : '#111', color: '#fff', fontWeight: 700, cursor: couponLoading ? 'not-allowed' : 'pointer' }}>
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponMessage && (
                <div style={{ fontSize: '0.78rem', color: appliedCoupon ? '#16a34a' : '#dc2626', marginTop: '8px', lineHeight: 1.35 }}>
                  {couponMessage}
                  {appliedCoupon && <button type="button" onClick={removeCoupon} style={{ marginLeft: '8px', border: 'none', background: 'transparent', color: '#555', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem' }}>remover</button>}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <h3 style={sectionTitleStyle}>Contato</h3>
              <div style={compactFieldStyle}>
                <label style={compactLabelStyle}>Nome*</label>
                <input type="text" value={checkoutForm.name || ''} onChange={e => onFormChange({...checkoutForm, name: e.target.value})} style={compactInputStyle()} />
                {fieldError('name')}
              </div>
              <div style={compactFieldStyle}>
                <label style={compactLabelStyle}>E-mail*</label>
                <input type="email" value={checkoutForm.email || ''} onChange={e => onFormChange({...checkoutForm, email: e.target.value})} style={compactInputStyle()} />
                {fieldError('email')}
              </div>
              <div style={compactFieldStyle}>
                <label style={compactLabelStyle}>WhatsApp*</label>
                <input type="tel" placeholder="(00) 00000-0000" value={checkoutForm.whatsapp || ''} onChange={e => onFormChange({...checkoutForm, whatsapp: formatPhone(e.target.value)})} style={compactInputStyle()} />
                {fieldError('whatsapp')}
              </div>

              <h3 style={{ ...sectionTitleStyle, marginTop: '4px' }}>Endereço</h3>
                  <div style={compactFieldStyle}>
                    <label style={compactLabelStyle}>CEP*</label>
                    <input type="text" value={formatZip(checkoutForm.zip)} maxLength={9} onChange={async (e) => { const zip = formatZip(e.target.value); const nextForm = { ...checkoutForm, zip, shippingServiceId: '' }; onFormChange(nextForm); lookupZip(zip, nextForm); }} style={compactInputStyle()} />
                    {cepLoading && <span style={{ color: '#666', fontSize: '0.76rem' }}>Buscando...</span>}
                    {cepMessage && <span style={{ color: '#dc2626', fontSize: '0.76rem', lineHeight: 1.25 }}>{cepMessage}</span>}
                    {fieldError('zip')}
                  </div>
                  <div style={compactFieldStyle}>
                    <label style={compactLabelStyle}>Cidade*</label>
                    <input type="text" value={checkoutForm.city} onChange={e => { const nextCity = e.target.value; const nextForm = { ...checkoutForm, city: nextCity, shippingServiceId: '' }; onFormChange(nextForm); loadShippingOptions({ zip: checkoutForm.zip, city: nextCity, form: nextForm }); }} style={compactInputStyle()} />
                    {fieldError('city')}
                  </div>
                  <div style={compactFieldStyle}>
                    <label style={compactLabelStyle}>Bairro*</label>
                    <input type="text" value={checkoutForm.neighborhood || ''} onChange={e => onFormChange({...checkoutForm, neighborhood: e.target.value})} style={compactInputStyle()} />
                    {fieldError('neighborhood')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: '6px' }}>
                    <div style={compactFieldStyle}>
                      <label style={compactLabelStyle}>Rua*</label>
                      <input type="text" value={checkoutForm.address} onChange={e => onFormChange({...checkoutForm, address: e.target.value})} style={compactInputStyle()} />
                      {fieldError('address')}
                    </div>
                    <div style={compactFieldStyle}>
                      <label style={compactLabelStyle}>Número*</label>
                      <input type="text" value={checkoutForm.number} onChange={e => onFormChange({...checkoutForm, number: e.target.value})} style={compactInputStyle()} />
                      {fieldError('number')}
                    </div>
                  </div>
                  <div style={compactFieldStyle}>
                    <label style={compactLabelStyle}>Complemento</label>
                    <input type="text" value={checkoutForm.complement} onChange={e => onFormChange({...checkoutForm, complement: e.target.value})} style={compactInputStyle({ fontWeight: 500 })} />
                  </div>

                  {isFreeDelivery && <div style={{ fontSize: '0.82rem', color: '#16a34a', lineHeight: 1.3 }}>Frete grátis. {isFreeShippingRegion(checkoutForm.city) ? 'Entrega em até 24 horas.' : ''}</div>}
                  {!isFreeDelivery && (hasValidZip || shippingLoading || shippingError || shippingOptions.length > 0) && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', padding: '8px', color: '#111' }}>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Frete</div>
                      {shippingLoading && <div style={{ fontSize: '0.83rem', color: '#666' }}>Calculando...</div>}
                      {shippingError && <div style={{ fontSize: '0.83rem', color: '#dc2626' }}>{shippingError}</div>}
                      {hasValidZip && !cepMessage && !shippingLoading && !shippingError && shippingOptions.length === 0 && <div style={{ fontSize: '0.83rem', color: '#666' }}>Frete indisponível.</div>}
                      {shippingOptions.map(option => (
                        <label key={option.id} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: '8px', alignItems: 'center', padding: '8px', marginTop: '6px', border: `1px solid ${(checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id) ? '#111827' : '#e5e7eb'}`, borderRadius: '6px', background: (checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id) ? '#f8fafc' : '#fff', fontSize: '0.86rem', cursor: 'pointer' }}>
                          <input type="radio" name="shippingOption" checked={checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id} onChange={() => onFormChange({...checkoutForm, shippingServiceId: option.id})} style={{ accentColor: '#111' }} />
                          <span><strong>{option.label}</strong>{option.deliveryTime ? <><br /><span style={{ color: '#666' }}>Prazo: {option.deliveryTime} dias úteis</span></> : null}</span>
                          <span style={{ fontWeight: 700 }}>R$ {Number(option.price || 0).toFixed(2).replace('.', ',')}</span>
                        </label>
                      ))}
                    </div>
                  )}
            </div>

            {/* Resumo */}
            {showFinalSummary ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', padding: '12px', marginBottom: '14px' }}>
                <h3 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>Resumo do pedido</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#555', marginBottom: '6px' }}><span>Produtos</span><span>R$ {formatMoney(cartTotal)}</span></div>
                {couponDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#16a34a', marginBottom: '6px' }}><span>Desconto ({appliedCoupon.code})</span><span>- R$ {formatMoney(couponDiscount)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#555', marginBottom: '8px' }}><span>Frete</span><span>{shippingLoading ? 'Calculando...' : isFreeDelivery ? 'Grátis' : `R$ ${formatMoney(shippingCost)}`}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.18rem', fontWeight: 800, color: '#111', borderTop: '1px solid #eee', paddingTop: '10px' }}><span>Total</span><span>{shippingLoading ? 'Calculando...' : `R$ ${formatMoney(orderTotal)}`}</span></div>
              </div>
            ) : (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', padding: '10px 12px', marginBottom: '14px', fontSize: '0.82rem', color: '#666', lineHeight: 1.35 }}>
                {hasDeliveryAddressDetails ? 'Aguardando frete para fechar o total.' : 'Preencha o endereço para ver o total com frete.'}
              </div>
            )}

            {/* Botão para ir ao pagamento */}
            <button
              onClick={() => {
                if (missingFields.length > 0) { setSubmitted(true); return; }
                if (!isFreeDelivery && !selectedShippingOption && !shippingLoading) { setSubmitted(true); return; }
                setSubmitted(false);
                setCheckoutStep('payment');
              }}
              style={{ width: '100%', background: '#111', color: GOLD, padding: '15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', letterSpacing: 1 }}>
              Ir para Pagamento →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
