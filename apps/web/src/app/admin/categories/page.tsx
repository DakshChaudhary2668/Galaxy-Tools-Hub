'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FolderTree,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryWithProductCount
} from '../../../services/category.service';
import styles from './Categories.module.scss';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithProductCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithProductCount | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategoriesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategories();
      if (Array.isArray(res)) {
        setCategories(res);
      } else if (res && (res as any).data) {
        setCategories((res as any).data);
      } else {
        setCategories([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve categories.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId('');
    setDescription('');
    setImageUrl('');
    setSortOrder('0');
    setIsActive(true);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryWithProductCount) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setParentId(cat.parent_id || '');
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setSortOrder(String(cat.sort_order ?? 0));
    setIsActive(Boolean(cat.is_active));
    setModalError(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('Category name is required.');
      return;
    }

    if (editingCategory && parentId === editingCategory.id) {
      setModalError('A category cannot be its own parent.');
      return;
    }

    setModalSaving(true);

    try {
      const payload = {
        name: name.trim(),
        slug: (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        parent_id: parentId || null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        setActionNotice({ type: 'success', message: `Category "${name}" updated successfully.` });
      } else {
        await createCategory(payload);
        setActionNotice({ type: 'success', message: `Category "${name}" created successfully.` });
      }

      setModalOpen(false);
      fetchCategoriesList();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save category.';
      setModalError(msg);
    } finally {
      setModalSaving(false);
    }
  };

  const handleToggleActive = async (cat: CategoryWithProductCount) => {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      setActionNotice({
        type: 'success',
        message: `Category "${cat.name}" is now ${!cat.is_active ? 'Active' : 'Inactive'}.`
      });
      fetchCategoriesList();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status.';
      setActionNotice({ type: 'error', message: msg });
    }
  };

  const handleDelete = async (cat: CategoryWithProductCount) => {
    if (cat.product_count && cat.product_count > 0) {
      alert(`Cannot delete category "${cat.name}" because ${cat.product_count} product(s) are assigned to it. Please reassign or delete these products first, or deactivate the category.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) {
      return;
    }

    try {
      await deleteCategory(cat.id);
      setActionNotice({ type: 'success', message: `Category "${cat.name}" was deleted.` });
      fetchCategoriesList();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category.';
      setActionNotice({ type: 'error', message: msg });
    }
  };

  const getParentCategoryName = (pId?: string | null) => {
    if (!pId) return '-';
    const parent = categories.find((c) => c.id === pId);
    return parent ? parent.name : '-';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const filteredCategories = categories.filter((c) => {
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s);
  });

  return (
    <div className={styles.categoriesContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Category Management</h1>
          <p>Organize testing instruments, measuring equipment, and tool taxonomy.</p>
        </div>

        <button type="button" className={styles.primaryBtn} onClick={openCreateModal}>
          <Plus size={16} />
          <span>Add Category</span>
        </button>
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
            placeholder="Search category name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.stateBox}>
            <Loader2 size={36} className="animate-spin" color="#F5C710" />
            <h3>Loading Categories...</h3>
          </div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={40} color="#DC2626" />
            <h3>Failed to Load Categories</h3>
            <p>{error}</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className={styles.stateBox}>
            <FolderTree size={48} color="#94A3B8" />
            <h3>No Categories Found</h3>
            <p>Create your first category taxonomy for Galaxy Tools Hub.</p>
            <button type="button" className={styles.primaryBtn} onClick={openCreateModal} style={{ marginTop: '10px' }}>
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.categoriesTable}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Parent</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Sort Order</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className={styles.categoryCell}>
                        <div className={styles.thumb}>
                          <Layers size={18} />
                        </div>
                        <div className={styles.details}>
                          <span className={styles.name}>{cat.name}</span>
                          <span className={styles.slug}>/{cat.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>
                      {getParentCategoryName(cat.parent_id)}
                    </td>
                    <td>
                      <span className={styles.productCountBadge}>
                        <Package size={12} />
                        <span>{cat.product_count || 0} products</span>
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${cat.is_active ? styles.active : styles.inactive}`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#64748B' }}>
                      {cat.sort_order ?? 0}
                    </td>
                    <td style={{ color: '#64748B', fontSize: '12px' }}>
                      {formatDate(cat.updated_at || cat.created_at)}
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.edit}`}
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.toggle}`}
                          onClick={() => handleToggleActive(cat)}
                          title={cat.is_active ? 'Deactivate Category' : 'Activate Category'}
                        >
                          {cat.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        </button>

                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.delete}`}
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
                        >
                          <Trash2 size={12} />
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

      {/* Category Create/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? `Edit: ${editingCategory.name}` : 'Add New Category'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                {modalError && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={15} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="catName">Category Name *</label>
                  <input
                    id="catName"
                    type="text"
                    placeholder="e.g. Digital Multimeters"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="catSlug">URL Slug *</label>
                  <input
                    id="catSlug"
                    type="text"
                    placeholder="e.g. digital-multimeters"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="parentCat">Parent Category (Optional)</label>
                  <select
                    id="parentCat"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="catDesc">Description</label>
                  <textarea
                    id="catDesc"
                    placeholder="Category overview and classification notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="catSort">Sort Order (Lowest first)</label>
                  <input
                    id="catSort"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="catActive" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Active and visible in store navigation
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalOpen(false)}
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={modalSaving}
                >
                  {modalSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>{modalSaving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
