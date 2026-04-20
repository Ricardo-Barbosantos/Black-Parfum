'use client';

export default function NavigationMenu({ 
  isOpen, 
  onClose, 
  onFilter 
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999 }}>
      <div style={{ 
        position: 'absolute', top: 0, left: 0, bottom: 0, 
        width: '80%', maxWidth: '300px', backgroundColor: '#fff', 
        display: 'flex', flexDirection: 'column',
        boxShadow: '10px 0 30px rgba(0,0,0,0.5)' 
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#111', fontFamily: 'var(--font-cinzel)' }}>OBSIDIAN</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#111', lineHeight: '1' }}>×</button>
        </div>
        
        <nav style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button 
            onClick={() => { onFilter('Todos', Infinity); onClose(); }} 
            style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>
            Início
          </button>
          <button 
            onClick={() => { onFilter('Perfume', Infinity); onClose(); }} 
            style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>
            Produtos (Inteiros)
          </button>
          <button 
            onClick={() => { onFilter('Decante', Infinity); onClose(); }} 
            style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>
            Decantes
          </button>
          <button 
            onClick={() => { onFilter('Todos', 99); onClose(); }} 
            style={{ textAlign: 'left', background: 'none', border: 'none', fontSize: '1.1rem', color: '#111', cursor: 'pointer', fontWeight: '500' }}>
            Até R$ 99
          </button>
        </nav>
      </div>
    </div>
  );
}
