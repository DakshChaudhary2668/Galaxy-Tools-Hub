import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/product.repository';
import { VariantRepository } from '../repositories/variant.repository';
import { BaseRepository } from '../repositories/base.repository';
import { supabaseAdmin } from '../config/supabase';
import { ProductQueryParams, ProductImageDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const productRepository = new ProductRepository();
const variantRepository = new VariantRepository();

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
    const slugOrId = req.params.slug;
    let product = await productRepository.findBySlug(slugOrId);
    if (!product) {
      product = await productRepository.findById(slugOrId);
    }
    if (!product) return next(new AppError('Product not found', 404));

    const [categoryRes, brandRes, variantsRes, imagesRes] = await Promise.allSettled([
      product.category_id
        ? supabaseAdmin.from('categories').select('id, name, slug, image_url').eq('id', product.category_id).single()
        : Promise.resolve({ data: null }),
      product.brand_id
        ? supabaseAdmin.from('brands').select('id, name, slug, logo_url').eq('id', product.brand_id).single()
        : Promise.resolve({ data: null }),
      variantRepository.findByProductId(product.id),
      supabaseAdmin.from('product_images').select('*').eq('product_id', product.id)
    ]);

    const category = categoryRes.status === 'fulfilled' && 'data' in categoryRes.value ? categoryRes.value.data : null;
    const brand = brandRes.status === 'fulfilled' && 'data' in brandRes.value ? brandRes.value.data : null;
    let rawVariants = variantsRes.status === 'fulfilled' ? variantsRes.value : [];
    let images = imagesRes.status === 'fulfilled' && 'data' in imagesRes.value ? (imagesRes.value.data || []) : [];

    // Filter active variants and sort by price, then model
    const sortedVariants = (rawVariants || [])
      .filter((v) => v.is_active !== false)
      .sort((a, b) => (a.price - b.price) || (a.model || '').localeCompare(b.model || ''));

    // Image fallback: map variant-specific images if available, else fallback to parent product images
    const parentImages = (images || []).filter((img: { variant_id?: string | null }) => !img.variant_id);
    const variants = sortedVariants.map((variant) => {
      const variantSpecificImages = (images || []).filter((img: { variant_id?: string | null }) => img.variant_id === variant.id);
      return {
        ...variant,
        images: variantSpecificImages.length > 0 ? variantSpecificImages : parentImages
      };
    });

    const productDetail = {
      ...product,
      product,
      variants,
      images,
      brand,
      category,
      specifications: product.specifications || {}
    };

    sendSuccess(res, { data: productDetail, message: 'Product details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/products/admin
export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    if (!payload.name) return next(new AppError('Product name is required', 400));
    if (!payload.sku) return next(new AppError('Product SKU is required', 400));

    // Check SKU uniqueness
    const existingSku = await productRepository.findOneByField('sku', payload.sku);
    if (existingSku) {
      return next(new AppError(`A product with SKU "${payload.sku}" already exists.`, 400));
    }

    // Auto-generate slug if missing
    if (!payload.slug) {
      payload.slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (!payload.source_model_no) payload.source_model_no = payload.sku;
    if (!payload.hsn_code) payload.hsn_code = '9030';
    if (!payload.source_vendor_id) {
      const { data: v } = await supabaseAdmin.from('vendors').select('id').limit(1).single();
      if (v) payload.source_vendor_id = v.id;
    }

    const newProduct = await productRepository.create(payload);

    // Initial stock
    if (payload.stock !== undefined) {
      await supabaseAdmin.from('inventory').insert({
        product_id: newProduct.id,
        quantity: Number(payload.stock) || 0,
        reserved_quantity: 0,
        reorder_level: Number(payload.lowStockThreshold) || 5
      });
    }

    // Initial primary image
    if (payload.image_url) {
      await supabaseAdmin.from('product_images').insert({
        product_id: newProduct.id,
        image_url: payload.image_url,
        is_primary: true,
        sort_order: 0
      });
    }

    sendSuccess(res, { data: newProduct, message: 'Product created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/products/admin/:id
export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;
    const productId = req.params.id;

    // Check SKU uniqueness if changed
    if (payload.sku) {
      const existingSku = await productRepository.findOneByField('sku', payload.sku);
      if (existingSku && existingSku.id !== productId) {
        return next(new AppError(`Another product already uses SKU "${payload.sku}".`, 400));
      }
    }

    const updatedProduct = await productRepository.update(productId, payload);

    // Update stock if provided
    if (payload.stock !== undefined) {
      const { data: inv } = await supabaseAdmin
        .from('inventory')
        .select('id')
        .or(`product_id.eq.${productId},variant_id.eq.${productId}`)
        .limit(1);

      if (inv && inv[0]) {
        await supabaseAdmin
          .from('inventory')
          .update({
            quantity: Number(payload.stock),
            reorder_level: payload.lowStockThreshold !== undefined ? Number(payload.lowStockThreshold) : 5,
            updated_at: new Date().toISOString()
          })
          .eq('id', inv[0].id);
      } else {
        await supabaseAdmin.from('inventory').insert({
          product_id: productId,
          quantity: Number(payload.stock) || 0,
          reserved_quantity: 0,
          reorder_level: Number(payload.lowStockThreshold) || 5
        });
      }
    }

    // Update primary image if provided
    if (payload.image_url) {
      const { data: existingImg } = await supabaseAdmin
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (existingImg && existingImg[0]) {
        await supabaseAdmin
          .from('product_images')
          .update({ image_url: payload.image_url })
          .eq('id', existingImg[0].id);
      } else {
        await supabaseAdmin.from('product_images').insert({
          product_id: productId,
          image_url: payload.image_url,
          is_primary: true,
          sort_order: 0
        });
      }
    }

    sendSuccess(res, { data: updatedProduct, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id
export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id;

    // Check whether product is referenced by historical orders
    const { data: referencedOrders } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (referencedOrders && referencedOrders.length > 0) {
      // Soft-delete / deactivate product to preserve order integrity
      await productRepository.update(productId, { is_active: false });
      sendSuccess(res, {
        data: { id: productId, action: 'archived' },
        message: 'Product is linked to customer orders. It has been deactivated/archived safely.'
      });
      return;
    }

    await productRepository.delete(productId);
    sendSuccess(res, { data: { id: productId, action: 'deleted' }, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}


// GET /api/v1/products/:id/images — includes variant-specific images with parent fallback
export async function getProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id;
    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);

    const variantIds = (variants || []).map((v: { id: string }) => v.id);

    let query = supabaseAdmin.from('product_images').select('*');
    if (variantIds.length > 0) {
      query = query.or(`product_id.eq.${productId},variant_id.in.(${variantIds.join(',')})`);
    } else {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    sendSuccess(res, { data: (data || []) as ProductImageDto[], message: 'Product images retrieved successfully' });
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
