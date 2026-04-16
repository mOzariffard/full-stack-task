import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export const ProductController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.list(req.query as never);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
};
