import { BaseRepository } from './base.repository';
import { ProductDto, ProductQueryParams } from '@galaxy/types';
import { supabaseAdmin } from '../config/supabase';

export interface PaginatedProductsResult {
  products: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductRepository extends BaseRepository<ProductDto> {
  constructor() {
    super('products');
  }

  // Single composable query builder method for search, filtering, sorting, & pagination
  async findProductsWithFilters(params: ProductQueryParams): Promise<PaginatedProductsResult> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from(this.tableName).select('*', { count: 'exact' });

    // Active filter
    if (params.active !== undefined) {
      query = query.eq('is_active', params.active);
    }

    // Featured filter
    if (params.featured) {
      query = query.eq('is_featured', true);
    }

    // Category filter (UUID or slug)
    if (params.category) {
      if (params.category.includes('-')) {
        // Fetch category ID by slug
        const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', params.category).single();
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      } else {
        query = query.eq('category_id', params.category);
      }
    }

    // Brand filter (UUID or slug)
    if (params.brand) {
      if (params.brand.includes('-')) {
        const { data: b } = await supabaseAdmin.from('brands').select('id').eq('slug', params.brand).single();
        if (b) {
          query = query.eq('brand_id', b.id);
        }
      } else {
        query = query.eq('brand_id', params.brand);
      }
    }

    // Vendor filter (UUID or code)
    if (params.vendor) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.vendor);
      if (!isUuid) {
        const { data: v } = await supabaseAdmin.from('vendors').select('id').eq('code', params.vendor.toUpperCase()).single();
        if (v) {
          query = query.eq('source_vendor_id', v.id);
        }
      } else {
        query = query.eq('source_vendor_id', params.vendor);
      }
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
      const searchTerm = `%${params.search}%`;
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
      products: (data as ProductDto[]) || [],
      total,
      page,
      limit,
      totalPages
    };
  }
}
