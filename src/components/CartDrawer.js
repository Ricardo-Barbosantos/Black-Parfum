'use client';
import Image from 'next/image';
import { useState } from 'react';

function isFreeShippingRegion(city = '') {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('vitoria da conquista');
}

function cleanZip(value = '') {
  return value.replace(/\D/g, '').slice(0, 8);
}

function formatZip(value = '') {
  const zip = cleanZip(value);
  if (zip.length <= 5) return zip;
  return `${zip.slice(0, 5)}-${zip.slice(5)}`;
}

function getLookupZip(value = '') {
  const zip = cleanZip(value);

  if (zip.length === 8) return zip;
  if (zip.length === 7 && zip.endsWith('000')) return `${zip}0`;
  if (zip.length === 6 && zip.endsWith('000')) return `${zip}00`;

  return '';
}

function formatMoney(value = 0) {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

function getCouponDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  const discount = Number(subtotal || 0) * (Number(coupon.discountPercent || 0) / 100);
  return Number(Math.min(Number(subtotal || 0), discount).toFixed(2));
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  cartTotal,
  cartItemCount,
  onRemove,
  onIncrease,
  onDecrease,
  checkoutForm,
  onFormChange,
  onCheckout,
  checkoutLoading = false
}) {
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

  if (!isOpen) return null;

  const isFreeDelivery = checkoutForm.deliveryMethod === 'pickup' || isFreeShippingRegion(checkoutForm.city || '');
  const hasValidZip = cleanZip(checkoutForm.zip || '').length === 8;
  const selectedShippingOption = isFreeDelivery
    ? null
    : shippingOptions.find(option => option.id === checkoutForm.shippingServiceId) || shippingOptions[0] || null;
  const shippingCost = isFreeDelivery ? 0 : Number(selectedShippingOption?.price || 0);
  const couponDiscount = getCouponDiscount(cartTotal, appliedCoupon);
  const orderTotal = Number((cartTotal - couponDiscount + shippingCost).toFixed(2));
  const requiredFields = checkoutForm.deliveryMethod === 'home'
    ? ['name', 'email', 'zip', 'address', 'number', 'neighborhood', 'city', 'state']
    : ['name', 'email'];
  const isFieldMissing = (field) => {
    if (field === 'zip') return cleanZip(checkoutForm.zip || '').length !== 8;
    return !String(checkoutForm[field] || '').trim();
  };
  const missingFields = requiredFields.filter(isFieldMissing);

  const inputStyle = (extra = {}) => ({
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    color: '#111',
    background: '#fff',
    ...extra
  });

  const labelStyle = {
    color: '#555',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
  };

  const fieldWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '0.78rem',
    lineHeight: 1.35,
  };

  const sectionTitleStyle = {
    fontSize: '0.78rem',
    margin: '2px 0 0',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const fieldError = (field) => {
    if (!submitted || !isFieldMissing(field)) return null;

    return (
      <span style={errorStyle}>
        {field === 'zip' ? 'Informe um CEP válido.' : 'Campo obrigatório.'}
      </span>
    );
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage('Digite um cupom.');
      return;
    }

    setCouponLoading(true);
    setCouponMessage('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cartTotal }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Cupom invalido.');

      setAppliedCoupon(data.coupon);
      setCouponCode(data.coupon.code);
      setCouponMessage(`Cupom aplicado: ${data.coupon.discountPercent}% de desconto.`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error.message || 'Nao foi possivel aplicar o cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage('');
  };

  const loadShippingOptions = async ({ zip, city, form = checkoutForm }) => {
    const normalizedZip = cleanZip(zip || '');

    if (!normalizedZip || normalizedZip.length !== 8 || isFreeShippingRegion(city || '')) {
      setShippingOptions([]);
      setShippingError('');
      return;
    }

    setShippingLoading(true);
    setShippingError('');
    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryMethod: form.deliveryMethod,
          city,
          zip: normalizedZip,
          subtotal: cartTotal
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Não foi possível calcular o frete.');
      const options = Array.isArray(data.options) ? data.options : [];
      setShippingOptions(options);

      if (options.length > 0 && !form.shippingServiceId) {
        onFormChange({ ...form, shippingServiceId: options[0].id });
      }
    } catch (error) {
      setShippingOptions([]);
      setShippingError(error.message || 'Não conseguimos carregar as opções de frete agora.');
    } finally {
      setShippingLoading(false);
    }
  };

  const lookupZip = async (rawZip, baseForm = checkoutForm) => {
    const lookupValue = getLookupZip(rawZip);

    if (!lookupValue) {
      setShippingOptions([]);
      setShippingError('');
      setCepMessage('');
      return;
    }

    setCepLoading(true);
    setCepMessage('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${lookupValue}/json/`);
      const data = await response.json();

      if (!response.ok || data.erro) {
        throw new Error('CEP não encontrado.');
      }

      const nextForm = {
        ...baseForm,
        zip: formatZip(lookupValue),
        address: data.logradouro || baseForm.address || '',
        neighborhood: data.bairro || baseForm.neighborhood || '',
        city: data.localidade || baseForm.city || '',
        state: data.uf || baseForm.state || '',
        shippingServiceId: '',
      };

      onFormChange(nextForm);
      loadShippingOptions({ zip: lookupValue, city: nextForm.city, form: nextForm });

      if (!data.logradouro || !data.bairro) {
        setCepMessage('CEP encontrado. Complete rua e bairro manualmente.');
      }
    } catch (error) {
      setShippingOptions([]);
      setShippingError('');
      setCepMessage(error.message || 'Não encontramos esse CEP. Confira os números.');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '520px', backgroundColor: '#fff',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
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
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#111', lineHeight: '1.25', wordBreak: 'break-word' }}>{item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}</div>
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
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#111', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>
                  ← Adicionar mais produtos
                </button>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #eee', padding: '16px 20px 20px', backgroundColor: '#fcfcfc', boxShadow: '0 -5px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#555', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <span>R$ {formatMoney(cartTotal)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Cupom de desconto"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  if (appliedCoupon) setAppliedCoupon(null);
                  if (couponMessage) setCouponMessage('');
                }}
                style={inputStyle({ width: '100%', textTransform: 'uppercase' })}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading}
                style={{ border: 'none', borderRadius: '4px', background: couponLoading ? '#777' : '#111', color: '#fff', fontWeight: 700, cursor: couponLoading ? 'not-allowed' : 'pointer' }}
              >
                {couponLoading ? '...' : 'Aplicar'}
              </button>
            </div>
            {couponMessage && (
              <div style={{ fontSize: '0.78rem', color: appliedCoupon ? '#16a34a' : '#dc2626', marginBottom: '8px', lineHeight: 1.35 }}>
                {couponMessage}
                {appliedCoupon && (
                  <button type="button" onClick={removeCoupon} style={{ marginLeft: '8px', border: 'none', background: 'transparent', color: '#555', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem' }}>
                    remover
                  </button>
                )}
              </div>
            )}
            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#16a34a', marginBottom: '8px' }}>
                <span>Desconto ({appliedCoupon.code}):</span>
                <span>- R$ {formatMoney(couponDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#555', marginBottom: '8px' }}>
              <span>Frete:</span>
              <span>
                {shippingLoading
                  ? 'Calculando...'
                  : `R$ ${formatMoney(shippingCost)}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '600', marginBottom: '14px', color: '#111', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span>Total:</span>
              <span>R$ {formatMoney(orderTotal)}</span>
            </div>

            <h3 style={{ fontSize: '0.8rem', marginBottom: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Forma de Entrega</h3>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#111' }}>
                <input type="radio" name="deliveryMethod" value="home" checked={checkoutForm.deliveryMethod === 'home'} onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'home'})} style={{ accentColor: '#111' }} />
                Receber em Casa
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#111' }}>
                <input type="radio" name="deliveryMethod" value="pickup" checked={checkoutForm.deliveryMethod === 'pickup'} onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'pickup'})} style={{ accentColor: '#111' }} />
                Retirar na Loja
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <h3 style={sectionTitleStyle}>Dados de contato</h3>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Nome completo</label>
                <input type="text" placeholder="Digite seu nome completo" value={checkoutForm.name} onChange={e => onFormChange({...checkoutForm, name: e.target.value})} style={inputStyle({ width: '100%' })} />
                {fieldError('name')}
              </div>

              <div style={fieldWrapStyle}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" placeholder="email@exemplo.com" value={checkoutForm.email || ''} onChange={e => onFormChange({...checkoutForm, email: e.target.value})} style={inputStyle({ width: '100%' })} />
                {fieldError('email')}
              </div>

              {checkoutForm.deliveryMethod === 'home' && (
                <>
                  <h3 style={{ ...sectionTitleStyle, marginTop: '6px' }}>Endereço de entrega</h3>

                  <div style={fieldWrapStyle}>
                    <label style={labelStyle}>CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={formatZip(checkoutForm.zip)}
                      maxLength={9}
                      onChange={async (e) => {
                        const zip = formatZip(e.target.value);
                        const nextForm = { ...checkoutForm, zip, shippingServiceId: '' };
                        onFormChange(nextForm);
                        lookupZip(zip, nextForm);
                      }}
                      style={inputStyle({ width: '100%' })}
                    />
                    {cepLoading && <span style={{ color: '#666', fontSize: '0.78rem' }}>Buscando endereço...</span>}
                    {cepMessage && <span style={{ color: cepMessage.includes('encontrado') ? '#666' : '#dc2626', fontSize: '0.78rem', lineHeight: 1.35 }}>{cepMessage}</span>}
                    {fieldError('zip')}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 112px', gap: '10px' }}>
                    <div style={fieldWrapStyle}>
                      <label style={labelStyle}>Rua ou avenida</label>
                      <input type="text" placeholder="Rua, avenida ou estrada" value={checkoutForm.address} onChange={e => onFormChange({...checkoutForm, address: e.target.value})} style={inputStyle({ width: '100%' })} />
                      {fieldError('address')}
                    </div>

                    <div style={fieldWrapStyle}>
                      <label style={labelStyle}>Número</label>
                      <input type="text" placeholder="Nº" value={checkoutForm.number} onChange={e => onFormChange({...checkoutForm, number: e.target.value})} style={inputStyle({ width: '100%' })} />
                      {fieldError('number')}
                    </div>
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={labelStyle}>Complemento</label>
                    <input type="text" placeholder="Apto, bloco, casa..." value={checkoutForm.complement} onChange={e => onFormChange({...checkoutForm, complement: e.target.value})} style={inputStyle({ width: '100%' })} />
                  </div>

                  <div style={fieldWrapStyle}>
                    <label style={labelStyle}>Bairro</label>
                    <input type="text" placeholder="Seu bairro" value={checkoutForm.neighborhood || ''} onChange={e => onFormChange({...checkoutForm, neighborhood: e.target.value})} style={inputStyle({ width: '100%' })} />
                    {fieldError('neighborhood')}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 86px', gap: '10px' }}>
                    <div style={fieldWrapStyle}>
                      <label style={labelStyle}>Cidade</label>
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={checkoutForm.city}
                        onChange={e => {
                          const nextCity = e.target.value;
                          const nextForm = { ...checkoutForm, city: nextCity, shippingServiceId: '' };
                          onFormChange(nextForm);
                          loadShippingOptions({ zip: checkoutForm.zip, city: nextCity, form: nextForm });
                        }}
                        style={inputStyle({ width: '100%' })}
                      />
                      {fieldError('city')}
                    </div>

                    <div style={fieldWrapStyle}>
                      <label style={labelStyle}>UF</label>
                      <input type="text" placeholder="UF" value={checkoutForm.state || ''} maxLength={2} onChange={e => onFormChange({...checkoutForm, state: e.target.value.toUpperCase()})} style={inputStyle({ width: '100%', textTransform: 'uppercase' })} />
                      {fieldError('state')}
                    </div>
                  </div>

                  {isFreeDelivery && (
                    <div style={{ fontSize: '0.85rem', color: '#16a34a', lineHeight: '1.4' }}>
                      Frete grátis para Vitória da Conquista.
                    </div>
                  )}
                  {!isFreeDelivery && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', padding: '10px', color: '#111' }}>
                      <div style={{ fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                        Opções de frete
                      </div>
                      {shippingLoading && <div style={{ fontSize: '0.9rem', color: '#666' }}>Calculando frete...</div>}
                      {!hasValidZip && !shippingLoading && (
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Informe o CEP para ver as opções de envio.</div>
                      )}
                      {hasValidZip && shippingError && (
                        <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>{shippingError}</div>
                      )}
                      {hasValidZip && !shippingLoading && !shippingError && shippingOptions.length === 0 && (
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Nenhuma opção de frete encontrada para esse CEP.</div>
                      )}
                      {shippingOptions.map(option => (
                        <label
                          key={option.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '18px 1fr auto',
                            gap: '10px',
                            alignItems: 'center',
                            padding: '10px',
                            marginTop: '8px',
                            border: `1px solid ${(checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id) ? '#111827' : '#e5e7eb'}`,
                            borderRadius: '6px',
                            background: (checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id) ? '#f8fafc' : '#fff',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name="shippingOption"
                            checked={checkoutForm.shippingServiceId ? checkoutForm.shippingServiceId === option.id : selectedShippingOption?.id === option.id}
                            onChange={() => onFormChange({...checkoutForm, shippingServiceId: option.id})}
                            style={{ accentColor: '#111' }}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            {option.deliveryTime ? (
                              <>
                                <br />
                                <span style={{ color: '#666' }}>Prazo: {option.deliveryTime} dias úteis</span>
                              </>
                            ) : null}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            R$ {Number(option.price || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (missingFields.length > 0) {
                  setSubmitted(true);
                  return;
                }
                setSubmitted(false);
                onCheckout(appliedCoupon?.code || '');
              }}
              disabled={checkoutLoading}
              style={{ width: '100%', background: checkoutLoading ? '#777' : '#009ee3', color: '#fff', padding: '15px', border: 'none', borderRadius: '6px', cursor: checkoutLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0, 158, 227, 0.3)' }}
            >
              {checkoutLoading ? 'Abrindo pagamento...' : 'Finalizar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
