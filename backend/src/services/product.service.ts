import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type { ProductFilterInput, CreateProductInput } from '../validators';
import type { ProductDto, PaginatedResult } from '../types';

function toDto(p: {
  id: string;
  name: string;
  description: string;
  price: Prisma.Decimal;
  imageUrl: string | null;
  totalStock: number;
  currentStock: number;
  reservedStock: number;
  isActive: boolean;
  createdAt: Date;
}): ProductDto {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toFixed(2),
    imageUrl: p.imageUrl,
    totalStock: p.totalStock,
    currentStock: p.currentStock,
    reservedStock: p.reservedStock,
    availableStock: Math.max(0, p.currentStock - p.reservedStock),
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

export const ProductService = {
  async list(filters: ProductFilterInput): Promise<PaginatedResult<ProductDto>> {
    const { page, limit, sortBy, sortOrder, isActive, minStock, maxPrice, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(minStock !== undefined && { currentStock: { gte: minStock } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map(toDto),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async getById(id: string): Promise<ProductDto> {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product');
    return toDto(product);
  },

  async create(input: CreateProductInput): Promise<ProductDto> {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        totalStock: input.totalStock,
        currentStock: input.totalStock,
        reservedStock: 0,
        inventoryLogs: {
          create: {
            eventType: 'MANUAL_ADJUSTMENT',
            quantityDelta: input.totalStock,
            stockBefore: 0,
            stockAfter: input.totalStock,
            note: 'Initial stock',
          },
        },
      },
    });
    return toDto(product);
  },
};
