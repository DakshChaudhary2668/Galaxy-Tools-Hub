import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../repositories/product.repository';
import { BaseRepository } from '../repositories/base.repository';
import { StorageRepository } from '../repositories/storage.repository';
import { supabaseAdmin } from '../config/supabase';
import { ProductQuerySchema, ProductImageDto, ProductImageCompleteRequestDto } from '@galaxy/types';
import { StorageBuckets } from '@galaxy/constants';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const productRepository = new ProductRepository();
const storageRepository = new StorageRepository();


// GET /api/v1/products (Search, Filtering, Sorting, Pagination)
export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = ProductQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(new AppError('Invalid product query', 400, parsed.error.flatten().fieldErrors as Record<string, string[]>));
    }
    const result = await productRepository.findProductsWithFilters(parsed.data);

    // Map product_images from DB join to images array and top-level image/image_url for ProductCard
    const mappedProducts = result.products.map((p: any) => {
      const rawImages = p.images || p.product_images || [];
      const images = rawImages.map((img: any) => ({
        ...img,
        image_url: img.public_url || img.image_url || img.storage_path
      }));
      const primary = images.find((img: any) => img.is_primary) || images[0];
      const primaryUrl = primary?.image_url || null;
      return {
        ...p,
        image: primaryUrl,
        image_url: primaryUrl,
        images
      };
    });

    sendSuccess(res, {
      data: mappedProducts,
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

    const [categoryRes, brandRes, imagesRes] = await Promise.allSettled([
      product.category_id
        ? supabaseAdmin.from('categories').select('id, name, slug, image_url').eq('id', product.category_id).single()
        : Promise.resolve({ data: null }),
      product.brand_id
        ? supabaseAdmin.from('brands').select('id, name, slug, logo_url').eq('id', product.brand_id).single()
        : Promise.resolve({ data: null }),
      supabaseAdmin.from('product_images').select('*').eq('product_id', product.id)
    ]);

    const category = categoryRes.status === 'fulfilled' && 'data' in categoryRes.value ? categoryRes.value.data : null;
    const brand = brandRes.status === 'fulfilled' && 'data' in brandRes.value ? brandRes.value.data : null;
    const images = imagesRes.status === 'fulfilled' && 'data' in imagesRes.value ? (imagesRes.value.data || []) : [];

    const normalizedImages = (images || []).map((img: any) => ({
      ...img,
      image_url: img.public_url || img.image_url || img.storage_path
    }));
    const primaryImg = normalizedImages.find((img: any) => img.is_primary) || normalizedImages[0];
    const primaryUrl = primaryImg?.image_url || null;

    const productDetail = {
      ...product,
      product,
      image: primaryUrl,
      image_url: primaryUrl,
      images: normalizedImages,
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

    const { image_url, image, images, product_images, stock, lowStockThreshold, ...productData } = payload;
    const newProduct = await productRepository.create(productData as any);

    // Initial stock
    if (stock !== undefined) {
      const { error: inventoryError } = await supabaseAdmin.from('inventory').insert({
        product_id: newProduct.id,
        quantity: Number(stock),
        reserved_quantity: 0,
        reorder_level: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5
      });
      if (inventoryError) throw new AppError('Product was created, but initial inventory could not be saved', 500);
    }

    // Initial primary image
    const initialImageUrl = (
      image_url ||
      image ||
      (Array.isArray(images) && (images[0]?.image_url || images[0]?.public_url || images[0]?.storage_path)) ||
      ''
    )?.trim?.() || (typeof image_url === 'string' ? image_url.trim() : '');

    if (initialImageUrl) {
      await supabaseAdmin.from('product_images').insert({
        product_id: newProduct.id,
        public_url: initialImageUrl,
        storage_path: initialImageUrl,
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

    const { image_url, image, images, product_images, stock, lowStockThreshold, ...productPayload } = payload;
    let updatedProduct: any;
    if (Object.keys(productPayload).length > 0) {
      updatedProduct = await productRepository.update(productId, {
        ...productPayload,
        updated_at: new Date().toISOString()
      });
    } else {
      const existing = await productRepository.findById(productId);
      if (!existing) return next(new AppError('Product not found', 404));
      updatedProduct = existing;
    }

    // Update stock if provided
    if (stock !== undefined) {
      const stockQuantity = Number(stock);
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        throw new AppError('Stock must be a non-negative integer', 400);
      }

      const updateExistingInventory = async (inventory: {
        id: string;
        reserved_quantity: number;
        reorder_level: number | null;
      }) => {
        if (stockQuantity < inventory.reserved_quantity) {
          throw new AppError('Stock cannot be lower than the currently reserved quantity', 409);
        }

        const { data, error } = await supabaseAdmin
          .from('inventory')
          .update({
            quantity: stockQuantity,
            reorder_level:
              lowStockThreshold !== undefined
                ? Number(lowStockThreshold)
                : inventory.reorder_level,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventory.id)
          .select('id')
          .single();

        if (error || !data) throw new AppError('Failed to update product inventory', 500);
      };

      const { data: inventory, error: inventoryLookupError } = await supabaseAdmin
        .from('inventory')
        .select('id, reserved_quantity, reorder_level')
        .eq('product_id', productId)
        .maybeSingle();

      if (inventoryLookupError) throw new AppError('Failed to retrieve product inventory', 500);

      if (inventory) {
        await updateExistingInventory(inventory);
      } else {
        const { error: insertError } = await supabaseAdmin.from('inventory').insert({
          product_id: productId,
          quantity: stockQuantity,
          reserved_quantity: 0,
          reorder_level: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5
        });

        if (insertError?.code === '23505') {
          const { data: concurrentInventory, error: concurrentLookupError } = await supabaseAdmin
            .from('inventory')
            .select('id, reserved_quantity, reorder_level')
            .eq('product_id', productId)
            .single();

          if (concurrentLookupError || !concurrentInventory) {
            throw new AppError('Inventory was created concurrently but could not be reloaded', 409);
          }
          await updateExistingInventory(concurrentInventory);
        } else if (insertError) {
          throw new AppError('Failed to create product inventory', 500);
        }
      }
    }

    // UPSERT primary image if provided
    const targetImageUrl = (
      image_url ||
      image ||
      (Array.isArray(images) && (images[0]?.image_url || images[0]?.public_url || images[0]?.storage_path)) ||
      ''
    )?.trim?.() || (typeof image_url === 'string' ? image_url.trim() : '');

    if (targetImageUrl) {
      const { data: existingImg } = await supabaseAdmin
        .from('product_images')
        .select('id, is_primary')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false })
        .limit(1);

      if (existingImg && existingImg[0]) {
        await supabaseAdmin
          .from('product_images')
          .update({
            public_url: targetImageUrl,
            storage_path: targetImageUrl,
            is_primary: true
          })
          .eq('id', existingImg[0].id);
      } else {
        await supabaseAdmin.from('product_images').insert({
          product_id: productId,
          public_url: targetImageUrl,
          storage_path: targetImageUrl,
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


// GET /api/v1/products/:id/images
export async function getProductImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id;
    const { data, error } = await supabaseAdmin.from('product_images').select('*').eq('product_id', productId);
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

// POST /api/v1/products/admin/:id/images/complete (Sprint 3)
export async function completeProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id;
    const { storage_path, alt_text } = req.body as ProductImageCompleteRequestDto;

    // 1. Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // 2. Validate that storage_path belongs strictly to this product
    if (!storage_path.startsWith(`products/${productId}/`)) {
      return next(new AppError('Storage path does not match this product ID', 400));
    }

    const pathPattern = /^products\/[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$/;
    if (!pathPattern.test(storage_path)) {
      return next(new AppError('Invalid managed storage path format', 400));
    }

    // 3. Derive public CDN URL server-side (never trust client-supplied public_url)
    const public_url = storageRepository.getPublicUrl(StorageBuckets.PRODUCT_IMAGES, storage_path);

    // 4. Safe replacement: query existing images first to prepare for safe cleanup
    const { data: existingImages, error: fetchErr } = await supabaseAdmin
      .from('product_images')
      .select('id, storage_path')
      .eq('product_id', productId);

    if (fetchErr) {
      throw new AppError('Failed to query existing product images', 500);
    }

    // 5. Insert new primary image record
    const { data: newImage, error: insertErr } = await supabaseAdmin
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path,
        public_url,
        alt_text: alt_text || null,
        is_primary: true,
        sort_order: 0
      })
      .select('*')
      .single();

    if (insertErr || !newImage) {
      // If DB insert fails, cleanup the newly uploaded object to prevent orphaned storage objects
      console.error('[completeProductImage] Insert failed, cleaning up uploaded object:', storage_path);
      await storageRepository.deleteObject(StorageBuckets.PRODUCT_IMAGES, storage_path);
      throw new AppError('Failed to save product image record', 500);
    }

    // 6. If insert succeeded, safely cleanup previous image records and managed storage objects
    if (existingImages && existingImages.length > 0) {
      for (const oldImg of existingImages) {
        // Only delete storage object if it is a managed Supabase key (not external URL)
        if (oldImg.storage_path && oldImg.storage_path.startsWith('products/') && !oldImg.storage_path.startsWith('http')) {
          await storageRepository.deleteObject(StorageBuckets.PRODUCT_IMAGES, oldImg.storage_path);
        }
        await supabaseAdmin.from('product_images').delete().eq('id', oldImg.id);
      }
    }

    sendSuccess(res, {
      data: newImage,
      message: 'Product image upload completed and saved successfully',
      statusCode: 201
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/products/admin/:id/images/primary (Sprint 3)
export async function removeProductPrimaryImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id;

    // Verify product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const { data: existingImages, error: fetchErr } = await supabaseAdmin
      .from('product_images')
      .select('id, storage_path')
      .eq('product_id', productId);

    if (fetchErr) {
      throw new AppError('Failed to query product images', 500);
    }

    if (existingImages && existingImages.length > 0) {
      for (const img of existingImages) {
        // Only delete from storage if it is a managed object path, not arbitrary external URLs
        if (img.storage_path && img.storage_path.startsWith('products/') && !img.storage_path.startsWith('http')) {
          await storageRepository.deleteObject(StorageBuckets.PRODUCT_IMAGES, img.storage_path);
        }
        await supabaseAdmin.from('product_images').delete().eq('id', img.id);
      }
    }

    sendSuccess(res, {
      data: { productId },
      message: 'Product image removed successfully'
    });
  } catch (error) {
    next(error);
  }
}
