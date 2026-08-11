import { BaseRepository } from './base.repository';
import { ProductVariantDto } from '@galaxy/types';
import { supabaseAdmin } from '../config/supabase';

export class VariantRepository extends BaseRepository<ProductVariantDto> {
  constructor() {
    super('product_variants');
  }

  async findByProductId(productId: string): Promise<ProductVariantDto[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*, brand:brands(id, name, slug, logo_url), inventory:inventory(quantity, reserved_quantity, reorder_level)')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .order('model', { ascending: true });

      if (error || !data) return [];
      return data as ProductVariantDto[];
    } catch {
      return [];
    }
  }

  async findBySku(sku: string): Promise<ProductVariantDto | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*, brand:brands(id, name, slug, logo_url), inventory:inventory(quantity, reserved_quantity, reorder_level)')
        .eq('sku', sku)
        .single();

      if (error) return null;
      return data as ProductVariantDto;
    } catch {
      return null;
    }
  }
}
