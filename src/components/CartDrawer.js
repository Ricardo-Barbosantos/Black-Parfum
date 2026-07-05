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

const GOLD = '#d4af37';
const DARK_BG = '#0a0a0a';
const DARK_CARD = '#111111';
const DARK_BORDER = '#2a2a2a';

/* ─────────────────────────────────────────────
   ÍCONES SVG INLINE
───────────────────────────────────────────── */
const IconPix = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L6.5 7.5H3v3L2 12l1 1.5v3h3.5L12 22l5.5-5.5H21v-3l1-1.5-1-1.5v-3h-3.5L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconBoleto = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 8v8M8 8v8M11 8v8M13 8v8M16 8v8M18 8v8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
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
   QR CODE PATTERN (visual enquanto carrega)
───────────────────────────────────────────── */
function QRPattern() {
  const cells = useRef(Array.from({ length: 15 * 15 }, () => Math.random() > 0.55 ? 1 : 0)).current;
  return (
    <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 8, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(15,1fr)', gap: 1, flexShrink: 0 }}>
      {cells.map((c, i) => <div key={i} style={{ background: c ? '#0a0a0a' : '#fff' }} />)}
    </div>
  );
}

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
  const isFreeDelivery = checkoutForm.deliveryMethod === 'pickup' || isFreeShippingRegion(checkoutForm.city || '');
  const hasValidZip = cleanZip(checkoutForm.zip || '').length === 8;
  const selectedShippingOption = isFreeDelivery ? null : shippingOptions.find(o => o.id === checkoutForm.shippingServiceId) || shippingOptions[0] || null;
  const shippingCost = isFreeDelivery ? 0 : Number(selectedShippingOption?.price || 0);
  const couponDiscount = getCouponDiscount(cartTotal, appliedCoupon);
  const pixDiscount = paymentMethod === 'pix' ? Number((cartTotal * 0.05).toFixed(2)) : 0;
  const orderTotal = Number((cartTotal - couponDiscount + shippingCost).toFixed(2));
  const finalTotal = Number((orderTotal - pixDiscount).toFixed(2));

  const requiredFields = checkoutForm.deliveryMethod === 'home'
    ? ['name', 'email', 'zip', 'address', 'number', 'neighborhood', 'city']
    : ['name', 'email'];
  const isFieldMissing = (f) => {
    if (f === 'zip') return cleanZip(checkoutForm.zip || '').length !== 8;
    return !String(checkoutForm[f] || '').trim();
  };
  const missingFields = requiredFields.filter(isFieldMissing);
  const hasDeliveryAddressDetails = checkoutForm.deliveryMethod === 'home' && hasValidZip && ['address', 'number', 'neighborhood', 'city'].every(f => String(checkoutForm[f] || '').trim());
  const showFinalSummary = checkoutForm.deliveryMethod === 'pickup' || isFreeDelivery || Boolean(selectedShippingOption) || shippingLoading;

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
        // Não vai para success ainda — fica na tela PIX aguardando
      } else if (paymentMethod === 'boleto' && data.boletoData) {
        setBoletoData(data.boletoData);
        setCheckoutStep('success');
        if (onCheckout) onCheckout('__transparent__');
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
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: DARK_BG, borderRadius: 16, padding: '40px 32px', maxWidth: 440, width: '100%', textAlign: 'center', border: `1px solid ${DARK_BORDER}`, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ marginBottom: 20 }}>
            <IconStar />
          </div>
          <div style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#666', marginBottom: 8, fontFamily: 'var(--font-cinzel, serif)' }}>Obsidian Parfums</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>Pedido Confirmado!</h2>
          <div style={{ width: 48, height: 2, background: GOLD, margin: '0 auto 20px' }} />

          {boletoData ? (
            <>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Seu boleto foi gerado com sucesso.<br />Vencimento em <strong style={{ color: '#fff' }}>3 dias úteis</strong>.
              </p>
              <div style={{ background: '#161616', border: `1px solid ${DARK_BORDER}`, borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>Linha digitável</div>
                <div style={{ fontSize: 12, color: '#ccc', wordBreak: 'break-all', lineHeight: 1.5 }}>{boletoData.barcode || 'Disponível no seu e-mail'}</div>
              </div>
              {boletoData.barcode && (
                <button onClick={() => copyText(boletoData.barcode)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto 20px', padding: '10px 18px', borderRadius: 6, border: `1px solid ${GOLD}`, background: copied ? GOLD : 'transparent', color: copied ? '#000' : GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? <IconCheck /> : <IconCopy />} {copied ? 'Copiado!' : 'Copiar código'}
                </button>
              )}
              {boletoData.externalResourceUrl && (
                <a href={boletoData.externalResourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 20, padding: '12px', borderRadius: 8, background: GOLD, color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                  Visualizar Boleto
                </a>
              )}
            </>
          ) : (
            <>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Obrigado pela sua compra! 🖤<br />
                Seu pedido foi recebido e está sendo processado.<br />
                Você receberá uma confirmação no e-mail<br />
                <strong style={{ color: '#fff' }}>{checkoutForm.email}</strong>
              </p>
            </>
          )}

          {orderResult && (
            <div style={{ background: '#161616', border: `1px solid ${DARK_BORDER}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#666' }}>Pedido</span>
              <span style={{ fontSize: 12, color: '#aaa', fontWeight: 700 }}>{orderResult.orderId}</span>
            </div>
          )}

          <button onClick={() => { setCheckoutStep('delivery'); onClose(); }} style={{ width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: GOLD, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
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
      { id: 'credit_card', Icon: IconCard, label: 'Cartão de crédito', tag: 'Em até 1x sem juros' },
      { id: 'boleto', Icon: IconBoleto, label: 'Boleto bancário', tag: 'Compensação em 1-2 dias úteis' },
    ];

    const darkInput = { width: '100%', background: '#161616', border: `1px solid ${DARK_BORDER}`, borderRadius: 5, padding: '11px 13px', color: '#eee', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
    const darkLabel = { fontSize: 10.5, letterSpacing: 1, color: '#8a8a8a', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

    const focusGold = (e) => e.target.style.borderColor = GOLD;
    const blurDark  = (e) => e.target.style.borderColor = DARK_BORDER;

    // Tela PIX aguardando QR Code
    if (pixData) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: DARK_BG, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#555', marginBottom: 8, fontFamily: 'var(--font-cinzel, serif)' }}>Obsidian Parfums</div>
            <div style={{ width: 40, height: 2, background: GOLD, margin: '0 auto 24px' }} />
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pague com PIX</h2>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Escaneie o QR code ou copie a chave.<br />A confirmação é automática e imediata.</p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {pixData.qrCodeBase64
                ? <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" style={{ width: 180, height: 180, borderRadius: 10, background: '#fff', padding: 8 }} />
                : <QRPattern />}
            </div>

            {pixData.qrCode && (
              <div style={{ background: '#111', border: `1px solid ${DARK_BORDER}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, wordBreak: 'break-all', fontSize: 11, color: '#aaa', textAlign: 'left' }}>
                {pixData.qrCode.slice(0, 60)}...
              </div>
            )}

            <button onClick={() => copyText(pixData.qrCode)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto 24px', padding: '11px 20px', borderRadius: 6, border: `1px solid ${GOLD}`, background: copied ? GOLD : 'transparent', color: copied ? '#000' : GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {copied ? <IconCheck /> : <IconCopy />} {copied ? 'Copiado!' : 'Copiar chave PIX'}
            </button>

            {orderResult && (
              <div style={{ fontSize: 11, color: '#555', marginBottom: 20 }}>Pedido: {orderResult.orderId} · Total: R$ {formatMoney(finalTotal)}</div>
            )}

            <p style={{ fontSize: 11, color: '#555', marginBottom: 20 }}>Após o pagamento, você receberá a confirmação por e-mail.</p>

            <button onClick={() => { setCheckoutStep('success'); if (onCheckout) onCheckout('__transparent__'); }}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: `1px solid ${DARK_BORDER}`, background: '#161616', color: '#888', fontSize: 13, cursor: 'pointer' }}>
              Já paguei — ver confirmação
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: DARK_BG, zIndex: 999, overflowY: 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ padding: '28px 16px 60px', maxWidth: 860, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 5, textTransform: 'uppercase', color: '#eee', fontFamily: 'var(--font-cinzel, serif)' }}>
              Obsidian <span style={{ color: GOLD }}>Parfums</span>
            </div>
            <div style={{ width: 40, height: 2, background: GOLD, margin: '8px auto 0' }} />
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: GOLD, color: '#000', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
            <span style={{ fontSize: 12, color: '#666' }}>Entrega</span>
            <IconCheck />
            <div style={{ flex: 1, height: 1, background: '#222' }} />
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: GOLD, color: '#000', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#eee' }}>Pagamento</span>
          </div>

          {/* Grid — resumo primeiro no mobile */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, alignItems: 'start' }}>

            {/* Coluna esquerda — Métodos (direita no mobile fica abaixo) */}
            <div style={{ flex: isMobile ? 'none' : '1.3', minWidth: 0, order: isMobile ? 2 : 1 }}>
              <div style={{ border: `1px solid ${DARK_BORDER}`, borderRadius: 10, overflow: 'hidden', background: DARK_CARD }}>
                {methods.map((m, idx) => (
                  <div key={m.id} style={{ borderTop: idx ? `1px solid ${DARK_BORDER}` : 'none' }}>
                    <button onClick={() => setPaymentMethod(m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${paymentMethod === m.id ? GOLD : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {paymentMethod === m.id && <div style={{ width: 9, height: 9, borderRadius: '50%', background: GOLD }} />}
                      </div>
                      <span style={{ color: paymentMethod === m.id ? GOLD : '#999', display: 'flex' }}><m.Icon /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>{m.label}</div>
                        <div style={{ fontSize: 11.5, color: m.id === 'pix' ? GOLD : '#666' }}>{m.tag}</div>
                      </div>
                      <span style={{ color: '#555' }}><IconChevron open={paymentMethod === m.id} /></span>
                    </button>

                    {paymentMethod === m.id && (
                      <div style={{ padding: '0 18px 20px' }}>

                        {/* PIX */}
                        {m.id === 'pix' && (
                          <div style={{ background: '#0d0d0d', border: `1px solid #1e1e1e`, borderRadius: 8, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                              {/* Ícone decorativo PIX */}
                              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#1a1a1a,#0d0d0d)', border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                  <path d="M6.5 6.5L12 2l5.5 4.5V12L12 22 6.5 12V6.5z" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round"/>
                                  <path d="M8 12h8M12 8v8" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12.5, color: '#bbb', margin: '0 0 10px', lineHeight: 1.6 }}>
                                  Ao confirmar, você receberá o <strong style={{ color: '#eee' }}>QR Code PIX</strong> para escanear no app do banco. A confirmação é automática e imediata.
                                </p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: GOLD, fontWeight: 700, padding: '5px 10px', border: `1px solid ${GOLD}`, borderRadius: 5 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  5% de desconto
                                </div>
                                <div style={{ marginTop: 12 }}>
                                  <label style={darkLabel}>CPF (opcional)</label>
                                  <input value={formatCpf(cpf)} onChange={e => setCpf(e.target.value)} onFocus={focusGold} onBlur={blurDark} placeholder="000.000.000-00" style={{ ...darkInput, width: '100%' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CARTÃO */}
                        {m.id === 'credit_card' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <label style={darkLabel}>Número do cartão</label>
                              <input value={cardForm.number} onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))} onFocus={focusGold} onBlur={blurDark} placeholder="0000 0000 0000 0000" maxLength={19} style={darkInput} />
                            </div>
                            <div>
                              <label style={darkLabel}>Nome no cartão</label>
                              <input value={cardForm.name} onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))} onFocus={focusGold} onBlur={blurDark} placeholder="COMO ESTÁ NO CARTÃO" style={darkInput} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <label style={darkLabel}>Validade</label>
                                <input value={cardForm.expiry} onChange={e => setCardForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))} onFocus={focusGold} onBlur={blurDark} placeholder="MM/AA" maxLength={5} style={darkInput} />
                              </div>
                              <div>
                                <label style={darkLabel}>CVV</label>
                                <input value={cardForm.cvv} onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} onFocus={focusGold} onBlur={blurDark} placeholder="123" maxLength={4} type="password" style={darkInput} />
                              </div>
                            </div>
                            <div>
                              <label style={darkLabel}>Parcelas</label>
                              <select value={cardForm.installments} onChange={e => setCardForm(f => ({ ...f, installments: Number(e.target.value) }))} style={{ ...darkInput, cursor: 'pointer' }}>
                                {[1,2,3,4,5].map(n => (
                                  <option key={n} value={n}>{n}x de R$ {formatMoney(finalTotal / n)} sem juros</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* BOLETO */}
                        {m.id === 'boleto' && (
                          <div style={{ background: '#0d0d0d', border: `1px solid #1e1e1e`, borderRadius: 8, padding: 16 }}>
                            <p style={{ fontSize: 12.5, color: '#999', margin: '0 0 16px', lineHeight: 1.5 }}>
                              O boleto será gerado e enviado para seu e-mail. Vencimento em <strong style={{ color: '#eee' }}>3 dias úteis</strong>.
                            </p>
                            <div>
                              <label style={darkLabel}>CPF*</label>
                              <input value={formatCpf(cpf)} onChange={e => setCpf(e.target.value)} onFocus={focusGold} onBlur={blurDark} placeholder="000.000.000-00" style={darkInput} />
                              <div style={{ fontSize: 10.5, color: '#555', marginTop: 6 }}>Necessário para emissão do boleto</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {paymentError && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13 }}>
                  {paymentError}
                </div>
              )}

              <button onClick={handlePay} disabled={paymentLoading}
                style={{ width: '100%', marginTop: 16, padding: '15px', borderRadius: 8, border: 'none', background: paymentLoading ? '#555' : GOLD, color: '#0a0a0a', fontWeight: 800, fontSize: 14, letterSpacing: 0.5, cursor: paymentLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                {paymentLoading ? 'Processando...' : `Pagar R$ ${formatMoney(finalTotal)}`}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#555' }}>
                <IconLock /> Ambiente seguro · Mercado Pago
              </div>

              <button onClick={() => setCheckoutStep('delivery')} style={{ display: 'block', margin: '12px auto 0', background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Voltar aos dados de entrega
              </button>
            </div>

            {/* Coluna direita — Resumo (aparece primeiro no mobile) */}
            <div style={{ border: `1px solid ${DARK_BORDER}`, borderRadius: 10, background: DARK_CARD, padding: isMobile ? '14px 16px' : 20, position: isMobile ? 'static' : 'sticky', top: 20, flex: isMobile ? 'none' : '1', minWidth: 0, order: isMobile ? 1 : 2, width: isMobile ? '100%' : 'auto' }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: '#666', textTransform: 'uppercase', marginBottom: 14 }}>Resumo do pedido</div>

              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 6, background: 'linear-gradient(145deg,#1a1a1a,#0a0a0a)', border: `1px solid #262626`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>{item.quantity}x</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, lineHeight: 1.3, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}{item.selectedSize ? ` (${item.selectedSize})` : ''}</div>
                    <div style={{ fontSize: 10.5, color: '#666' }}>Qtd: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#eee', whiteSpace: 'nowrap' }}>R$ {formatMoney(item.price * item.quantity)}</div>
                </div>
              ))}

              <div style={{ borderTop: `1px solid ${DARK_BORDER}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                  <span>Subtotal</span><span>R$ {formatMoney(cartTotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4ade80' }}>
                    <span>Cupom ({appliedCoupon.code})</span><span>- R$ {formatMoney(couponDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconTruck /> Frete</span>
                  <span>{isFreeDelivery ? 'Grátis' : `R$ ${formatMoney(shippingCost)}`}</span>
                </div>
                {pixDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: GOLD }}>
                    <span>Desconto PIX</span><span>- R$ {formatMoney(pixDiscount)}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${DARK_BORDER}`, marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#eee' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>R$ {formatMoney(finalTotal)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 11, color: '#555', justifyContent: 'center' }}>
                <IconShield /> Dados protegidos com criptografia
              </div>
            </div>
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
                        <button onClick={() => onDecrease(item.cartItemId || item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#111' }}>-</button>
                        <div style={{ padding: '4px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', background: '#fafafa' }}>{item.quantity}</div>
                        <button onClick={() => onIncrease(item.cartItemId || item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#111' }}>+</button>
                      </div>
                      <button onClick={() => onRemove(item.cartItemId || item.id)} style={{ fontSize: '0.8rem', color: '#999', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Remover</button>
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

            {/* Entrega */}
            <h3 style={{ fontSize: '0.72rem', marginBottom: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Forma de Entrega</h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', color: '#111' }}>
                <input type="radio" name="deliveryMethod" value="home" checked={checkoutForm.deliveryMethod === 'home'} onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'home'})} style={{ accentColor: '#111' }} />
                Receber em Casa
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', color: '#111' }}>
                <input type="radio" name="deliveryMethod" value="pickup" checked={checkoutForm.deliveryMethod === 'pickup'} onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'pickup'})} style={{ accentColor: '#111' }} />
                Retirar na Loja
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <h3 style={sectionTitleStyle}>Contato</h3>
              <div style={compactFieldStyle}>
                <label style={compactLabelStyle}>Nome*</label>
                <input type="text" value={checkoutForm.name} onChange={e => onFormChange({...checkoutForm, name: e.target.value})} style={compactInputStyle()} />
                {fieldError('name')}
              </div>
              <div style={compactFieldStyle}>
                <label style={compactLabelStyle}>E-mail*</label>
                <input type="email" value={checkoutForm.email || ''} onChange={e => onFormChange({...checkoutForm, email: e.target.value})} style={compactInputStyle()} />
                {fieldError('email')}
              </div>

              {checkoutForm.deliveryMethod === 'home' && (
                <>
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

                  {isFreeDelivery && <div style={{ fontSize: '0.82rem', color: '#16a34a', lineHeight: 1.3 }}>Frete grátis.</div>}
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
                </>
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
                if (checkoutForm.deliveryMethod === 'home' && !isFreeDelivery && !selectedShippingOption && !shippingLoading) { setSubmitted(true); return; }
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
