"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
function toDto(p) {
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
exports.ProductService = {
    async list(filters) {
        const { page, limit, sortBy, sortOrder, isActive, minStock, maxPrice, search } = filters;
        const skip = (page - 1) * limit;
        const where = {
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
        const orderBy = { [sortBy]: sortOrder };
        const [products, total] = await database_1.prisma.$transaction([
            database_1.prisma.product.findMany({ where, orderBy, skip, take: limit }),
            database_1.prisma.product.count({ where }),
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
    async getById(id) {
        const product = await database_1.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new errors_1.NotFoundError('Product');
        return toDto(product);
    },
    async create(input) {
        const product = await database_1.prisma.product.create({
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
//# sourceMappingURL=product.service.js.map