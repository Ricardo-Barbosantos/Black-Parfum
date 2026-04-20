'use client';

export default function Header({ cartItemCount, onCartClick, onMenuClick }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer' }} onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.5" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </div>
        
        <div className="logo-text" style={{ textAlign: 'center', flex: 1 }}>
           <div className="brand-title">OBSIDIAN PARFUMS</div>
           <div className="brand-subtitle">BOUTIQUE DE LUXO</div>
        </div>

        <div onClick={onCartClick} style={{ position: 'relative', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" width="26" height="26" stroke="#000" strokeWidth="1.2" fill="none">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
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
