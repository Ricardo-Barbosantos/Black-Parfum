'use client';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import NavigationMenu from '@/components/NavigationMenu';
import ProductSkeleton from '@/components/ProductSkeleton';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [checkoutForm, setCheckoutForm] = useState({
     name: '', address: '', number: '', complement: '', city: '', zip: '', deliveryMethod: 'home'
  });

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setProducts(data);
          setIsLoading(false);
      })
      .catch(err => {
          console.error(err);
          setIsLoading(false);
      });
      
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
    showToast(`${product.name} adicionado ao carrinho`);
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
    
    let text = `*NOVO PEDIDO - OBSIDIAN PARFUMS*\n\n`;
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
    
    const wppNumber = '5577998334081'; 
    const encode = encodeURIComponent(text);
    window.open(`https://wa.me/${wppNumber}?text=${encode}`, '_blank');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (searchQuery && product.name && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== 'Todos' && product.category !== selectedCategory) return false;
      if (selectedBrand !== 'Todas' && product.brand !== selectedBrand) return false;
      if (selectedGender !== 'Todos' && product.gender !== selectedGender) return false;
      if (product.price > maxPrice) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedGender, maxPrice]);

  const brands = useMemo(() => {
    return [...new Set(products.map(p => p.brand).filter(b => b && b !== 'Outra'))];
  }, [products]);

  return (
    <main style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', position: 'relative' }}>
      
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        onMenuClick={() => setIsMenuOpen(true)} 
      />

      <Hero />

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
          <div className="filter-chips-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 15px 5px 15px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
            {brands.map(brand => (
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
        
        {isLoading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#888' }}>
            Nenhum perfume encontrado.
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart} 
              />
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* TOAST SYSTEM */}
      {toast.visible && (
        <div className="toast-container">
          <div className="toast-gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {toast.message}
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/5577998334081" 
        target="_blank" 
        rel="noopener noreferrer"
        className="floating-whatsapp"
        style={{ textDecoration: 'none' }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
           <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
        </svg>
      </a>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        cartItemCount={cartItemCount}
        onRemove={removeFromCart}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
        checkoutForm={checkoutForm}
        onFormChange={setCheckoutForm}
        onCheckout={handleCheckout}
      />

      <NavigationMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFilter={(cat, price) => {
          setSelectedCategory(cat);
          setMaxPrice(price);
        }}
      />

    </main>
  );
}
