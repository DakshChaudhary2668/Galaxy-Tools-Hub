import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/app-error';

export interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level?: number | null;
  updated_at?: string;
}

export class InventoryService {
  private readonly tableName = 'inventory';

  private requirePositiveInteger(quantity: number, operation: string): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError(`${operation} quantity must be a positive integer`, 400);
    }
  }

  async getInventory(productId: string): Promise<InventoryItem | null> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('id, product_id, quantity, reserved_quantity, reorder_level, updated_at')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw new AppError('Failed to retrieve inventory', 500);
    return data as InventoryItem | null;
  }

  async checkAvailability(productId: string, requestedQuantity: number): Promise<boolean> {
    this.requirePositiveInteger(requestedQuantity, 'Requested');
    const inventory = await this.getInventory(productId);
    if (!inventory) return false;
    return inventory.quantity - inventory.reserved_quantity >= requestedQuantity;
  }

  async reserveStock(
    productId: string,
    quantityToReserve: number,
    reservationKey?: string
  ): Promise<{ success: boolean; available: number }> {
    this.requirePositiveInteger(quantityToReserve, 'Reservation');
    void reservationKey;

    const inventory = await this.getInventory(productId);
    if (!inventory) return { success: false, available: 0 };

    const available = inventory.quantity - inventory.reserved_quantity;
    if (available < quantityToReserve) return { success: false, available };

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update({
        reserved_quantity: inventory.reserved_quantity + quantityToReserve,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .eq('quantity', inventory.quantity)
      .eq('reserved_quantity', inventory.reserved_quantity)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError('Failed to reserve inventory', 500);
    if (!data) throw new AppError('Inventory changed while stock was being reserved; retry the request', 409);
    return { success: true, available: available - quantityToReserve };
  }

  async releaseStock(
    productId: string,
    quantityToRelease: number,
    reservationKey?: string
  ): Promise<{ success: boolean }> {
    this.requirePositiveInteger(quantityToRelease, 'Release');
    void reservationKey;

    const inventory = await this.getInventory(productId);
    if (!inventory) throw new AppError('Inventory record not found', 404);

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update({
        reserved_quantity: Math.max(0, inventory.reserved_quantity - quantityToRelease),
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .eq('reserved_quantity', inventory.reserved_quantity)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError('Failed to release reserved inventory', 500);
    if (!data) throw new AppError('Inventory changed while stock was being released; retry the request', 409);
    return { success: true };
  }

  async decrementStock(productId: string, quantityToDecrement: number): Promise<{ success: boolean }> {
    this.requirePositiveInteger(quantityToDecrement, 'Stock decrement');

    const inventory = await this.getInventory(productId);
    if (!inventory) throw new AppError('Inventory record not found', 404);
    if (inventory.quantity < quantityToDecrement) {
      throw new AppError('Insufficient stock to complete inventory decrement', 409);
    }

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update({
        quantity: inventory.quantity - quantityToDecrement,
        reserved_quantity: Math.max(0, inventory.reserved_quantity - quantityToDecrement),
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .eq('quantity', inventory.quantity)
      .eq('reserved_quantity', inventory.reserved_quantity)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError('Failed to decrement inventory', 500);
    if (!data) throw new AppError('Inventory changed while stock was being decremented; retry the request', 409);
    return { success: true };
  }

  async incrementStock(productId: string, quantityToIncrease: number): Promise<{ success: boolean }> {
    this.requirePositiveInteger(quantityToIncrease, 'Stock increment');

    const inventory = await this.getInventory(productId);
    if (!inventory) throw new AppError('Inventory record not found', 404);

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update({
        quantity: inventory.quantity + quantityToIncrease,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .eq('quantity', inventory.quantity)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError('Failed to increment inventory', 500);
    if (!data) throw new AppError('Inventory changed while stock was being incremented; retry the request', 409);
    return { success: true };
  }

  async increaseStock(productId: string, quantityToIncrease: number): Promise<{ success: boolean }> {
    return this.incrementStock(productId, quantityToIncrease);
  }
}
