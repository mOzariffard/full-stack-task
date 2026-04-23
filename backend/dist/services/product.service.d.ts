import type { ProductFilterInput, CreateProductInput } from '../validators';
import type { ProductDto, PaginatedResult } from '../types';
export declare const ProductService: {
    list(filters: ProductFilterInput): Promise<PaginatedResult<ProductDto>>;
    getById(id: string): Promise<ProductDto>;
    create(input: CreateProductInput): Promise<ProductDto>;
};
//# sourceMappingURL=product.service.d.ts.map