import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/product.repository';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const productRepository = new ProductRepository();

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const query = req.query.q as string | undefined;

    const products = query
      ? await productRepository.searchProducts(query, limit)
      : await productRepository.list(limit);

    sendSuccess(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productRepository.findById(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    sendSuccess(res, product, 'Product details retrieved successfully');
  } catch (error) {
    next(error);
  }
}
