'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(''); 

  useEffect(() => {
    const savedToken = localStorage.getItem('oud_admin_cache');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
    }
    
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsAuthenticated(true);
        setAuthToken(data.token);
        localStorage.setItem('oud_admin_cache', data.token); 
      } else {
        setAuthError(data.error || 'Credenciais inválidas!');
      }
    } catch(err) {
      setAuthError('Erro de conexão ao servidor.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('oud_admin_cache');
    setIsAuthenticated(false);
    setAuthToken('');
    setPassword('');
    setEmail('');
  };

  const handleChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleImageUpload = async (index, files) => {
    if (!files || files.length === 0) return;
    setUploadingImageIndex(index);
    
    const newProducts = [...products];
    const product = newProducts[index];
    if (!product.images) product.images = product.image ? [product.image] : [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authToken}`
          },
          body: formData 
        });
        
        const data = await res.json();
        if (res.ok && data.url) {
          // Adiciona à lista de imagens
          product.images.push(data.url);
          // Define a primeira como imagem principal se não houver uma
          if (!product.image || product.image === '/photos/perfume.jpg') {
            product.image = data.url;
          }
        } else {
          alert(`Erro ao subir ${file.name}: ${data.error}`);
        }
      } catch (err) {
        alert(`Erro de rede ao enviar ${file.name}`);
      }
    }
    
    setProducts(newProducts);
    setUploadingImageIndex(null);
  };

  const removeImage = (pIndex, imgIndex) => {
    const newProducts = [...products];
    const product = newProducts[pIndex];
    product.images.splice(imgIndex, 1);
    
    // Atualiza a thumbnail principal se removermos a atual
    if (product.images.length > 0) {
      product.image = product.images[0];
    } else {
      product.image = '/photos/perfume.jpg';
    }
    
    setProducts(newProducts);
  };

  const handleAddProduct = () => {
    const newProduct = {
      id: String(Date.now()),
      name: "Novo Perfume (Edite)",
      price: 0,
      compareAtPrice: 0,
      image: "/photos/perfume.jpg",
      images: ["/photos/perfume.jpg"],
      isOnSale: false,
      rating: 5,
      discountPercent: 0,
      installments: "3x de R$ 0,00 s/ juros",
      category: "Perfume",
      brand: "Outra",
      gender: "Unissex"
    };
    setProducts([newProduct, ...products]);
  };

  const handleDeleteProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authToken}` 
        },
        body: JSON.stringify(products)
      });
      
      if (res.status === 401) {
        setMessage('Erro de Segurança: Sessão inválida. Você está desconectado.');
        setTimeout(() => handleLogout(), 2000); 
      } else if (res.ok) {
        setMessage('Alterações salvas com sucesso!');
      } else {
        setMessage('Erro ao salvar as alterações.');
      }
    } catch(err) {
      setMessage('Erro de conexão ao salvar.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!loading && !isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
        <form onSubmit={handleLogin} style={{ background: '#111', padding: '40px', borderRadius: '8px', border: '1px solid #222', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-gold)', marginBottom: '10px' }}>Oud Royale Admin</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '30px', fontSize: '0.9rem' }}>Acesso restrito à gerência.</p>
          
          <input 
            type="email" 
            placeholder="E-mail de acesso"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px', marginBottom: '15px' }}
          />

          <input 
            type="password" 
            placeholder="Senha Mestra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px', marginBottom: '15px' }}
          />
          
          {authError && <div style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '15px' }}>{authError}</div>}
          
          <button type="submit" className="btn-gold" style={{ width: '100%', padding: '12px' }}>
            Acessar Painel
          </button>
          
          <Link href="/" style={{ display: 'block', marginTop: '20px', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Voltar para Loja
          </Link>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <p>Acessando o sistema...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingBottom: '100px' }}>
      <aside className="admin-sidebar" style={{ width: '250px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <h2 style={{ color: 'var(--primary-gold)', fontSize: '1.2rem' }}>Painel Admin</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gestão Segura</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
          <div style={{ padding: '10px', background: 'var(--primary-gold-dim)', borderRadius: '4px', borderLeft: '3px solid var(--primary-gold)', color: 'var(--primary-gold)' }}>
            Produtos e Preços
          </div>
          <button onClick={handleAddProduct} style={{ padding: '10px', background: '#222', color: '#fff', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', border: '1px solid #444' }}>
            + Novo Produto
          </button>
          <Link href="/" style={{ padding: '10px', color: 'var(--text-dim)' }}>
            Ver Loja
          </Link>
        </nav>
        
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #333', color: '#f87171', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
          Sair / Logout
        </button>
      </aside>

      <main style={{ flex: 1, padding: '50px', background: 'var(--bg-dark)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1>Gerenciamento de Produtos</h1>
          <button className="btn-gold" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', fontSize: '1rem' }}>
            {saving ? <span className="spinner" style={{ width: '20px', height: '20px' }}></span> : 'Salvar Alterações no Banco'}
          </button>
        </div>

        {message && (
          <div style={{ padding: '15px', background: message.includes('sucesso') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)', border: `1px solid ${message.includes('sucesso') ? 'green' : 'red'}`, borderRadius: '4px', marginBottom: '30px', color: message.includes('sucesso') ? '#4ade80' : '#f87171' }}>
            {message}
          </div>
        )}

        <div style={{ background: '#111', borderRadius: '8px', padding: '30px', border: '1px solid #222' }}>
          {products.map((product, index) => (
            <div key={product.id} style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', borderBottom: '1px solid #222', paddingBottom: '30px', marginBottom: '30px', position: 'relative' }}>
              
              <button 
                onClick={() => handleDeleteProduct(index)} 
                title="Deletar"
                style={{ position: 'absolute', top: 0, right: 0, background: '#f87171', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
                X
              </button>

              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #222' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Galeria ({product.images?.length || 0})</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {(product.images || [product.image]).map((img, i) => (
                      <div key={i} style={{ aspectRatio: '1/1', background: '#1a1a1a', borderRadius: '4px', position: 'relative', overflow: 'hidden', border: product.image === img ? '2px solid var(--primary-gold)' : '1px solid #333' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => removeImage(index, i)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >✕</button>
                        {product.image === img && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary-gold)', color: '#000', fontSize: '8px', textAlign: 'center', fontWeight: 'bold', padding: '1px' }}>PRINCIPAL</div>
                        )}
                      </div>
                    ))}
                    
                    <label style={{ aspectRatio: '1/1', background: '#222', borderRadius: '4px', border: '1px dashed #555', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}>
                      +
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(index, e.target.files)} />
                    </label>
                  </div>

                  {uploadingImageIndex === index && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', textAlign: 'center', marginBottom: '10px' }}>
                      ⚡ Enviando fotos...
                    </div>
                  )}

                  <p style={{ fontSize: '0.65rem', color: '#666', lineHeight: '1.2' }}>
                    Dica: Clique em "+" para subir várias fotos de uma vez. A primeira será a principal.
                  </p>
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Nome do Perfume</label>
                  <input 
                    type="text" 
                    value={product.name || ''}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Categoria</label>
                  <select 
                    value={product.category || 'Perfume'}
                    onChange={(e) => handleChange(index, 'category', e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  >
                    <option value="Perfume">Perfume (Frasco)</option>
                    <option value="Decante">Decante</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Gênero</label>
                  <select 
                    value={product.gender || 'Unissex'}
                    onChange={(e) => handleChange(index, 'gender', e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Unissex">Unissex</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Marca</label>
                  <select 
                    value={product.brand || 'Outra'}
                    onChange={(e) => handleChange(index, 'brand', e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  >
                    <option value="Lattafa">Lattafa</option>
                    <option value="Maison Alhambra">Maison Alhambra</option>
                    <option value="Al Haramain">Al Haramain</option>
                    <option value="Armaf">Armaf</option>
                    <option value="Afnan">Afnan</option>
                    <option value="Paris Elysees">Paris Elysees</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Preço Atual (R$)</label>
                  <input 
                    type="number" 
                    value={product.price || ''}
                    onChange={(e) => handleChange(index, 'price', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Preço Anterior (R$)</label>
                  <input 
                    type="number" 
                    value={product.compareAtPrice || ''}
                    onChange={(e) => handleChange(index, 'compareAtPrice', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                  <input 
                    type="checkbox" 
                    id={`promo-${product.id}`}
                    checked={product.isOnSale || false}
                    onChange={(e) => handleChange(index, 'isOnSale', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary-gold)', cursor: 'pointer' }}
                  />
                  <label htmlFor={`promo-${product.id}`} style={{ fontSize: '1.1rem', cursor: 'pointer', color: product.isOnSale ? 'var(--primary-gold)' : 'var(--text-dim)' }}>
                    Ativar Etiqueta de PROMOÇÃO
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
