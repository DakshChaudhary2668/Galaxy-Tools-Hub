import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

export async function getInventoryList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string;
    const filter = req.query.filter as string; // 'low_stock' | 'out_of_stock' | 'in_stock' | 'all'

    const [invRes, prodRes] = await Promise.all([
      supabaseAdmin.from('inventory').select('*').order('updated_at', { ascending: false }),
      supabaseAdmin
        .from('products')
        .select('id, name, sku, price, brand:brands!products_brand_id_fkey(name)')
    ]);

    if (invRes.error) throw new AppError('Failed to retrieve inventory', 500);
    if (prodRes.error) throw new AppError('Failed to retrieve inventory product details', 500);

    const inventory = invRes.data || [];
    const products = prodRes.data || [];

    const prodMap: Record<string, any> = {};
    for (const p of products) {
      if (p.id) prodMap[p.id] = p;
    }

    let items = inventory.map((inv) => {
      const p = prodMap[inv.product_id];
      if (!p) throw new AppError(`Product details missing for inventory record ${inv.id}`, 500);

      const brand = Array.isArray(p.brand) ? p.brand[0]?.name : p.brand?.name;
      if (!brand) throw new AppError(`Brand details missing for product ${p.id}`, 500);

      const quantity = inv.quantity ?? 0;
      const reservedQuantity = inv.reserved_quantity ?? 0;
      const stock = quantity - reservedQuantity;
      const reorderLevel = inv.reorder_level ?? 5;

      let stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' = 'IN_STOCK';
      if (stock <= 0) stockStatus = 'OUT_OF_STOCK';
      else if (stock <= reorderLevel) stockStatus = 'LOW_STOCK';

      return {
        id: inv.id,
        productId: inv.product_id,
        productName: p.name,
        sku: p.sku,
        brand,
        price: p.price,
        quantity,
        reservedQuantity,
        availableStock: stock,
        reorderLevel,
        stockStatus,
        updatedAt: inv.updated_at
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

    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
      throw new AppError('Quantity must be a non-negative integer', 400);
    }
    if (reorderLevel !== undefined && (!Number.isInteger(reorderLevel) || reorderLevel < 0)) {
      throw new AppError('Reorder level must be a non-negative integer', 400);
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from('inventory')
      .select('id, quantity, reserved_quantity')
      .eq('id', id)
      .maybeSingle();

    if (currentError) throw new AppError('Failed to retrieve inventory record', 500);
    if (!current) throw new AppError('Inventory record not found', 404);
    if (typeof quantity === 'number' && quantity < current.reserved_quantity) {
      throw new AppError('Quantity cannot be lower than reserved quantity', 409);
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (typeof quantity === 'number') {
      updates.quantity = quantity;
    }
    if (typeof reorderLevel === 'number') {
      updates.reorder_level = reorderLevel;
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
