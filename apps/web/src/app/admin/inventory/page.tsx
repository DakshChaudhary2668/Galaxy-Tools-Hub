'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Boxes,
  RotateCcw
} from 'lucide-react';
import {
  getAdminInventory,
  adjustAdminInventory,
  AdminInventoryItem
} from '../../../services/inventory.service';
import styles from './Inventory.module.scss';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [editQtyMap, setEditQtyMap] = useState<Record<string, number>>({});

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminInventory({
        search: search || undefined,
        filter: filter !== 'all' ? filter : undefined
      });
      if (res && res.data) {
        setItems(res.data);
        const qtyMap: Record<string, number> = {};
        res.data.forEach((i) => {
          qtyMap[i.id] = i.quantity;
        });
        setEditQtyMap(qtyMap);
      } else {
        setItems([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve inventory records.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleUpdateStock = async (item: AdminInventoryItem) => {
    const newQty = editQtyMap[item.id];
    if (typeof newQty !== 'number' || newQty < 0) {
      setActionNotice({ type: 'error', message: 'Stock quantity must be a non-negative number.' });
      return;
    }

    setAdjustingId(item.id);
    try {
      await adjustAdminInventory(item.id, { quantity: newQty });
      setActionNotice({
        type: 'success',
        message: `Updated stock for "${item.productName}" to ${newQty} units.`
      });
      fetchInventory();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock quantity.';
      setActionNotice({ type: 'error', message: msg });
    } finally {
      setAdjustingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <span className={`${styles.badge} ${styles.inStock}`}>In Stock</span>;
      case 'LOW_STOCK':
        return <span className={`${styles.badge} ${styles.lowStock}`}>Low Stock</span>;
      case 'OUT_OF_STOCK':
      default:
        return <span className={`${styles.badge} ${styles.outOfStock}`}>Out of Stock</span>;
    }
  };

  return (
    <div className={styles.inventoryContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Inventory & Stock Operations</h1>
          <p>Real-time warehouse inventory tracking, reserved allocations, and reorder levels.</p>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            backgroundColor: actionNotice.type === 'success' ? '#DCFCE7' : '#FEF2F2',
            border: `1px solid ${actionNotice.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
            color: actionNotice.type === 'success' ? '#16A34A' : '#991B1B',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterSelectGroup}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter inventory stock status"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; Reorder level)</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
            title="Reset Filters"
            style={{
              padding: '8px 12px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Tracking Warehouse Stock...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Inventory</h3>
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.stateBox}>
            <Boxes size={48} color="#94A3B8" />
            <h3>No Inventory Matches Found</h3>
            <p>No products match your current search query or filter criteria.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Total Physical</th>
                  <th>Reserved in Orders</th>
                  <th>Available to Sell</th>
                  <th>Reorder Level</th>
                  <th>Stock Status</th>
                  <th>Quick Adjustment</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0F172A' }}>{item.productName}</strong>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                          SKU: {item.sku} • {item.brand}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{item.quantity} units</td>
                    <td style={{ color: item.reservedQuantity > 0 ? '#2563EB' : '#94A3B8', fontWeight: 600 }}>
                      {item.reservedQuantity} reserved
                    </td>
                    <td style={{ fontWeight: 800, color: item.availableStock <= 0 ? '#DC2626' : '#16A34A' }}>
                      {item.availableStock} units
                    </td>
                    <td style={{ color: '#64748B' }}>{item.reorderLevel} units</td>
                    <td>{getStatusBadge(item.stockStatus)}</td>
                    <td>
                      <div className={styles.stockInputGroup}>
                        <input
                          type="number"
                          value={editQtyMap[item.id] ?? item.quantity}
                          onChange={(e) =>
                            setEditQtyMap((prev) => ({
                              ...prev,
                              [item.id]: Number(e.target.value)
                            }))
                          }
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(item)}
                          disabled={adjustingId === item.id}
                        >
                          {adjustingId === item.id ? '...' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
