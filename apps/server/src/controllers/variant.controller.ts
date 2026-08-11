import { Request, Response, NextFunction } from 'express';
import { VariantService } from '../services/variant.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const variantService = new VariantService();

// GET /api/v1/products/:id/variants
export async function getVariantsByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variants = await variantService.getVariantsByProduct(req.params.id);
    sendSuccess(res, { data: variants, message: 'Product variants retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/variants/:id or SKU lookup
export async function getVariantById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.id;
    let variant = await variantService.getVariantById(identifier);
    if (!variant) {
      // Try SKU lookup if id search misses
      variant = await variantService.getVariantBySku(identifier);
    }
    if (!variant) {
      return next(new AppError('Product variant not found', 404));
    }
    sendSuccess(res, { data: variant, message: 'Variant details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/variants/sku/:sku
export async function getVariantBySku(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await variantService.getVariantBySku(req.params.sku);
    if (!variant) {
      return next(new AppError('Variant with SKU not found', 404));
    }
    sendSuccess(res, { data: variant, message: 'Variant details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/admin/products/:id/variants
export async function createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id || req.body.product_id;
    if (!productId) {
      return next(new AppError('Product ID is required to create a variant', 400));
    }
    const variant = await variantService.createVariant(productId, req.body);
    sendSuccess(res, { data: variant, message: 'Product variant created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/admin/variants/:id
export async function updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await variantService.updateVariant(req.params.id, req.body);
    sendSuccess(res, { data: variant, message: 'Product variant updated successfully' });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/admin/variants/:id
export async function deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await variantService.deleteVariant(req.params.id);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Product variant deleted successfully' });
  } catch (error) {
    next(error);
  }
}
