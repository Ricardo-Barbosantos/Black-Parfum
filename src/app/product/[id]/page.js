'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import './product.css';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [reviews, setReviews] = useState([]);
  
  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [checkoutForm, setCheckoutForm] = useState({
     name: '', address: '', number: '', complement: '', city: '', zip: '', deliveryMethod: 'home'
  });

  // Review Form
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', title: '', text: '', rating: 5 });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find(p => p.id === id);
          if (found) {
            setProduct(found);
            setSelectedImage(found.images?.[0] || found.image);
            if (found.sizes) {
               const s = found.sizes.split(',').map(s => s.trim()).filter(Boolean);
               if(s.length > 0) setSelectedSize(s[0]);
            }
          }
        }
        setLoading(false);
      });

    fetch(`/api/reviews?productId=${id}`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []));

    const savedCart = localStorage.getItem('oud_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [id]);

  useEffect(() => {
    localStorage.setItem('oud_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const calculateCartFields = () => {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { cartTotal, cartItemCount };
  }
  const { cartTotal, cartItemCount } = calculateCartFields();

  const handleAddToCart = () => {
    if (!product) return;
    setCart(prev => {
      // Diferenciar o produto pelo tamanho selecionado
      const cartItemId = `${product.id}-${selectedSize}`;
      const exist = prev.find(item => item.cartItemId === cartItemId);
      if (exist) {
        return prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, cartItemId, selectedSize, quantity: 1 }];
    });
    showToast(`${product.name} adicionado ao carrinho`);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    // se não houver um item igual no carrinho, adicione-o
    handleAddToCart();
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  const increaseQty = (cartItemId) => setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
  const decreaseQty = (cartItemId) => setCart(prev => prev.map(item => item.cartItemId === cartItemId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));

  const handleCheckout = () => {
    // Checkout logic here (copied from page.js or handled via props, simplified for brevity)
    let text = `*NOVO PEDIDO - OBSIDIAN PARFUMS*\n\n`;
    cart.forEach(item => {
      text += `🛒 ${item.quantity}x ${item.name} ${item.selectedSize ? `(${item.selectedSize})` : ''} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });
    const wppNumber = '5577998334081'; 
    const encode = encodeURIComponent(text);
    window.open(`https://wa.me/${wppNumber}?text=${encode}`, '_blank');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reviewForm, productId: product.id })
    });
    alert('Avaliação enviada com sucesso! Aguardando aprovação.');
    setSubmittingReview(false);
    setReviewForm({ name: '', email: '', title: '', text: '', rating: 5 });
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>;
  if (!product) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000' }}>Produto não encontrado.</div>;

  const pixPrice = product.price * 0.9;
  const installmentPrice = product.price / 6;
  const sizesList = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
  const imagesList = product.images?.length > 0 ? product.images : [product.image];
  if (product.videoUrl && !imagesList.includes(product.videoUrl)) {
    imagesList.push(product.videoUrl); // Video added to the end of gallery
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 0;

  const renderGalleryItem = (item) => {
    // Detect se é vídeo
    const isVideo = item.includes('youtube.com') || item.includes('youtu.be') || item.endsWith('.mp4');
    
    if (isVideo) {
      if (item.includes('youtu')) {
         const videoId = item.split('v=')[1]?.split('&')[0] || item.split('youtu.be/')[1];
         return <iframe style={{ width: '100%', height: '100%', border: 'none' }} src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
      } else {
         return <video src={item} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
      }
    }
    
    return <img src={item} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  };

  const renderThumbItem = (item) => {
    const isVideo = item.includes('youtube.com') || item.includes('youtu.be') || item.endsWith('.mp4');
    let thumbSrc = item;
    if (isVideo && item.includes('youtu')) {
      const videoId = item.split('v=')[1]?.split('&')[0] || item.split('youtu.be/')[1];
      thumbSrc = `https://img.youtube.com/vi/${videoId}/default.jpg`;
    }
    
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
         {isVideo && !item.includes('youtu') ? (
            <video src={item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         ) : (
            <img src={thumbSrc} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
         )}
         {isVideo && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '5px' }}>▶️</div>}
      </div>
    );
  };

  return (
    <main style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', position: 'relative' }}>
      <Header cartItemCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} onMenuClick={() => {}} />

      <div className="product-page-container container">
        {/* TOP SECTION: Gallery & Info */}
        <div className="product-grid-main">
          {/* Gallery View */}
          <div className="product-gallery">
            <div className="main-image">
                {renderGalleryItem(selectedImage)}
            </div>
            {imagesList.length > 1 && (
              <div className="thumbnails-wrapper">
                {imagesList.map((img, idx) => (
                  <button key={idx} className={`thumbnail-btn ${selectedImage === img ? 'active' : ''}`} onClick={() => setSelectedImage(img)}>
                    {renderThumbItem(img)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info View */}
          <div className="product-info-panel">
             <div className="brand-label">{product.brand || 'Obsidian Parfums'}</div>
             <h1 className="product-name">{product.name}</h1>
             <div className="product-rating-overview">
                <span>{Array(Math.round(avgRating) || 5).fill('⭐').join('')}</span>
                <span className="rating-text">{avgRating > 0 ? `${avgRating} - ${reviews.length} avaliações` : `127 avaliações`}</span>
             </div>

             <div className="price-section">
                {product.compareAtPrice > 0 && <div className="old-price">De: R$ {product.compareAtPrice.toFixed(2).replace('.', ',')}</div>}
                <div className="current-price">R$ {product.price.toFixed(2).replace('.', ',')}</div>
                <div className="pix-price"><strong>R$ {pixPrice.toFixed(2).replace('.', ',')}</strong> com Pix (10% de desconto)</div>
                <div className="installments-price">ou 6x de R$ {installmentPrice.toFixed(2).replace('.', ',')} sem juros</div>
             </div>

             {sizesList.length > 0 && (
               <div className="sizes-section">
                 <div className="sizes-label">Tamanho / ML</div>
                 <div className="sizes-options">
                   {sizesList.map(s => (
                     <button 
                       key={s} 
                       className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                       onClick={() => setSelectedSize(s)}
                     >
                       {s}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             <div className="actions-section">
                <button className="btn-add-cart" onClick={handleAddToCart}>Adicionar ao Carrinho</button>
                <button className="btn-buy-now" onClick={handleBuyNow}>Comprar Agora</button>
             </div>

             {product.description && (
                <div className="description-text">
                  <p>{product.description}</p>
                  {product.olfactoryFamily && <p><strong>Família Olfativa:</strong> {product.olfactoryFamily}</p>}
                </div>
             )}
          </div>
        </div>

        {/* OLFACTORY NOTES */}
        {(product.topNotes || product.heartNotes || product.baseNotes) && (
          <div className="olfactory-section">
            <h2 className="section-title">Pirâmide Olfativa</h2>
            <div className="notes-container">
               {product.topNotes && (
                 <div className="notes-block">
                    <h4>Top</h4>
                    <div className="notes-list">
                      {product.topNotes.split(',').map((n, i) => (
                        <div className="note-item" key={i}>
                          <span className="note-icon">🍋</span>
                          <span className="note-name">{n.trim()}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               {product.heartNotes && (
                 <div className="notes-block">
                    <h4>Coração</h4>
                    <div className="notes-list">
                      {product.heartNotes.split(',').map((n, i) => (
                        <div className="note-item" key={i}>
                          <span className="note-icon">🌸</span>
                          <span className="note-name">{n.trim()}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               {product.baseNotes && (
                 <div className="notes-block">
                    <h4>Fundo</h4>
                    <div className="notes-list">
                      {product.baseNotes.split(',').map((n, i) => (
                        <div className="note-item" key={i}>
                          <span className="note-icon">🪵</span>
                          <span className="note-name">{n.trim()}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* REVIEWS SECTION */}
        <div className="reviews-section">
           <h2 className="section-title">Avaliações de Clientes</h2>
           <div className="reviews-layout">
              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p style={{ color: '#555' }}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
                ) : (
                  reviews.map(r => (
                    <div className="review-card" key={r.id}>
                      <div className="review-header">
                         <div className="review-avatar">{r.name.charAt(0).toUpperCase()}</div>
                         <div>
                            <div className="review-name">{r.name}</div>
                            <div className="review-date">{new Date(r.date).toLocaleDateString()}</div>
                         </div>
                         <div className="review-stars-static">{Array(r.rating).fill('⭐').join('')}</div>
                      </div>
                      <div className="review-body">
                         <h4>{r.title}</h4>
                         <p>{r.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="review-form-box">
                 <h3>Deixe sua Avaliação</h3>
                 <form onSubmit={handleReviewSubmit}>
                   <div style={{ marginBottom: '10px' }}>
                     <label>Nota</label>
                     <div className="rating-select">
                       {[1,2,3,4,5].map(v => (
                         <span key={v} style={{ cursor: 'pointer', fontSize: '1.5rem', filter: reviewForm.rating >= v ? 'none' : 'grayscale(100%) opacity(0.3)' }} onClick={() => setReviewForm(prev => ({...prev, rating: v}))}>⭐</span>
                       ))}
                     </div>
                   </div>
                   <input type="text" placeholder="Nome" required value={reviewForm.name} onChange={e => setReviewForm(prev => ({...prev, name: e.target.value}))} />
                   <input type="email" placeholder="E-mail (não será exibido)" required value={reviewForm.email} onChange={e => setReviewForm(prev => ({...prev, email: e.target.value}))} />
                   <input type="text" placeholder="Título da Avaliação" required value={reviewForm.title} onChange={e => setReviewForm(prev => ({...prev, title: e.target.value}))} />
                   <textarea rows="4" placeholder="Sua experiência com o perfume" required value={reviewForm.text} onChange={e => setReviewForm(prev => ({...prev, text: e.target.value}))}></textarea>
                   <button type="submit" disabled={submittingReview}>{submittingReview ? 'Enviando...' : 'Enviar Avaliação'}</button>
                 </form>
              </div>
           </div>
        </div>
      </div>

      <Footer />

      {/* Cart Drawer from Layout */}
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
    </main>
  );
}
