'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos'); 
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedGender, setSelectedGender] = useState('Todos');
  const [maxPrice, setMaxPrice] = useState(Infinity);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
     name: '', address: '', number: '', complement: '', city: '', zip: '', deliveryMethod: 'home'
  });

  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error(err));
      
    const savedCart = localStorage.getItem('oud_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('oud_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const increaseQty = (id) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decreaseQty = (id) => setCart(prev => prev.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (checkoutForm.deliveryMethod === 'home') {
      if (!checkoutForm.name || !checkoutForm.address || !checkoutForm.number || !checkoutForm.city) {
         alert("Por favor, preencha os dados obrigatórios do endereço (Nome, Rua, Número e Cidade).");
         return;
      }
    } else {
      if (!checkoutForm.name) {
         alert("Por favor, preencha o seu nome.");
         return;
      }
    }
    
    let text = `*NOVO PEDIDO - A R Ô M E*\n\n`;
    cart.forEach(item => {
      text += `🛒 ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });
    
    text += `\n*TOTAL DA COMPRA:* R$ ${cartTotal.toFixed(2).replace('.', ',')}\n\n`;
    
    if (checkoutForm.deliveryMethod === 'home') {
      text += `*📦 DADOS DE ENTREGA:*\n`;
      text += `Nome: ${checkoutForm.name}\n`;
      text += `Rua: ${checkoutForm.address}, ${checkoutForm.number}\n`;
      if (checkoutForm.complement) text += `Complemento: ${checkoutForm.complement}\n`;
      text += `Bairro/Cidade: ${checkoutForm.city}\n`;
      if (checkoutForm.zip) text += `CEP: ${checkoutForm.zip}\n`;
    } else {
      text += `*🛍️ RETIRADA NA LOJA*\n`;
      text += `Nome: ${checkoutForm.name}\n`;
    }
    
    const wppNumber = '5577998414406'; 
    const encode = encodeURIComponent(text);
    window.open(`https://wa.me/${wppNumber}?text=${encode}`, '_blank');
  };

  const filteredProducts = products.filter(product => {
    if (searchQuery && product.name && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== 'Todos' && product.category !== selectedCategory) return false;
    if (selectedBrand !== 'Todas' && product.brand !== selectedBrand) return false;
    if (selectedGender !== 'Todos' && product.gender !== selectedGender) return false;
    if (product.price > maxPrice) return false;
    return true;
  });

  return (
    <main style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', paddingBottom: '30px', position: 'relative' }}>
      
      <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setIsMenuOpen(true)}>
            <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.5" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </div>
          
          <div className="logo-text" style={{ textAlign: 'center', fontWeight: 'bold' }}>
             <div style={{ fontSize: '1.4rem', letterSpacing: '4px', color: 'var(--color-gold)', lineHeight: '1' }}>A R Ô M E</div>
             <div style={{ fontSize: '8px', color: '#999', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '4px' }}>DE CAPELIN</div>
          </div>

          <div onClick={() => setIsCartOpen(true)} style={{ position: 'relative', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.2" fill="none">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span style={{
              position: 'absolute', top: '-5px', right: '-10px', 
              background: '#c5a67c', color: '#fff', fontSize: '10px', fontWeight: 'bold',
              width: '18px', height: '18px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {cartItemCount}
            </span>
          </div>
        </div>
      </header>

      {/* HERO BANNER - BOUTIQUE STYLE */}
      <div className="hero-banner">
        <h2>A Essência do Oriente</h2>
        <p>A maior coleção de perfumes árabes exclusivos do Brasil. Deixe um rastro inesquecível de sofisticação por onde você passar.</p>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="search-section" style={{ padding: '10px 0', background: '#fff', borderBottom: '1px solid #eaeaea' }}>
        <div className="container">
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', padding: '12px 20px', borderRadius: '8px', marginBottom: '15px' }}>
             <svg style={{marginRight: '12px', color: '#999'}} viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Encontrar meu perfume..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: '#333' }}
            />
          </div>

          {/* FILTER CHIPS */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 15px 5px 15px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
            <button 
              onClick={() => { setSelectedBrand('Todas'); setSelectedGender('Todos'); setSelectedCategory('Todos'); setMaxPrice(Infinity); }}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid #ddd', background: (selectedBrand === 'Todas' && selectedGender === 'Todos' && selectedCategory === 'Todos' && maxPrice === Infinity) ? '#111' : '#fff', color: (selectedBrand === 'Todas' && selectedGender === 'Todos' && selectedCategory === 'Todos' && maxPrice === Infinity) ? '#fff' : '#111', cursor: 'pointer' }}>
              Todos
            </button>
            <button 
              onClick={() => setSelectedGender(selectedGender === 'Feminino' ? 'Todos' : 'Feminino')}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid #ddd', background: selectedGender === 'Feminino' ? '#111' : '#fff', color: selectedGender === 'Feminino' ? '#fff' : '#111', cursor: 'pointer' }}>
              Feminino
            </button>
            <button 
              onClick={() => setSelectedGender(selectedGender === 'Masculino' ? 'Todos' : 'Masculino')}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid #ddd', background: selectedGender === 'Masculino' ? '#111' : '#fff', color: selectedGender === 'Masculino' ? '#fff' : '#111', cursor: 'pointer' }}>
              Masculino
            </button>
            {/* Marcas dinâmicas - lê automaticamente do banco */}
            {[...new Set(products.map(p => p.brand).filter(b => b && b !== 'Outra'))].map(brand => (
              <button 
                key={brand}
                onClick={() => setSelectedBrand(selectedBrand === brand ? 'Todas' : brand)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid #ddd', background: selectedBrand === brand ? '#111' : '#fff', color: selectedBrand === brand ? '#fff' : '#111', cursor: 'pointer' }}>
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.2rem', color: '#111' }}>
          {selectedCategory === 'Decante' ? 'Nossos Decantes' : maxPrice < 100 ? 'Perfumes até R$ 99' : 'Destaques'}
        </h3>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#888' }}>
            Nenhum perfume encontrado.
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                {product.isOnSale && (
                   <div className="card-badge">
                     12% OFF
                   </div>
                )}
                
                <div className="card-image-wrap">
                   <img 
                    src={product.image || '/photos/perfume.jpg'} 
                    alt={product.name} 
                  />
                </div>
 
                <div className="card-content">
                  <div className="card-title">
                    {product.name}
                  </div>
                  
                  <div className="card-price-container">
                    {product.compareAtPrice > 0 && (
                      <span className="card-old-price">
                        R$ {product.compareAtPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}

                    <span className="card-new-price">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    
                    <div className="card-pix-row">
                      R$ {(product.price * 0.9).toFixed(2).replace('.', ',')} <span>com Pix</span>
                    </div>
                  </div>

                  <div className="card-installments-box">
                    6 x de R$ {(product.price / 6).toFixed(2).replace('.', ',')} sem juros
                  </div>

                  <button 
                    className="btn-comprar"
                    onClick={() => addToCart(product)}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: '60px', background: '#111', color: '#fff', padding: '40px 20px 30px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
            {/* Coluna 1: Marca */}
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ fontFamily: 'Cinzel', fontSize: '1.3rem', letterSpacing: '3px', marginBottom: '10px', color: 'var(--color-gold)' }}>A R Ô M E</h3>
              <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.6' }}>A maior coleção de perfumes árabes exclusivos do Brasil. Sofisticação e qualidade.</p>
            </div>
            
            {/* Coluna 2: Endereço */}
            <div style={{ minWidth: '200px' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#ccc' }}>📍 Onde Estamos</h4>
              <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.8' }}>
                Vitória da Conquista - BA<br />
                Horário: Seg-Sáb 9h às 18h
              </p>
            </div>

            {/* Coluna 3: Contato */}
            <div style={{ minWidth: '200px' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#ccc' }}>📲 Contato</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a 
                  href="https://wa.me/5577998414406" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                  </svg>
                  (77) 99841-4406
                </a>
                <a 
                  href="https://www.instagram.com/blackparfumvdc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E1306C', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
                >
                  📷 @blackparfumvdc
                </a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>© 2026 A R Ô M E — Vitória da Conquista, BA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/5577998414406" 
        target="_blank" 
        rel="noopener noreferrer"
        className="floating-whatsapp"
        style={{ textDecoration: 'none' }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
           <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
        </svg>
      </a>

      {/* CARRINHO DE COMPRAS SIDEBAR (MODAL) */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
          <div style={{ 
            position: 'absolute', top: 0, right: 0, bottom: 0, 
            width: '100%', maxWidth: '420px', backgroundColor: '#fff', 
            display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' 
          }}>
            
            {/* Cart Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#111', fontFamily: 'Cinzel' }}>Seu Carrinho ({cartItemCount})</h2>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#111', lineHeight: '1' }}>×</button>
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
                        <img src={item.image || '/photos/perfume.jpg'} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '5px' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111', lineHeight: '1.2' }}>{item.name}</div>
                        <div style={{ color: '#111', fontWeight: '600', margin: '5px 0', fontSize: '1rem' }}>R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                            <button onClick={() => decreaseQty(item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#111' }}>-</button>
                            <div style={{ padding: '4px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', background: '#fafafa' }}>{item.quantity}</div>
                            <button onClick={() => increaseQty(item.id)} style={{ padding: '4px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '1.1rem', color: '#111' }}>+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} style={{ fontSize: '0.8rem', color: '#999', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Remover</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botão Adicionar Mais Produtos */}
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button 
                      onClick={() => setIsCartOpen(false)}
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
                      onChange={() => setCheckoutForm({...checkoutForm, deliveryMethod: 'home'})} 
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
                      onChange={() => setCheckoutForm({...checkoutForm, deliveryMethod: 'pickup'})} 
                      style={{ accentColor: '#111' }}
                    />
                    Retirar na Loja
                  </label>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <input type="text" placeholder="Nome Completo *" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '0.9rem' }} />
                  
                  {checkoutForm.deliveryMethod === 'home' && (
                    <>
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <input type="text" placeholder="Rua / Av *" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 2, fontSize: '0.9rem' }} />
                         <input type="text" placeholder="Nº *" value={checkoutForm.number} onChange={e => setCheckoutForm({...checkoutForm, number: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '0.9rem' }} />
                      </div>
                      
                      <input type="text" placeholder="Complemento (Apto)" value={checkoutForm.complement} onChange={e => setCheckoutForm({...checkoutForm, complement: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', fontSize: '0.9rem' }} />
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <input type="text" placeholder="Bairro / Cidade *" value={checkoutForm.city} onChange={e => setCheckoutForm({...checkoutForm, city: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '0.9rem' }} />
                         <input type="text" placeholder="CEP" value={checkoutForm.zip} onChange={e => setCheckoutForm({...checkoutForm, zip: e.target.value})} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, fontSize: '0.9rem' }} />
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={handleCheckout}
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
      )}

      {/* MENU LATERAL (HAMBURGER) */}
      {isMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, bottom: 0, 
            width: '80%', maxWidth: '300px', backgroundColor: '#fff', 
            display: 'flex', flexDirection: 'column',
            boxShadow: '10px 0 30px rgba(0,0,0,0.5)' 
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#111', fontFamily: 'Cinzel' }}>A R Ô M E</h2>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#111', lineHeight: '1' }}>×</button>
            </div>
            
            <nav style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <button onClick={() => { setSelectedCategory('Todos'); setMaxPrice(Infinity); setIsMenuOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>Início</button>
              <button onClick={() => { setSelectedCategory('Perfume'); setMaxPrice(Infinity); setIsMenuOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>Produtos (Inteiros)</button>
              <button onClick={() => { setSelectedCategory('Decante'); setMaxPrice(Infinity); setIsMenuOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>Decantes</button>
              <button onClick={() => { setMaxPrice(99); setSelectedCategory('Todos'); setIsMenuOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>Até R$ 99</button>
            </nav>
          </div>
        </div>
      )}

    </main>
  );
}
