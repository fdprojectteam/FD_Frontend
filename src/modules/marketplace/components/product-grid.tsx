import { FDProductCard } from './fd-product-card';
import type { ProductSummary } from '../types/product';

/**
 * ProductGrid — the approved product grid (M2.4).
 *
 * Reuses FDProductCard verbatim; there is no second card implementation.
 * Presentation-only: data and callbacks arrive through props.
 *
 * Columns follow the approved layout and the module's single-breakpoint
 * convention: one column below md, three from md (1200px desktop grid).
 */
export interface ProductGridProps {
  products: ProductSummary[];
  onCompare?: (productId: string) => void;
  comparingIds?: string[];
  compareDisabled?: boolean;
}

export function ProductGrid({
  products,
  onCompare,
  comparingIds = [],
  compareDisabled = false,
}: ProductGridProps) {
  return (
    <ul className="grid list-none gap-6 md:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <FDProductCard
            product={product}
            onCompare={onCompare}
            isComparing={comparingIds.includes(product.id)}
            compareDisabled={compareDisabled}
          />
        </li>
      ))}
    </ul>
  );
}
