import Link from 'next/link';
import type { Product } from '../types';
import { StockDisplay } from './StockDisplay';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const soldOut = product.availableStock === 0;

  return (
    <Link
      href={`/drop/${product.id}`}
      className={`product-card ${soldOut ? 'product-card--sold-out' : ''}`}
    >
      <div className="product-card__image-wrapper">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-placeholder">
            <span>🛒</span>
          </div>
        )}
        {soldOut && (
          <div className="product-card__sold-out-overlay">
            <span>SOLD OUT</span>
          </div>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__description">
          {product.description.length > 100
            ? `${product.description.slice(0, 100)}…`
            : product.description}
        </p>

        <StockDisplay
          availableStock={product.availableStock}
          totalStock={product.totalStock}
        />

        <div className="product-card__footer">
          <span className="product-card__price">${product.price}</span>
          <span className={`product-card__cta ${soldOut ? 'cta--disabled' : 'cta--active'}`}>
            {soldOut ? 'Sold Out' : 'View Drop →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
