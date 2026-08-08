import { BaseRepository } from './base.repository';
import { ProductDto } from '@galaxy/types';
import { supabaseAdmin } from '../config/supabase';

export class ProductRepository extends BaseRepository<ProductDto> {
  constructor() {
    super('products');
  }

  // PostgreSQL Full-Text Search / pg_trgm query preparation interface
  async searchProducts(query: string, limit = 20): Promise<ProductDto[]> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${query}%,seo_title.ilike.%${query}%,meta_keywords.ilike.%${query}%`)
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as ProductDto[];
  }
}
