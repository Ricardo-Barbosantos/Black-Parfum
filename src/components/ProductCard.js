'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({ product, onAddToCart }) {
  const pixPrice = product.price * 0.9;
  const installmentPrice = product.price / 6;

  return (
    <Link href={`/product/${product.id}`} className="product-card" style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
      {product.isOnSale && (
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
          
          <div className="card-pix-row">
            R$ {pixPrice.toFixed(2).replace('.', ',')} <span>com Pix</span>
          </div>
        </div>

        <div className="card-installments-box">
          6 x de R$ {installmentPrice.toFixed(2).replace('.', ',')} sem juros
        </div>

        <button 
          className="btn-comprar"
          onClick={(e) => {
            e.preventDefault(); // Evita navegar ao clicar direto no botão se quisermos adicionar direto, mas o prompt pede página de detalhes.
            // Para mantermos o fluxo novo, o botão apenas reforça o clique no link.
            window.location.href = `/product/${product.id}`;
          }}
        >
          Ver Detalhes
        </button>
      </div>
    </Link>
  );
}
