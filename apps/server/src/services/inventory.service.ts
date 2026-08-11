import { supabaseAdmin } from '../config/supabase';

export interface InventoryItem {
  id: string;
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level?: number | null;
  updated_at?: string;
}

export interface InventoryReservation {
  id: string;
  variant_id: string;
  order_id?: string | null;
  reservation_key?: string | null;
  quantity: number;
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED';
  created_at?: string;
  expires_at?: string | null;
}

export class InventoryService {
  private tableName = 'inventory';
  private reservationTable = 'inventory_reservations';

  async checkAvailability(variantId: string, requestedQuantity: number): Promise<boolean> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('quantity, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}`)
        .single();

      if (!data) return false;
      const available = data.quantity - data.reserved_quantity;
      return available >= requestedQuantity;
    } catch {
      return false;
    }
  }

  async reserveStock(
    variantId: string,
    quantityToReserve: number,
    reservationKey?: string
  ): Promise<{ success: boolean; available: number }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, quantity, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}`)
        .single();

      if (!data) return { success: false, available: 0 };
      const available = data.quantity - data.reserved_quantity;
      if (available < quantityToReserve) {
        return { success: false, available };
      }

      const newReserved = data.reserved_quantity + quantityToReserve;
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) return { success: false, available };

      // Optional audit in inventory_reservations table
      if (reservationKey) {
        try {
          await supabaseAdmin.from(this.reservationTable).insert({
            variant_id: variantId,
            order_id: reservationKey,
            reservation_key: reservationKey,
            quantity: quantityToReserve,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          });
        } catch {
          // Table missing or optional constraint fallback
        }
      }

      return { success: true, available: available - quantityToReserve };
    } catch {
      return { success: false, available: 0 };
    }
  }

  async releaseStock(
    variantId: string,
    quantityToRelease: number,
    reservationKey?: string
  ): Promise<{ success: boolean }> {
    try {
      const { data } = await supabaseAdmin
        .from(this.tableName)
        .select('id, reserved_quantity')
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}`)
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

      if (reservationKey) {
        try {
          await supabaseAdmin
            .from(this.reservationTable)
            .update({ status: 'RELEASED' })
            .or(`order_id.eq.${reservationKey},reservation_key.eq.${reservationKey}`)
            .eq('variant_id', variantId);
        } catch {
          // Table missing fallback
        }
      }

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
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}`)
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
        .or(`variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}`)
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
