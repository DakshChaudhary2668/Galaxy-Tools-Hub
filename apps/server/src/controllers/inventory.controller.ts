import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';

export async function getInventoryList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string;
    const filter = req.query.filter as string; // 'low_stock' | 'out_of_stock' | 'in_stock' | 'all'

    // Fetch inventory join products
    const [invRes, prodRes] = await Promise.allSettled([
      supabaseAdmin.from('inventory').select('*').order('updated_at', { ascending: false }),
      supabaseAdmin.from('products').select('id, name, sku, brand, price')
    ]);

    const inventory = invRes.status === 'fulfilled' && invRes.value.data ? invRes.value.data : [];
    const products = prodRes.status === 'fulfilled' && prodRes.value.data ? prodRes.value.data : [];

    const prodMap: Record<string, any> = {};
    for (const p of products) {
      if (p.id) prodMap[p.id] = p;
    }

    let items = inventory.map((inv) => {
      const p = prodMap[inv.product_id] || prodMap[inv.variant_id] || {};
      const stock = (inv.quantity || 0) - (inv.reserved_quantity || 0);
      const reorderLevel = inv.reorder_level || 5;

      let stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' = 'IN_STOCK';
      if (stock <= 0) stockStatus = 'OUT_OF_STOCK';
      else if (stock <= reorderLevel) stockStatus = 'LOW_STOCK';

      return {
        id: inv.id,
        productId: inv.product_id || inv.variant_id || inv.id,
        productName: p.name || `Industrial Tool #${inv.id.slice(0, 6)}`,
        sku: p.sku || inv.variant_id || 'GENERIC-SKU',
        brand: p.brand || 'Galaxy Tools',
        quantity: inv.quantity || 0,
        reservedQuantity: inv.reserved_quantity || 0,
        availableStock: Math.max(0, stock),
        reorderLevel,
        stockStatus,
        updatedAt: inv.updated_at || new Date().toISOString()
      };
    });

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s)
      );
    }

    if (filter && filter !== 'all') {
      if (filter === 'low_stock') {
        items = items.filter((i) => i.stockStatus === 'LOW_STOCK');
      } else if (filter === 'out_of_stock') {
        items = items.filter((i) => i.stockStatus === 'OUT_OF_STOCK');
      } else if (filter === 'in_stock') {
        items = items.filter((i) => i.stockStatus === 'IN_STOCK');
      }
    }

    sendSuccess(res, {
      data: items,
      message: 'Inventory items retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustInventoryStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { quantity, reorderLevel } = req.body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (typeof quantity === 'number') {
      updates.quantity = Math.max(0, quantity);
    }
    if (typeof reorderLevel === 'number') {
      updates.reorder_level = Math.max(0, reorderLevel);
    }

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    sendSuccess(res, {
      data,
      message: 'Inventory stock level adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
}
