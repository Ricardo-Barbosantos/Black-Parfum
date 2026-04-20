'use client';
import Image from 'next/image';

export default function ProductCard({ product, onAddToCart }) {
  const pixPrice = product.price * 0.9;
  const installmentPrice = product.price / 6;

  return (
    <div className="product-card">
      {product.isOnSale && (
        <div className="card-badge">
          12% OFF
        </div>
      )}
      
      <div className="card-image-wrap">
        <Image 
          src={product.image || '/photos/perfume.jpg'} 
          alt={product.name}
          width={280}
          height={200}
          style={{ objectFit: 'contain' }}
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
            R$ {pixPrice.toFixed(2).replace('.', ',')} <span>com Pix</span>
          </div>
        </div>

        <div className="card-installments-box">
          6 x de R$ {installmentPrice.toFixed(2).replace('.', ',')} sem juros
        </div>

        <button 
          className="btn-comprar"
          onClick={() => onAddToCart(product)}
        >
          Comprar
        </button>
      </div>
    </div>
  );
}
