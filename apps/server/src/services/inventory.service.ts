import { supabaseAdmin } from '../config/supabase';

export interface InventoryItem {
  id: string;
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level?: number | null;
  updated_at?: string;
}

export class InventoryService {
  private tableName = 'inventory';

  async checkAvailability(variantId: string, requestedQuantity: number): Promise<boolean> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('quantity, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId}`)
        .single();

      if (!data) return false;
      const available = data.quantity - data.reserved_quantity;
      return available >= requestedQuantity;
    } catch {
      return false;
    }
  }

  async reserveStock(variantId: string, quantityToReserve: number): Promise<{ success: boolean; available: number }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, quantity, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId}`)
        .single();

      if (!data) return { success: false, available: 0 };
      const available = data.quantity - data.reserved_quantity;
      if (available < quantityToReserve) {
        return { success: false, available };
      }

      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          reserved_quantity: data.reserved_quantity + quantityToReserve,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) return { success: false, available };
      return { success: true, available: available - quantityToReserve };
    } catch {
      return { success: false, available: 0 };
    }
  }

  async releaseStock(variantId: string, quantityToRelease: number): Promise<{ success: boolean }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId}`)
        .single();

      if (!data) return { success: false };
      const newReserved = Math.max(0, data.reserved_quantity - quantityToRelease);

      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return { success: !error };
    } catch {
      return { success: false };
    }
  }

  async decrementStock(variantId: string, quantityToDecrement: number): Promise<{ success: boolean }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, quantity, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId}`)
        .single();

      if (!data) return { success: false };
      const newQuantity = Math.max(0, data.quantity - quantityToDecrement);
      const newReserved = Math.max(0, data.reserved_quantity - quantityToDecrement);

      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          quantity: newQuantity,
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return { success: !error };
    } catch {
      return { success: false };
    }
  }

  async increaseStock(variantId: string, quantityToIncrease: number): Promise<{ success: boolean }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId}`)
        .single();

      if (!data) return { success: false };

      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          quantity: data.quantity + quantityToIncrease,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return { success: !error };
    } catch {
      return { success: false };
    }
  }
}
