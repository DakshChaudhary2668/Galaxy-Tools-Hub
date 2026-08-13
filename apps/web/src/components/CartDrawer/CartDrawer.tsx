'use client';

import React from 'react';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import styles from './CartDrawer.module.scss';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, toggleDrawer, updateQuantity, removeFromCart } = useCartStore();

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const formattedTotal = new Intl.NumberFormat('en-IN').format(totalAmount);

  return (
    <>
      <div className={styles.overlay} onClick={() => toggleDrawer(false)} />
      <div className={styles.drawer} role="dialog" aria-label="Quote Drawer">
        <div className={styles.header}>
          <div className={styles.title}>Quote Request Cart ({items.length})</div>
          <button className={styles.closeBtn} onClick={() => toggleDrawer(false)} aria-label="Close quote drawer">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={48} strokeWidth={1.5} />
              <p>Your quote cart is empty.</p>
            </div>
          ) : (
            <div className={styles.itemList}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} className={styles.item}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={64}
                    height={64}
                    className={styles.itemImg}
                  />
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{product.name}</h4>
                    <p className={styles.itemPrice}>
                      {product.currency}
                      {new Intl.NumberFormat('en-IN').format(product.price)}
                    </p>
                    <div className={styles.qtyControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        -
                      </button>
                      <span className={styles.qtyVal}>{quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span>Est. Total (GST Inc.):</span>
              <span>₹{formattedTotal}</span>
            </div>
            <button className={styles.checkoutBtn}>
              <span>SUBMIT QUOTE REQUEST</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
