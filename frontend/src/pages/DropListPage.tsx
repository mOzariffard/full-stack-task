import { useProducts } from '../hooks/useProduct';
import { ProductCard } from '../components/ProductCard';

export function DropListPage() {
  const { status, data: products, error, refresh } = useProducts();

  return (
    <main className="page drop-list-page">
      <section className="drop-hero">
        <h1 className="drop-hero__title">
          ⚡ Limited Drops
        </h1>
        <p className="drop-hero__subtitle">
          Exclusive items in limited quantities. Reserve yours before they're gone.
        </p>
      </section>

      {status === 'loading' && (
        <div className="loading-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="product-card product-card--skeleton" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="error-state">
          <p>😓 {error}</p>
          <button className="btn btn-primary" onClick={refresh}>Try again</button>
        </div>
      )}

      {status === 'success' && products && (
        <>
          {products.length === 0 ? (
            <div className="empty-state">
              <p>No active drops right now. Check back soon!</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
