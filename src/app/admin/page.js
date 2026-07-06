'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Collapsible from '@radix-ui/react-collapsible';
import './page.css';

function hasFilledValue(value) {
  if (typeof value === 'number') return value > 0;
  return String(value || '').trim().length > 0;
}

function hasStockValue(value) {
  return value !== null && typeof value !== 'undefined' && value !== '';
}

function ProductAccordionSection({ title, filled, children }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="admin-accordion-section">
      <Collapsible.Trigger className="admin-accordion-trigger">
        <span className="admin-accordion-title">
          <span className="admin-accordion-arrow">{open ? '▼' : '▶'}</span>
          {title}
        </span>
        {filled && <span className="admin-filled-badge">● preenchido</span>}
      </Collapsible.Trigger>
      <Collapsible.Content className="admin-accordion-content">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
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

  // Função para verificar se o token JWT está expirado
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true; // Assume expirado se não puder verificar
    }
  };

  const isProductSoldOut = (product) => {
    const hasControlledStock = product.stock !== null && typeof product.stock !== 'undefined' && product.stock !== '';
    return Boolean(product.soldOut) || (hasControlledStock && Number(product.stock) <= 0);
  };

  const formatMoney = (value = 0) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;

  const formatDateTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusMeta = (status) => {
    const map = {
      paid: { label: 'PAGO', color: '#16a34a', background: 'rgba(22, 163, 74, 0.18)' },
      pending: { label: 'A PAGAR', color: '#facc15', background: 'rgba(250, 204, 21, 0.16)' },
      cancelled: { label: 'CANCELADO', color: '#f87171', background: 'rgba(248, 113, 113, 0.18)' },
      refunded: { label: 'REEMBOLSADO', color: '#93c5fd', background: 'rgba(147, 197, 253, 0.16)' },
    };

    return map[status] || map.pending;
  };

  const loadAdminData = async (token) => {
    setLoading(true);
    try {
      const [productsRes, reviewsRes, couponsRes, ordersRes] = await Promise.all([
        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch('/api/reviews?all=true', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch('/api/coupons', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
      ]);

      const [productsData, reviewsData, couponsData, ordersData] = await Promise.all([
        productsRes.json(),
        reviewsRes.json(),
        couponsRes.json(),
        ordersRes.json()
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setCoupons(Array.isArray(couponsData?.coupons) ? couponsData.coupons : []);
      setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : []);
    } catch (error) {
      setMessage('Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem('admin_password');
    const savedToken = localStorage.getItem('oud_admin_cache');
    if (savedToken) {
      // Verifica se o token está expirado antes de usá-lo
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem('oud_admin_cache');
        localStorage.removeItem('admin_email');
        setLoading(false);
      } else {
        setAuthToken(savedToken);
        setIsAuthenticated(true);
        loadAdminData(savedToken);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setIsAuthenticated(true);
        setAuthToken(data.token);
        localStorage.setItem('oud_admin_cache', data.token);
        // Armazena temporariamente email e senha para renovação automática do token
        localStorage.setItem('admin_email', email);
        await loadAdminData(data.token);
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
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_password');
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

    let currentToken = authToken;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      // Verifica se o token atual está expirado antes de tentar fazer o upload
      if (isTokenExpired(currentToken)) {
        const storedEmail = localStorage.getItem('admin_email');
        const storedPassword = '';

        if (!storedEmail || !storedPassword) {
          alert(`Erro ao subir ${file.name}: Credenciais não encontradas. Por favor, faça login novamente.`);
          handleLogout();
          return;
        }

        // Renova o token antes de tentar o upload
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: storedEmail,
            password: storedPassword
          })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.token) {
          currentToken = loginData.token; // Atualiza a variável local para uso imediato
          setAuthToken(loginData.token);
          localStorage.setItem('oud_admin_cache', loginData.token);
        } else {
          alert(`Erro ao renovar token para upload de ${file.name}: ${loginData.error || 'Falha ao renovar o token'}`);
          return;
        }
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}` // Usa o token novo (ou o atual se for válido)
          },
          body: formData
        });

        if (res.status === 401) {
          // Mesmo após a verificação de expiração, pode haver outro problema de autenticação
          const storedEmail = localStorage.getItem('admin_email');
          const storedPassword = '';

          if (!storedEmail || !storedPassword) {
            alert(`Erro ao subir ${file.name}: Credenciais não encontradas. Por favor, faça login novamente.`);
            handleLogout(); // Força logout se não tiver credenciais
            return;
          }

          // Faz login novamente para obter novo token
          const loginRes = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: storedEmail,
              password: storedPassword
            })
          });

          const loginData = await loginRes.json();

          if (loginRes.ok && loginData.token) {
            // Atualiza o token e tenta novamente
            setAuthToken(loginData.token);
            localStorage.setItem('oud_admin_cache', loginData.token);

            // Tenta o upload novamente com o novo token
            const retryRes = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${loginData.token}`
              },
              body: formData
            });

            const retryData = await retryRes.json();
            if (retryRes.ok && retryData.url) {
              // Adiciona à lista de imagens
              product.images.push(retryData.url);
              // Define a primeira como imagem principal se não houver uma
              if (!product.image || product.image === '/photos/perfume.jpg') {
                product.image = retryData.url;
              }
            } else {
              alert(`Erro ao subir ${file.name} após renovação de token: ${retryData.error}`);
            }
          } else {
            alert(`Erro de autenticação renovada para ${file.name}: ${loginData.error || 'Falha ao renovar o token'}`);
          }
        } else {
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

  const handleAddProduct = (category = 'Perfume') => {
    const newProduct = {
      id: String(Date.now()),
      name: category === 'Decante' ? "Novo Decante (Edite)" : category === 'Combo Decantes' ? "Novo Combo de Decantes (Edite)" : "Novo Perfume (Edite)",
      price: 0,
      compareAtPrice: 0,
      image: "/photos/perfume.jpg",
      images: ["/photos/perfume.jpg"],
      isOnSale: false,
      active: true,
      soldOut: false,
      stock: null,
      purchasePrice: null,
      dupeOf: "",
      rating: 5,
      discountPercent: 0,
      installments: "3x de R$ 0,00 s/ juros",
      category,
      brand: "Outra",
      gender: "Unissex",
      sizes: category === 'Decante' ? "5ml, 10ml" : category === 'Combo Decantes' ? "Combo com 3 decantes" : "50ml, 100ml",
      description: "",
      topNotes: "",
      heartNotes: "",
      baseNotes: "",
      olfactoryFamily: "Amadeirado",
      videoUrl: ""
    };
    setProducts([newProduct, ...products]);
  };

  const handleDeleteProduct = (index) => {
    const newProducts = [...products];
    newProducts.splice(index, 1);
    setProducts(newProducts);
  };

  const handleAddCoupon = () => {
    setCoupons([
      {
        id: `coupon_${Date.now()}`,
        code: 'NOVO10',
        discountPercent: 10,
        influencerName: '',
        commissionPercent: 0,
        commissionFixed: 0,
        active: true,
        createdAt: new Date().toISOString(),
      },
      ...coupons
    ]);
  };

  const handleCouponChange = (index, field, value) => {
    const nextCoupons = [...coupons];
    nextCoupons[index] = { ...nextCoupons[index], [field]: value };
    setCoupons(nextCoupons);
  };

  const handleDeleteCoupon = (index) => {
    if (!confirm('Remover este cupom?')) return;
    setCoupons(coupons.filter((_, couponIndex) => couponIndex !== index));
  };

  const handleSaveCoupons = async () => {
    if (isTokenExpired(authToken)) {
      setMessage('Sessao expirada. Faca login novamente.');
      setTimeout(() => handleLogout(), 1500);
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(coupons.map(coupon => ({
          ...coupon,
          code: String(coupon.code || '').toUpperCase().replace(/\s+/g, ''),
          discountPercent: Number(coupon.discountPercent || 0),
          commissionPercent: Number(coupon.commissionPercent || 0),
          commissionFixed: Number(coupon.commissionFixed || 0),
          active: coupon.active !== false,
        })))
      });
      const data = await res.json();

      if (res.status === 401) {
        setMessage('Sessao expirada. Faca login novamente.');
        setTimeout(() => handleLogout(), 1500);
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao salvar cupons.');

      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
      setMessage('Cupons salvos com sucesso!');
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar cupons.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleOrderAction = async (orderId, action, status) => {
    if (action === 'delete' && !confirm('Apagar este pedido do painel?')) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id: orderId, action, status })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar pedido.');

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setMessage(action === 'delete' ? 'Pedido apagado.' : 'Pedido atualizado.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message || 'Erro ao atualizar pedido.');
    }
  };

  const validateProductsBeforeSave = () => {
    for (const product of products) {
      const productName = product.name || 'Produto sem nome';

      if (!String(product.name || '').trim()) {
        return `Preencha o nome do produto antes de salvar.`;
      }

      if (!String(product.category || '').trim()) {
        return `Preencha a categoria de ${productName}.`;
      }

      if (!String(product.gender || '').trim()) {
        return `Preencha o gênero de ${productName}.`;
      }

      if (!String(product.brand || '').trim()) {
        return `Preencha a marca de ${productName}.`;
      }

      if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
        return `Informe um preço atual válido para ${productName}.`;
      }

      if (product.compareAtPrice !== '' && product.compareAtPrice !== null && typeof product.compareAtPrice !== 'undefined' && Number(product.compareAtPrice) < 0) {
        return `O preço anterior de ${productName} não pode ser negativo.`;
      }

      if (hasStockValue(product.stock) && (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0)) {
        return `O estoque de ${productName} precisa ser um número inteiro maior ou igual a zero.`;
      }

      if (hasStockValue(product.purchasePrice) && Number(product.purchasePrice) < 0) {
        return `O preço de compra de ${productName} não pode ser negativo.`;
      }
    }

    return '';
  };

  const handleSave = async () => {
    const validationError = validateProductsBeforeSave();

    if (validationError) {
      setMessage(`❌ ${validationError}`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setSaving(true);
    setMessage('');

    let currentToken = authToken;

    // Verifica se o token atual está expirado antes de tentar salvar
    if (isTokenExpired(currentToken)) {
      const storedEmail = localStorage.getItem('admin_email');
      const storedPassword = '';

      if (!storedEmail || !storedPassword) {
        setMessage('❌ Erro de Segurança: Credenciais não encontradas. Faça login novamente.');
        setTimeout(() => handleLogout(), 2000);
        return;
      }

      // Renova o token antes de tentar salvar
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: storedEmail,
          password: storedPassword
        })
      });

      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.token) {
        currentToken = loginData.token; // Atualiza localmente para o fetch abaixo
        setAuthToken(loginData.token);
        localStorage.setItem('oud_admin_cache', loginData.token);
      } else {
        setMessage('❌ Erro ao renovar token: ' + (loginData.error || 'Falha ao renovar o token'));
        setTimeout(() => handleLogout(), 2000);
        return;
      }
    }

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(products)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        // Se não conseguir parsear o JSON, continua com dados vazios
      }

      if (res.status === 401) {
        // Verifica se temos credenciais armazenadas
        const storedEmail = localStorage.getItem('admin_email');
        const storedPassword = '';

        if (!storedEmail || !storedPassword) {
          setMessage('❌ Erro de Segurança: Credenciais não encontradas. Faça login novamente.');
          setTimeout(() => handleLogout(), 2000);
          return;
        }

        // Tenta renovar o token e tentar novamente
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: storedEmail,
            password: storedPassword
          })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.token) {
          // Atualiza o token e tenta novamente
          setAuthToken(loginData.token);
          localStorage.setItem('oud_admin_cache', loginData.token);

          // Tenta salvar novamente com o novo token
          const retryRes = await fetch('/api/products', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify(products)
          });

          try {
            data = await retryRes.json();
          } catch (e) {}

          if (retryRes.ok) {
            setMessage('✅ Alterações salvas com sucesso na nuvem!');
            // Refresh products to ensure sync
            const refresh = await fetch('/api/products?t=' + Date.now(), { headers: { 'Authorization': `Bearer ${loginData.token}` }, cache: 'no-store' });
            const freshData = await refresh.json();
            if (Array.isArray(freshData)) setProducts(freshData);
          } else {
            setMessage('❌ Erro ao salvar após renovação de token: ' + (data.error || 'Erro desconhecido.'));
          }
        } else {
          setMessage('❌ Erro de Segurança: Sessão inválida e falha na renovação. ' + (loginData.error || ''));
          setTimeout(() => handleLogout(), 2000);
        }
      } else if (res.ok) {
        setMessage('✅ Alterações salvas com sucesso na nuvem!');
        // Refresh products to ensure sync
        const refresh = await fetch('/api/products?t=' + Date.now(), { headers: { 'Authorization': `Bearer ${currentToken}` }, cache: 'no-store' });
        const freshData = await refresh.json();
        if (Array.isArray(freshData)) setProducts(freshData);
      } else {
        setMessage('❌ Erro ao salvar: ' + (data.error || 'Erro desconhecido.'));
      }
    } catch(err) {
      setMessage('❌ Erro de conexão ao salvar no banco de dados.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="admin-login-screen">
        <form onSubmit={handleLogin} className="admin-login-card">
          <h1 className="admin-login-brand">OBSIDIAN</h1>
          
          <input 
            type="email" 
            placeholder="E-mail de acesso"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-login-input"
          />

          <input 
            type="password" 
            placeholder="Senha Mestra"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-login-input"
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

  const displayedProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => {
      if (activeTab === 'soldOut') return isProductSoldOut(product);
      if (activeTab === 'inactive') return product.active === false;
      if (activeTab === 'decants') return product.category === 'Decante';
      if (activeTab === 'combos') return product.category === 'Combo Decantes';
      return activeTab === 'products' && product.active !== false && !isProductSoldOut(product);
    });

  const sectionTitle = activeTab === 'reviews'
    ? 'Moderação de Reviews'
    : activeTab === 'coupons'
      ? 'Cupons e Influencers'
    : activeTab === 'sales'
      ? 'Vendas'
    : activeTab === 'soldOut'
      ? 'Produtos Esgotados'
    : activeTab === 'inactive'
      ? 'Produtos Inativos'
    : activeTab === 'decants'
      ? 'Gerenciamento de Decantes'
      : activeTab === 'combos'
        ? 'Gerenciamento de Combos de Decantes'
        : 'Gerenciamento de Produtos';

  const totalProducts = products.length;
  const soldOutProducts = products.filter(isProductSoldOut).length;
  const activeProducts = products.filter(product => product.active !== false && !isProductSoldOut(product)).length;
  const categoriesCount = new Set(products.map(product => product.category).filter(Boolean)).size;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const paidOrders = orders.filter(order => order.status === 'paid').length;
  const canEditProducts = ['products', 'decants', 'combos', 'soldOut', 'inactive'].includes(activeTab);
  const canAddCurrentTab = ['products', 'decants', 'combos'].includes(activeTab) || activeTab === 'coupons';
  const addCurrentProduct = () => handleAddProduct(activeTab === 'decants' ? 'Decante' : activeTab === 'combos' ? 'Combo Decantes' : 'Perfume');
  const emptyProductsText = activeTab === 'combos'
    ? 'Nenhum combo de decantes cadastrado.'
    : activeTab === 'decants'
      ? 'Nenhum decante cadastrado.'
      : activeTab === 'soldOut'
        ? 'Nenhum produto esgotado.'
        : activeTab === 'inactive'
          ? 'Nenhum produto inativo.'
          : 'Nenhum produto ativo cadastrado.';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Painel Admin</h2>
        </div>
        <nav className="admin-nav">
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')} style={{cursor: 'pointer'}}>
            Ativos ({activeProducts})
          </div>
          <div className={`nav-item ${activeTab === 'soldOut' ? 'active' : ''}`} onClick={() => setActiveTab('soldOut')} style={{cursor: 'pointer'}}>
            Esgotados ({soldOutProducts})
          </div>
          <div className={`nav-item ${activeTab === 'inactive' ? 'active' : ''}`} onClick={() => setActiveTab('inactive')} style={{cursor: 'pointer'}}>
            Inativos ({products.filter(product => product.active === false).length})
          </div>
          <div className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')} style={{cursor: 'pointer'}}>
            Vendas ({pendingOrders})
          </div>
          <div className={`nav-item ${activeTab === 'decants' ? 'active' : ''}`} onClick={() => setActiveTab('decants')} style={{cursor: 'pointer'}}>
            Decantes
          </div>
          <div className={`nav-item ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')} style={{cursor: 'pointer'}}>
            Combos Decantes
          </div>
          <div className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')} style={{cursor: 'pointer'}}>
            Reviews Pendentes ({reviews.filter(r => r.status === 'pending').length})
          </div>
          <div className={`nav-item ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')} style={{cursor: 'pointer'}}>
            Cupons ({coupons.length})
          </div>
          {canAddCurrentTab && <button onClick={() => activeTab === 'coupons' ? handleAddCoupon() : addCurrentProduct()} className="btn-add">
            {activeTab === 'coupons' ? '+ Novo Cupom' : activeTab === 'decants' ? '+ Novo Decante' : activeTab === 'combos' ? '+ Novo Combo' : '+ Novo Produto'}
          </button>}
          <Link href="/" className="nav-link">
            Ver Loja
          </Link>
        </nav>
        
        <button onClick={handleLogout} className="btn-logout">
          Sair / Logout
        </button>
      </aside>

      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1>{sectionTitle}</h1>
          {activeTab === 'sales' ? (
            <button className="btn-gold" onClick={() => loadAdminData(authToken)} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Atualizar
            </button>
          ) : (canEditProducts || activeTab === 'coupons') ? (
            <button className="btn-gold" onClick={activeTab === 'coupons' ? handleSaveCoupons : handleSave} disabled={saving} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              {saving ? <span className="spinner" style={{ width: '20px', height: '20px' }}></span> : 'Salvar Alterações no Banco'}
            </button>
          ) : null}
        </div>

        {message && (
          <div style={{ padding: '15px', background: message.includes('sucesso') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)', border: `1px solid ${message.includes('sucesso') ? 'green' : 'red'}`, borderRadius: '4px', marginBottom: '30px', color: message.includes('sucesso') ? '#4ade80' : '#f87171' }}>
            {message}
          </div>
        )}

        <div className="admin-stats-grid">
          {[
            { label: 'Total produtos', value: totalProducts, color: '#fff' },
            { label: 'Ativos', value: activeProducts, color: '#22c55e' },
            { label: 'Esgotados', value: soldOutProducts, color: '#f87171' },
            { label: 'Categorias', value: categoriesCount, color: '#facc15' },
            { label: 'Vendas pagas', value: paidOrders, color: '#22c55e' },
          ].map((stat) => (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-label">{stat.label}</div>
              <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {canEditProducts && (
        <div className="products-container">
          {displayedProducts.length === 0 && (
            <div className="admin-empty-state">
              <strong>{emptyProductsText}</strong>
              {['products', 'decants', 'combos'].includes(activeTab) && (
                <button onClick={addCurrentProduct} className="btn-gold" style={{ padding: '12px 22px', fontSize: '0.95rem' }}>
                  {activeTab === 'combos' ? '+ Novo Combo' : activeTab === 'decants' ? '+ Novo Decante' : '+ Novo Produto'}
                </button>
              )}
            </div>
          )}
          {displayedProducts.map(({ product, index }) => (
            <div key={product.id} className="admin-product-editor">
              
              <button 
                onClick={() => handleDeleteProduct(index)} 
                title="Deletar"
                className="admin-delete-product-btn">
                X
              </button>

              <div className="admin-media-panel">
                <div className="admin-media-card">
                  <label className="admin-field-kicker">Galeria ({product.images?.length || 0})</label>
                  
                  <div className="admin-gallery-grid">
                    {(product.images || [product.image]).map((img, i) => (
                      <div key={i} className="admin-gallery-thumb" style={{ border: product.image === img ? '2px solid var(--primary-gold)' : '1px solid #333' }}>
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
                    
                    <label className="admin-upload-tile">
                      <span>+ Adicionar fotos</span>
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(index, e.target.files)} />
                    </label>
                  </div>

                  {uploadingImageIndex === index && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', textAlign: 'center', marginBottom: '10px' }}>
                      ⚡ Enviando fotos...
                    </div>
                  )}

                  <input 
                    type="text" 
                    placeholder="Ou cole link da imagem aqui..."
                    value={product.image || ''}
                    onChange={(e) => handleChange(index, 'image', e.target.value)}
                    style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', color: '#888', borderRadius: '4px', fontSize: '0.7rem', marginTop: '5px' }}
                  />

                  <p style={{ fontSize: '0.6rem', color: '#555', lineHeight: '1.2', marginTop: '10px' }}>
                    Dica: Use o &quot;+&quot; para subir fotos. O campo acima serve para links externos.
                  </p>

                  <input 
                    type="text" 
                    placeholder="URL do Vídeo (Google Drive, YouTube ou MP4)"
                    value={product.videoUrl || ''}
                    onChange={(e) => handleChange(index, 'videoUrl', e.target.value)}
                    style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', color: '#888', borderRadius: '4px', fontSize: '0.7rem', marginTop: '15px' }}
                  />
                  <p style={{ fontSize: '0.6rem', color: '#555', lineHeight: '1.2', marginTop: '5px' }}>
                    Adicione um link do Google Drive, YouTube ou arquivo .mp4. 
                    <br/><strong style={{ color: '#d4af37' }}>⚠️ O vídeo no Google Drive deve estar com acesso público (&apos;Qualquer pessoa com o link&apos;).</strong>
                  </p>
                </div>
              </div>
              
              <div className="admin-product-form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Nome do Perfume</label>
                  <input 
                    type="text" 
                    value={product.name || ''}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                  />
                </div>

                <ProductAccordionSection
                  title="Classificação"
                  filled={hasFilledValue(product.category) || hasFilledValue(product.gender) || hasFilledValue(product.brand) || hasFilledValue(product.olfactoryFamily) || hasFilledValue(product.dupeOf)}
                >
                  <div className="admin-accordion-grid">
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Categoria</label>
                      <select
                        value={product.category || 'Perfume'}
                        onChange={(e) => handleChange(index, 'category', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      >
                        <option value="Perfume">Perfume (Frasco)</option>
                        <option value="Decante">Decante</option>
                        <option value="Combo Decantes">Combo Decantes</option>
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
                        <option value="Rasasi">Rasasi</option>
                        <option value="Creme">Creme</option>
                        <option value="Outra">Outra</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Família Olfativa</label>
                      <input
                        type="text"
                        placeholder="Ex: Amadeirado, Floral, Oriental"
                        value={product.olfactoryFamily || ''}
                        onChange={(e) => handleChange(index, 'olfactoryFamily', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>

                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Dupe de / Inspirado em</label>
                      <input
                        type="text"
                        placeholder="Ex: Creed Aventus, Baccarat Rouge 540..."
                        value={product.dupeOf || ''}
                        onChange={(e) => handleChange(index, 'dupeOf', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </ProductAccordionSection>

                <ProductAccordionSection
                  title="Preço & Estoque"
                  filled={hasFilledValue(product.price) || hasFilledValue(product.compareAtPrice) || hasStockValue(product.stock) || hasStockValue(product.purchasePrice)}
                >
                  <div className="admin-accordion-grid">
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

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Preço de Compra (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Só admin"
                        value={product.purchasePrice ?? ''}
                        onChange={(e) => handleChange(index, 'purchasePrice', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '6px' }}>Interno. Não aparece na loja.</div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Estoque</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Sem controle"
                        value={product.stock ?? ''}
                        onChange={(e) => handleChange(index, 'stock', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '6px' }}>Em branco = sem baixa automatica.</div>
                    </div>
                  </div>
                </ProductAccordionSection>

                <ProductAccordionSection
                  title="Detalhes & Tamanhos"
                  filled={hasFilledValue(product.sizes) || hasFilledValue(product.description)}
                >
                  <div className="admin-accordion-grid">
                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Tamanhos Disponíveis (separados por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: 50ml, 100ml, 150ml"
                        value={product.sizes || ''}
                        onChange={(e) => handleChange(index, 'sizes', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>

                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Descrição do Perfume</label>
                      <textarea
                        rows="4"
                        placeholder="Descrição sobre o perfume..."
                        value={product.description || ''}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </ProductAccordionSection>

                <ProductAccordionSection
                  title="Notas Olfativas"
                  filled={hasFilledValue(product.topNotes) || hasFilledValue(product.heartNotes) || hasFilledValue(product.baseNotes)}
                >
                  <div className="admin-accordion-grid">
                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Notas de Topo (separadas por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Limão, Abacaxi, Bergamota"
                        value={product.topNotes || ''}
                        onChange={(e) => handleChange(index, 'topNotes', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>

                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Notas de Coração (separadas por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Jasmim, Rosa, Vidoeiro"
                        value={product.heartNotes || ''}
                        onChange={(e) => handleChange(index, 'heartNotes', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>

                    <div className="admin-accordion-field-full">
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Notas de Base (separadas por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: Almíscar, Baunilha, Patchouli"
                        value={product.baseNotes || ''}
                        onChange={(e) => handleChange(index, 'baseNotes', e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </ProductAccordionSection>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id={`active-${product.id}`}
                    checked={product.active !== false}
                    onChange={(e) => handleChange(index, 'active', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#4ade80', cursor: 'pointer' }}
                  />
                  <label htmlFor={`active-${product.id}`} style={{ fontSize: '1.1rem', cursor: 'pointer', color: product.active !== false ? '#4ade80' : 'var(--text-dim)' }}>
                    Produto ATIVO na loja
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '15px' }}>
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

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="checkbox"
                    id={`sold-out-${product.id}`}
                    checked={product.soldOut || false}
                    onChange={(e) => handleChange(index, 'soldOut', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#f87171', cursor: 'pointer' }}
                  />
                  <label htmlFor={`sold-out-${product.id}`} style={{ fontSize: '1.1rem', cursor: 'pointer', color: product.soldOut ? '#f87171' : 'var(--text-dim)' }}>
                    Marcar como ESGOTADO
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {activeTab === 'coupons' && (
          <div className="coupons-container" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {coupons.length === 0 ? (
              <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '24px', borderRadius: '8px', color: 'var(--text-dim)' }}>
                Nenhum cupom cadastrado. Clique em + Novo Cupom para criar.
              </div>
            ) : (
              coupons.map((coupon, index) => (
                <div key={coupon.id || index} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'end' }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Codigo do cupom</label>
                    <input
                      type="text"
                      value={coupon.code || ''}
                      onChange={(e) => handleCouponChange(index, 'code', e.target.value.toUpperCase())}
                      placeholder="AMAURI10"
                      style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Desconto (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      step="0.1"
                      value={coupon.discountPercent || ''}
                      onChange={(e) => handleCouponChange(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Influencer</label>
                    <input
                      type="text"
                      value={coupon.influencerName || ''}
                      onChange={(e) => handleCouponChange(index, 'influencerName', e.target.value)}
                      placeholder="Amauri"
                      style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Comissao (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      step="0.1"
                      value={coupon.commissionPercent || ''}
                      onChange={(e) => handleCouponChange(index, 'commissionPercent', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Comissao fixa (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={coupon.commissionFixed || ''}
                      onChange={(e) => handleCouponChange(index, 'commissionFixed', parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px' }}>
                    <label style={{ color: coupon.active !== false ? '#4ade80' : '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={coupon.active !== false}
                        onChange={(e) => handleCouponChange(index, 'active', e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }}
                      />
                      Ativo
                    </label>
                    <button
                      onClick={() => handleDeleteCoupon(index)}
                      style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))
            )}
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              A comissao e calculada sobre o subtotal dos produtos depois do desconto, sem incluir frete. Se preencher comissao fixa, ela prevalece sobre a porcentagem.
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div style={{ border: '1px solid #222', borderRadius: '6px', background: 'rgba(10,10,10,0.72)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Pedidos recentes</h2>
                <p style={{ margin: '6px 0 0', color: '#b8c7d9', fontSize: '0.9rem' }}>Clientes, endereco, itens, frete, total e status do pagamento.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#b8c7d9', fontSize: '0.85rem' }}>
                <span>A pagar: {pendingOrders}</span>
                <span>Pagos: {paidOrders}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.4fr 1.4fr .9fr .9fr .8fr', gap: '18px', padding: '14px', color: '#b8c7d9', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              <div>Pedido</div>
              <div>Cliente</div>
              <div>Entrega</div>
              <div>Itens</div>
              <div>Valores</div>
              <div>Status</div>
              <div>Acoes</div>
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Nenhum pedido registrado ainda.</div>
            ) : (
              orders.map((order) => {
                const statusMeta = getOrderStatusMeta(order.status);
                const delivery = order.customer?.deliveryMethod === 'pickup'
                  ? 'Retirar na loja'
                  : `${order.customer?.address || ''} ${order.customer?.number || ''}${order.customer?.complement ? `, ${order.customer.complement}` : ''} - ${order.customer?.neighborhood || ''} - ${order.customer?.city || ''}/${order.customer?.state || ''} - ${order.customer?.zip || ''}`;

                return (
                  <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.4fr 1.4fr .9fr .9fr .8fr', gap: '18px', padding: '18px 14px', borderBottom: '1px solid #1f2937', color: '#fff', alignItems: 'start', fontSize: '0.86rem' }}>
                    <div>
                      <strong style={{ color: '#fff' }}>{order.id}</strong>
                      <div style={{ color: '#b8c7d9', fontSize: '0.78rem', marginTop: '6px' }}>{formatDateTime(order.createdAt)}</div>
                    </div>
                    <div>
                      <strong>{order.customer?.name || '-'}</strong>
                      <div style={{ color: '#b8c7d9', fontSize: '0.78rem', marginTop: '6px' }}>{order.customer?.email || '-'}</div>
                    </div>
                    <div style={{ color: '#e5e7eb', lineHeight: 1.45 }}>{delivery}</div>
                    <div style={{ color: '#e5e7eb', lineHeight: 1.45 }}>
                      {(order.items || []).map((item) => (
                        <div key={`${order.id}-${item.cartItemId}`}>{item.quantity}x {item.name}{item.selectedSize ? ` - ${item.selectedSize}` : ''}</div>
                      ))}
                    </div>
                    <div style={{ lineHeight: 1.5 }}>
                      <div>Produtos: {formatMoney(order.amounts?.subtotal)}</div>
                      {Number(order.amounts?.discount || 0) > 0 && <div>Desc: -{formatMoney(order.amounts.discount)}</div>}
                      <div>Frete: {formatMoney(order.amounts?.shipping)}</div>
                      <strong>Total: {formatMoney(order.amounts?.total)}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'inline-block', padding: '6px 9px', borderRadius: '4px', background: statusMeta.background, color: statusMeta.color, fontWeight: 800, fontSize: '0.72rem' }}>
                        {statusMeta.label}
                      </span>
                      {order.paymentId && <div style={{ color: '#b8c7d9', fontSize: '0.75rem', marginTop: '8px' }}>MP: {order.paymentId}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(order.initPoint || order.sandboxInitPoint) && (
                        <a href={order.initPoint || order.sandboxInitPoint} target="_blank" rel="noreferrer" style={{ border: '1px solid #d4af37', color: '#d4af37', borderRadius: '4px', padding: '7px 8px', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem' }}>
                          Ver pagamento
                        </a>
                      )}
                      <button onClick={() => handleOrderAction(order.id, 'delete')} style={{ border: '1px solid #555', color: '#fff', background: 'transparent', borderRadius: '4px', padding: '7px 8px', cursor: 'pointer', fontWeight: 700 }}>
                        Apagar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="reviews-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-dim)' }}>Nenhum review encontrado.</p>
            ) : (
              reviews.map((review) => {
                const prod = products.find(p => p.id === review.productId);
                return (
                  <div key={review.id} style={{ background: '#0a0a0a', border: '1px solid #333', padding: '20px', borderRadius: '8px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div>
                        <strong style={{ color: 'var(--primary-gold)', fontSize: '1.2rem' }}>{prod ? prod.name : 'Produto Desconhecido'}</strong>
                        <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
                          De: {review.name} ({review.email}) - {review.rating} ⭐
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>{new Date(review.date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        {review.status === 'pending' && <span style={{ padding: '4px 8px', background: 'orange', color: '#000', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>PENDENTE</span>}
                        {review.status === 'approved' && <span style={{ padding: '4px 8px', background: '#4ade80', color: '#000', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>APROVADO</span>}
                      </div>
                    </div>
                    
                    <h4 style={{ marginBottom: '10px', color: '#fff' }}>&quot;{review.title}&quot;</h4>
                    <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{review.text}</p>
                    
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      {review.status !== 'approved' && (
                        <button 
                          onClick={async () => {
                            await fetch('/api/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify({ id: review.id, status: 'approved', action: 'update' }) });
                            setReviews(reviews.map(r => r.id === review.id ? {...r, status: 'approved'} : r));
                          }}
                          style={{ background: '#4ade80', color: '#000', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Aprovar ✔️
                        </button>
                      )}
                      <button 
                        onClick={async () => {
                          if (!confirm("Tem certeza que deseja excluir esse review?")) return;
                          await fetch('/api/reviews', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify({ id: review.id, action: 'delete' }) });
                          setReviews(reviews.filter(r => r.id !== review.id));
                        }}
                        style={{ background: '#f87171', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Excluir 🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
