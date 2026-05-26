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

  if (!isOpen) return null;

  const isFreeDelivery = checkoutForm.deliveryMethod === 'pickup' || isFreeShippingRegion(checkoutForm.city || '');

  const loadShippingOptions = async ({ zip, city }) => {
    if (!zip || zip.length !== 8 || isFreeShippingRegion(city || '')) {
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
          deliveryMethod: checkoutForm.deliveryMethod,
          city,
          zip,
          subtotal: cartTotal
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Não foi possível calcular o frete.');
      setShippingOptions(Array.isArray(data.options) ? data.options : []);
    } catch (error) {
      setShippingOptions([]);
      setShippingError(error.message || 'Não foi possível calcular o frete.');
    } finally {
      setShippingLoading(false);
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
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '600', marginBottom: '14px', color: '#111', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '16px' }}>
              <input type="text" placeholder="Nome Completo *" value={checkoutForm.name} onChange={e => onFormChange({...checkoutForm, name: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} />
              <input type="email" placeholder="E-mail para pagamento *" value={checkoutForm.email || ''} onChange={e => onFormChange({...checkoutForm, email: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} />

              {checkoutForm.deliveryMethod === 'home' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="CEP *"
                      value={checkoutForm.zip}
                      maxLength={8}
                      onChange={async (e) => {
                        const cep = e.target.value.replace(/\D/g, '');
                        onFormChange({...checkoutForm, zip: cep});
                        if (cep.length === 8) {
                          try {
                            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                            const data = await res.json();
                            if (!data.erro) {
                              const nextForm = {
                                ...checkoutForm,
                                zip: cep,
                                address: data.logradouro,
                                city: `${data.bairro} / ${data.localidade}`
                              };
                              onFormChange(nextForm);
                              loadShippingOptions({ zip: cep, city: nextForm.city });
                            }
                          } catch (err) {
                            console.error('Erro ao buscar CEP', err);
                          }
                        } else {
                          setShippingOptions([]);
                          setShippingError('');
                        }
                      }}
                      style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '1rem', color: '#111' }}
                    />
                    <input type="text" placeholder="Nº *" value={checkoutForm.number} onChange={e => onFormChange({...checkoutForm, number: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '1rem', color: '#111' }} />
                  </div>

                  <input type="text" placeholder="Rua / Av *" value={checkoutForm.address} onChange={e => onFormChange({...checkoutForm, address: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} />
                  <input type="text" placeholder="Complemento (Apto, Bloco...)" value={checkoutForm.complement} onChange={e => onFormChange({...checkoutForm, complement: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} />
                  <input
                    type="text"
                    placeholder="Bairro / Cidade *"
                    value={checkoutForm.city}
                    onChange={e => {
                      const nextCity = e.target.value;
                      onFormChange({...checkoutForm, city: nextCity});
                      loadShippingOptions({ zip: checkoutForm.zip, city: nextCity });
                    }}
                    style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }}
                  />
                  {isFreeDelivery && (
                    <div style={{ fontSize: '0.85rem', color: '#16a34a', lineHeight: '1.4' }}>
                      Frete grátis para Vitória da Conquista.
                    </div>
                  )}
                  {!isFreeDelivery && checkoutForm.zip?.length === 8 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', padding: '10px', color: '#111' }}>
                      <div style={{ fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                        Opções de frete
                      </div>
                      {shippingLoading && <div style={{ fontSize: '0.9rem', color: '#666' }}>Calculando frete...</div>}
                      {shippingError && <div style={{ fontSize: '0.9rem', color: '#dc2626' }}>{shippingError}</div>}
                      {!shippingLoading && !shippingError && shippingOptions.length === 0 && (
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Informe um CEP válido para calcular o frete.</div>
                      )}
                      {shippingOptions.map(option => (
                        <label key={option.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 0', borderTop: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                          <input
                            type="radio"
                            name="shippingOption"
                            checked={checkoutForm.shippingServiceId === option.id}
                            onChange={() => onFormChange({...checkoutForm, shippingServiceId: option.id})}
                            style={{ marginTop: '3px' }}
                          />
                          <span>
                            <strong>{option.label}</strong><br />
                            R$ {Number(option.price || 0).toFixed(2).replace('.', ',')}
                            {option.deliveryTime ? ` - ${option.deliveryTime} dias úteis` : ''}
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
                if (!checkoutForm.name) return alert('Por favor, preencha seu nome.');
                if (!checkoutForm.email) return alert('Por favor, preencha seu e-mail.');
                if (checkoutForm.deliveryMethod === 'home' && (!checkoutForm.address || !checkoutForm.number || !checkoutForm.city)) {
                  return alert('Por favor, preencha todos os campos obrigatórios do endereço.');
                }
                onCheckout();
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
