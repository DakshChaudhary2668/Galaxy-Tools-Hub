import { BaseRepository } from './base.repository';
import { ProductDto, ProductQueryParams, ProductView } from '@galaxy/types';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

export interface PaginatedProductsResult {
  products: ProductView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const UuidSchema = z.string().uuid();

export class ProductRepository extends BaseRepository<ProductDto> {
  constructor() {
    super('products');
  }

  // Single composable query builder method for search, filtering, sorting, & pagination
  async findProductsWithFilters(params: ProductQueryParams): Promise<PaginatedProductsResult> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from(this.tableName)
      .select('*, category:categories!products_category_id_fkey(id, name, slug), brand:brands!products_brand_id_fkey(id, name, slug), images:product_images!product_images_product_id_fkey(id, storage_path, public_url, is_primary, sort_order)', { count: 'exact' });

    // Active filter
    if (params.active !== undefined) {
      query = query.eq('is_active', params.active);
    }

    // Featured filter
    if (params.featured) {
      query = query.eq('is_featured', true);
    }

    if (params.homepage) {
      query = query.eq('show_on_homepage', true);
    }

    // Discounted filter
    if (params.discounted) {
      query = query.not('compare_at_price', 'is', null).gt('compare_at_price', 0);
    }

    // Category filter (UUID or slug)
    if (params.category) {
      const categoryId = await this.resolveFilterId('categories', 'slug', params.category);
      if (!categoryId) {
        return this.emptyResult(page, limit);
      }
      query = query.eq('category_id', categoryId);
    }

    // Brand filter (UUID or slug)
    if (params.brand) {
      const brandId = await this.resolveFilterId('brands', 'slug', params.brand);
      if (!brandId) {
        return this.emptyResult(page, limit);
      }
      query = query.eq('brand_id', brandId);
    }

    // Vendor filter (UUID or code)
    if (params.vendor) {
      const vendorId = await this.resolveFilterId('vendors', 'code', params.vendor, true);
      if (!vendorId) {
        return this.emptyResult(page, limit);
      }
      query = query.eq('source_vendor_id', vendorId);
    }

    // Price range filters
    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }

    // Search query (PostgreSQL FTS / ILIKE across fields)
    if (params.search) {
      const escaped = params.search
        .replace(/\\/g, '\\\\')
        .replace(/[%_]/g, '\\$&')
        .replace(/"/g, '\\"');
      const searchTerm = `"%${escaped}%"`;
      query = query.or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm},seo_title.ilike.${searchTerm},meta_keywords.ilike.${searchTerm},source_model_no.ilike.${searchTerm},sku.ilike.${searchTerm}`
      );
    }

    // Sorting
    switch (params.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'featured':
        query = query.order('is_featured', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination bounds
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      products: (data as ProductView[]) || [],
      total,
      page,
      limit,
      totalPages
    };
  }

  private emptyResult(page: number, limit: number): PaginatedProductsResult {
    return { products: [], total: 0, page, limit, totalPages: 0 };
  }

  private async resolveFilterId(
    table: 'categories' | 'brands' | 'vendors',
    lookupColumn: 'slug' | 'code',
    value: string,
    uppercaseLookup = false
  ): Promise<string | null> {
    if (UuidSchema.safeParse(value).success) {
      return value;
    }

    const lookupValue = uppercaseLookup ? value.toUpperCase() : value;
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('id')
      .eq(lookupColumn, lookupValue)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.id || null;
  }
}
