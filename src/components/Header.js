'use client';
import Link from 'next/link';

export default function Header({ cartItemCount, onCartClick, onMenuClick }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer' }} onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.5" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </div>
        
        <Link href="/" className="logo-text" style={{ textAlign: 'center', flex: 1, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
           <div className="brand-title">OBSIDIAN PARFUMS</div>
           <div className="brand-subtitle">BOUTIQUE DE LUXO</div>
        </Link>

        <div onClick={onCartClick} style={{ position: 'relative', cursor: 'pointer' }} aria-label="Abrir carrinho">
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.6 13.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L23 6H6" />
          </svg>
          <span style={{
             position: 'absolute', top: '-5px', right: '-10px', 
             background: 'var(--color-gold)', color: '#fff', fontSize: '10px', fontWeight: 'bold',
             width: '18px', height: '18px', borderRadius: '50%', 
             display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {cartItemCount}
          </span>
        </div>
      </div>
    </header>
  );
}
