'use client';

export default function Footer() {
  return (
    <footer style={{ marginTop: '60px', background: '#111', color: '#fff', padding: '40px 20px 30px' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between' }}>
          {/* Coluna 1: Marca */}
          <div style={{ minWidth: '200px' }}>
            <h3 className="brand-title" style={{ marginBottom: '10px' }}>OBSIDIAN PARFUMS</h3>
            <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.6' }}>A maior coleção de perfumes árabes exclusivos do Brasil. Sofisticação e qualidade.</p>
          </div>
          
          {/* Coluna 2: Endereço */}
          <div style={{ minWidth: '200px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#ccc' }}>📍 Onde Estamos</h4>
            <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.8' }}>
              Vitória da Conquista - BA<br />
              Horário: Seg-Sáb 12h30 às 22h00
            </p>
          </div>

          {/* Coluna 3: Contato */}
          <div style={{ minWidth: '200px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', color: '#ccc' }}>📲 Contato</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a 
                href="https://wa.me/5577998334081" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z" />
                </svg>
                (77) 99833-4081
              </a>
              <a 
                href="https://www.instagram.com/obsidian.parfums_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E1306C', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
              >
                📷 @obsidian.parfums_
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>© 2026 OBSIDIAN — Vitória da Conquista, BA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
