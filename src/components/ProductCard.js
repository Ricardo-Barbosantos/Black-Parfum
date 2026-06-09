'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({ product, onAddToCart, reviews = [] }) {
  const installmentPrice = product.price / 5;
  const hasControlledStock = product.stock !== null && typeof product.stock !== 'undefined' && product.stock !== '';
  const isSoldOut = Boolean(product.soldOut) || (hasControlledStock && Number(product.stock) <= 0) || product.active === false;

  const productReviews = reviews.filter(r => r.productId === product.id);
  const avgRating = productReviews.length > 0 
    ? (productReviews.reduce((acc, curr) => acc + curr.rating, 0) / productReviews.length).toFixed(1)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className={`product-card ${isSoldOut ? 'product-card-sold-out' : ''}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }} aria-disabled={isSoldOut}>
      {isSoldOut && (
        <div className="card-badge card-badge-sold-out">
          ESGOTADO
        </div>
      )}
      {!isSoldOut && product.isOnSale && (
        <div className="card-badge">
          12% OFF
        </div>
      )}
      
      <div className="card-image-wrap" style={{ position: 'relative', width: '100%', height: '200px' }}>
        <Image 
          src={product.image || '/photos/perfume.jpg'} 
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 280px"
          style={{ objectFit: 'contain', padding: '10px' }}
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
        </div>

        <div className="card-installments-box">
          5 x de R$ {installmentPrice.toFixed(2).replace('.', ',')} sem juros
        </div>

        <button 
          className={`btn-comprar ${isSoldOut ? 'btn-comprar-sold-out' : ''}`}
          disabled={isSoldOut}
          onClick={(e) => {
            e.preventDefault();
            if (isSoldOut) return;
            window.location.href = `/product/${product.id}`;
          }}
        >
          {product.active === false ? 'Indisponivel' : isSoldOut ? 'Esgotado' : 'Comprar'}
        </button>

        {avgRating > 0 && (
          <div className="card-rating" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '12px' }}>
            <span style={{ color: '#C9A84C' }}>{Array(Math.round(avgRating)).fill('⭐').join('')}</span>
            <span style={{ color: '#777' }}>{avgRating} ({productReviews.length})</span>
          </div>
        )}

      </div>
    </Link>
  );
}
