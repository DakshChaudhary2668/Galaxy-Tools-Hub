import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/product.repository';
import { BaseRepository } from '../repositories/base.repository';
import { supabaseAdmin } from '../config/supabase';
import { ProductQueryParams, ProductImageDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const productRepository = new ProductRepository();

// GET /api/v1/products (Search, Filtering, Sorting, Pagination)
export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = req.query as unknown as ProductQueryParams;
    const result = await productRepository.findProductsWithFilters(params);
    sendSuccess(res, {
      data: result.products,
      message: 'Products retrieved successfully',
      meta: {
        hasMore: result.page < result.totalPages,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/products/:slug
export async function getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productRepository.findBySlug(req.params.slug);
    if (!product) return next(new AppError('Product not found', 404));
    sendSuccess(res, { data: product, message: 'Product details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/products/admin
export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newProduct = await productRepository.create(req.body);
    sendSuccess(res, { data: newProduct, message: 'Product created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/products/admin/:id
export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedProduct = await productRepository.update(req.params.id, req.body);
    sendSuccess(res, { data: updatedProduct, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id
export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productRepository.delete(req.params.id);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/products/:id/images — query DB directly, no in-memory filter
export async function getProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', req.params.id);
    if (error) throw new Error(error.message);
    sendSuccess(res, { data: data as ProductImageDto[], message: 'Product images retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/products/admin/:id/images
export async function addProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const imageRepo = new BaseRepository<ProductImageDto>('product_images');
    const newImage = await imageRepo.create({ ...req.body, product_id: req.params.id });
    sendSuccess(res, { data: newImage, message: 'Product image metadata saved successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id/images/:imageId
export async function deleteProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const imageRepo = new BaseRepository<ProductImageDto>('product_images');
    await imageRepo.delete(req.params.imageId);
    sendSuccess(res, { data: { imageId: req.params.imageId }, message: 'Product image deleted successfully' });
  } catch (error) {
    next(error);
  }
}
