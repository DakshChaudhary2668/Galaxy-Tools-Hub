'use client';

import React, { useEffect, useState } from 'react';
import { CouponDto } from '@galaxy/types';
import { Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { createAdminCoupon, deleteAdminCoupon, getAdminCoupons, updateAdminCoupon } from '@/services/coupon.service';
import styles from '../products/Products.module.scss';

type CouponForm = {
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  minimum_order_amount: string;
  maximum_discount_amount: string;
  usage_limit: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

const EMPTY_FORM: CouponForm = {
  code: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', minimum_order_amount: '',
  maximum_discount_amount: '', usage_limit: '', starts_at: '', expires_at: '', is_active: true
};

const dateInput = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setCoupons(await getAdminCoupons()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load coupons.'); }
  };

  useEffect(() => { load(); }, []);

  const edit = (coupon: CouponDto) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      minimum_order_amount: coupon.minimum_order_amount == null ? '' : String(coupon.minimum_order_amount),
      maximum_discount_amount: coupon.maximum_discount_amount == null ? '' : String(coupon.maximum_discount_amount),
      usage_limit: coupon.usage_limit == null ? '' : String(coupon.usage_limit),
      starts_at: dateInput(coupon.starts_at),
      expires_at: dateInput(coupon.expires_at),
      is_active: coupon.is_active
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setError(null); };
  const optionalNumber = (value: string) => value === '' ? null : Number(value);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      minimum_order_amount: optionalNumber(form.minimum_order_amount),
      maximum_discount_amount: form.discount_type === 'PERCENTAGE' ? optionalNumber(form.maximum_discount_amount) : null,
      usage_limit: optionalNumber(form.usage_limit),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active
    };
    try {
      if (editingId) await updateAdminCoupon(editingId, payload);
      else await createAdminCoupon(payload);
      await load();
      closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save coupon.'); }
    finally { setBusy(false); }
  };

  const remove = async (coupon: CouponDto) => {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    try { await deleteAdminCoupon(coupon.id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete coupon.'); }
  };

  return <div className={styles.productsContainer}>
    <div className={styles.headerRow}>
      <div className={styles.titleBlock}><h1>Coupons</h1><p>Manage coupon definitions. Checkout redemption is not enabled yet.</p></div>
      <button className={styles.primaryBtn} onClick={() => setShowForm(true)}><Plus size={16} /> Add Coupon</button>
    </div>
    {error && <div style={{ color: '#991B1B', background: '#FEF2F2', padding: 12, borderRadius: 6 }}>{error}</div>}

    {showForm && <form onSubmit={save} className={styles.formCard} style={{ maxWidth: 760 }}>
      <div className={styles.cardHeader}><h2>{editingId ? 'Edit Coupon' : 'Add Coupon'}</h2><button type="button" onClick={closeForm}><X size={18} /></button></div>
      <div className={styles.grid2}>
        <div className={styles.formGroup}><label>Code *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={50} required /></div>
        <div className={styles.formGroup}><label>Discount Type *</label><select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as CouponForm['discount_type'] })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></div>
        <div className={styles.formGroup}><label>Discount Value *</label><input type="number" min="0.01" max={form.discount_type === 'PERCENTAGE' ? 100 : undefined} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required /></div>
        <div className={styles.formGroup}><label>Minimum Order</label><input type="number" min="0" step="0.01" value={form.minimum_order_amount} onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })} /></div>
        {form.discount_type === 'PERCENTAGE' && <div className={styles.formGroup}><label>Maximum Discount</label><input type="number" min="0" step="0.01" value={form.maximum_discount_amount} onChange={(e) => setForm({ ...form, maximum_discount_amount: e.target.value })} /></div>}
        <div className={styles.formGroup}><label>Overall Usage Limit</label><input type="number" min="1" step="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} /></div>
        <div className={styles.formGroup}><label>Starts At</label><input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
        <div className={styles.formGroup}><label>Expires At</label><input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
      </div>
      <div className={styles.formGroup}><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
      <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
      <button className={styles.primaryBtn} disabled={busy}><Save size={16} /> {busy ? 'Saving...' : 'Save Coupon'}</button>
    </form>}

    <div className={styles.tableCard}>
      {coupons.length === 0 ? <div className={styles.stateBox}><Tag size={40} /><h3>No coupons created</h3><p>The production coupons table is intentionally empty.</p></div> :
        <div className={styles.tableWrapper}><table className={styles.productsTable}><thead><tr><th>Code</th><th>Discount</th><th>Usage</th><th>Status</th><th>Window</th><th>Actions</th></tr></thead><tbody>
          {coupons.map((coupon) => <tr key={coupon.id}><td><strong>{coupon.code}</strong></td><td>{coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}</td><td>{coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td><td><button type="button" onClick={() => updateAdminCoupon(coupon.id, { is_active: !coupon.is_active }).then(load)}>{coupon.is_active ? 'Active' : 'Inactive'}</button></td><td>{coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString() : 'Any'} – {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}</td><td><button type="button" onClick={() => edit(coupon)}>Edit</button> <button type="button" onClick={() => remove(coupon)}><Trash2 size={14} /></button></td></tr>)}
        </tbody></table></div>}
    </div>
  </div>;
}
