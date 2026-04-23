"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
exports.ProductController = {
    async list(req, res, next) {
        try {
            const result = await product_service_1.ProductService.list(req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
    async getById(req, res, next) {
        try {
            const product = await product_service_1.ProductService.getById(req.params.id);
            res.status(200).json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const product = await product_service_1.ProductService.create(req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=product.controller.js.map