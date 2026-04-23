'use client';
import Image from 'next/image';

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
  onCheckout 
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
      <div style={{ 
        position: 'absolute', top: 0, right: 0, bottom: 0, 
        width: '100%', maxWidth: '420px', backgroundColor: '#fff', 
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' 
      }}>
        
        {/* Cart Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#111', fontFamily: 'var(--font-cinzel)' }}>Seu Carrinho ({cartItemCount})</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#111', lineHeight: '1' }}>×</button>
        </div>

        {/* Cart Items Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '60px', fontSize: '1rem' }}>Sua sacola está vazia.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #f4f4f4', paddingBottom: '15px' }}>
                  <div style={{ width: '70px', height: '70px', position: 'relative', backgroundColor: '#fcfcfc', border: '1px solid #eaeaea', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <Image src={item.image || '/photos/perfume.jpg'} alt={item.name} width={60} height={60} style={{ objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111', lineHeight: '1.2' }}>{item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}</div>
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
                <button 
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: '#111', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>
                  ← Adicionar mais produtos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Area */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid #eee', padding: '20px', backgroundColor: '#fcfcfc', boxShadow: '0 -5px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#555', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#555', marginBottom: '12px' }}>
              <span>Entrega:</span>
              <span style={{ color: checkoutForm.deliveryMethod === 'pickup' ? '#16a34a' : '#eab308', fontWeight: '600' }}>
                {checkoutForm.deliveryMethod === 'pickup' ? 'Grátis ✓' : 'A combinar'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', color: '#111', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}{checkoutForm.deliveryMethod === 'home' ? ' + frete' : ''}</span>
            </div>
            
            <h3 style={{ fontSize: '0.8rem', marginBottom: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>🏢 Forma de Entrega</h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#111' }}>
                <input 
                  type="radio" 
                  name="deliveryMethod" 
                  value="home" 
                  checked={checkoutForm.deliveryMethod === 'home'} 
                  onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'home'})} 
                  style={{ accentColor: '#111' }}
                />
                Receber em Casa
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#111' }}>
                <input 
                  type="radio" 
                  name="deliveryMethod" 
                  value="pickup" 
                  checked={checkoutForm.deliveryMethod === 'pickup'} 
                  onChange={() => onFormChange({...checkoutForm, deliveryMethod: 'pickup'})} 
                  style={{ accentColor: '#111' }}
                />
                Retirar na Loja
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Nome Completo *" 
                value={checkoutForm.name} 
                onChange={e => onFormChange({...checkoutForm, name: e.target.value})} 
                style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} 
              />
              
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
                              onFormChange({
                                ...checkoutForm, 
                                zip: cep,
                                address: data.logradouro,
                                city: `${data.bairro} / ${data.localidade}`
                              });
                            }
                          } catch (err) {
                            console.error("Erro ao buscar CEP", err);
                          }
                        }
                      }} 
                      style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '1rem', color: '#111' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Nº *" 
                      value={checkoutForm.number} 
                      onChange={e => onFormChange({...checkoutForm, number: e.target.value})} 
                      style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '1rem', color: '#111' }} 
                    />
                  </div>

                  <input 
                    type="text" 
                    placeholder="Rua / Av *" 
                    value={checkoutForm.address} 
                    onChange={e => onFormChange({...checkoutForm, address: e.target.value})} 
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} 
                  />
                  
                  <input 
                    type="text" 
                    placeholder="Complemento (Apto, Bloco...)" 
                    value={checkoutForm.complement} 
                    onChange={e => onFormChange({...checkoutForm, complement: e.target.value})} 
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} 
                  />
                  
                  <input 
                    type="text" 
                    placeholder="Bairro / Cidade *" 
                    value={checkoutForm.city} 
                    onChange={e => onFormChange({...checkoutForm, city: e.target.value})} 
                    style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '1rem', color: '#111' }} 
                  />
                </>
              )}
            </div>

            <button 
              onClick={() => {
                if (!checkoutForm.name) return alert("Por favor, preencha seu nome.");
                if (checkoutForm.deliveryMethod === 'home') {
                  if (!checkoutForm.address || !checkoutForm.number || !checkoutForm.city) {
                    return alert("Por favor, preencha todos os campos obrigatórios do endereço.");
                  }
                }
                onCheckout();
              }}
              style={{ width: '100%', background: '#25D366', color: '#fff', padding: '15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)' }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                 <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
              </svg>
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
