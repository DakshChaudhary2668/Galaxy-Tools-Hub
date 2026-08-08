import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/product.repository';
import { BaseRepository } from '../repositories/base.repository';
import { ProductQueryParams, ProductImageDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const productRepository = new ProductRepository();
const productImageRepository = new BaseRepository<ProductImageDto>('product_images');

// GET /api/v1/products (Search, Filtering, Sorting, Pagination)
export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = req.query as unknown as ProductQueryParams;
    const result = await productRepository.findProductsWithFilters(params);

    sendSuccess(
      res,
      result.products,
      'Products retrieved successfully',
      200,
      null,
      result.page < result.totalPages,
      result.total,
      result.page,
      result.limit,
      result.totalPages
    );
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/products/:slug
export async function getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productRepository.findBySlug(req.params.slug);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    sendSuccess(res, product, 'Product details retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/products/admin (Admin Create)
export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newProduct = await productRepository.create(req.body);
    sendSuccess(res, newProduct, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/products/admin/:id (Admin Update)
export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedProduct = await productRepository.update(req.params.id, req.body);
    sendSuccess(res, updatedProduct, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id (Admin Delete)
export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productRepository.delete(req.params.id);
    sendSuccess(res, { id: req.params.id }, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/products/:id/images
export async function getProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const images = await productImageRepository.list(50);
    const productImages = images.filter((img) => img.product_id === req.params.id);
    sendSuccess(res, productImages, 'Product images retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/products/admin/:id/images
export async function addProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = { ...req.body, product_id: req.params.id };
    const newImage = await productImageRepository.create(payload);
    sendSuccess(res, newImage, 'Product image metadata saved successfully', 201);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id/images/:imageId
export async function deleteProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productImageRepository.delete(req.params.imageId);
    sendSuccess(res, { imageId: req.params.imageId }, 'Product image deleted successfully');
  } catch (error) {
    next(error);
  }
}
