'use client';

export default function ProductSkeleton() {
  return (
    <div className="product-card" style={{ opacity: 0.6 }}>
      <div className="card-image-wrap" style={{ backgroundColor: '#eee', height: '200px' }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }}></div>
      </div>

      <div className="card-content">
        <div style={{ height: '1.2rem', backgroundColor: '#eee', marginBottom: '10px', width: '80%' }}></div>
        <div style={{ height: '1.5rem', backgroundColor: '#eee', marginBottom: '8px', width: '60%' }}></div>
        <div style={{ height: '3rem', backgroundColor: '#eee', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}
