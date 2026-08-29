'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import { CartDrawer } from '../../components/CartDrawer/CartDrawer';
import { useCartStore } from '../../store/useCartStore';
import styles from './Cart.module.scss';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart } = useCartStore();

  // Pricing calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );

  const discount = items.reduce((sum, item) => {
    if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
      return sum + (item.product.originalPrice - item.product.price) * item.quantity;
    }
    return sum;
  }, 0);

  // Business Rule: Free shipping for orders >= ₹50,000, else flat ₹500 (or ₹0 if empty)
  const shippingThreshold = 50000;
  const shippingRate = 500;
  const shipping = items.length === 0 || subtotal >= shippingThreshold ? 0 : shippingRate;

  // Estimated GST (18% included in product price)
  const gstAmount = Math.round((subtotal * 18) / 118);

  const grandTotal = subtotal + shipping;

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout');
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN').format(amount);

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        {/* Breadcrumb Navigation */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>›</span>
          <strong>Shopping Cart</strong>
        </div>

        {/* Title Row */}
        <div className={styles.titleRow}>
          <h1>
            <ShoppingBag size={28} />
            <span>Shopping Cart</span>
          </h1>
          {items.length > 0 && (
            <span className={styles.itemBadge}>
              {items.reduce((total, i) => total + i.quantity, 0)} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className={styles.emptyCard}>
            <ShoppingBag size={64} strokeWidth={1.5} color="#999999" />
            <h2>Your cart is empty</h2>
            <p>
              Looks like you haven&apos;t added any industrial tools or equipment to your cart yet.
            </p>
            <Link href="/" className={styles.shopNowBtn}>
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className={styles.cartLayout}>
            {/* Cart Items Section */}
            <div className={styles.cartItemsSection}>
              <div className={styles.tableHeader}>
                <div>Product</div>
                <div>Unit Price</div>
                <div>Quantity</div>
                <div>Subtotal</div>
                <div></div>
              </div>

              {items.map(({ product, quantity }) => {
                const itemSubtotal = product.price * quantity;
                const skuDisplay = product.sku || `SKU: ${product.id.toUpperCase()}`;

                return (
                  <div key={product.id} className={styles.itemRow}>
                    {/* Product Cell */}
                    <div className={styles.productCell}>
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={72}
                        height={72}
                        className={styles.productImg}
                      />
                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>{product.category}</span>
                        <Link href={`/product/${product.id}`} className={styles.productName}>
                          {product.name}
                        </Link>
                        <span className={styles.skuText}>{skuDisplay}</span>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className={styles.priceCell}>
                      {product.currency}{formatPrice(product.price)}
                    </div>

                    {/* Quantity Controls */}
                    <div className={styles.qtyCell}>
                      <div className={styles.qtyControls}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          aria-label={`Decrease quantity of ${product.name}`}
                        >
                          -
                        </button>
                        <span className={styles.qtyVal}>{quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          aria-label={`Increase quantity of ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Item Subtotal */}
                    <div className={styles.subtotalCell}>
                      {product.currency}{formatPrice(itemSubtotal)}
                    </div>

                    {/* Remove Action */}
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}

              {/* Actions Footer */}
              <div className={styles.cartActionsRow}>
                <button
                  className={styles.clearCartBtn}
                  onClick={clearCart}
                  title="Clear all items in cart"
                >
                  <Trash2 size={16} />
                  <span>Clear Shopping Cart</span>
                </button>

                <Link href="/" className={styles.continueShoppingBtn}>
                  <ArrowLeft size={16} />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Order Summary Card */}
            <aside className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span>Total Savings</span>
                    <span>-₹{formatPrice(discount)}</span>
                  </div>
                )}

                <div className={styles.summaryRow}>
                  <span>GST (18% Included)</span>
                  <span>₹{formatPrice(gstAmount)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className={styles.freeShippingText}>FREE</span>
                    ) : (
                      `₹${formatPrice(shipping)}`
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Grand Total</span>
                <span className={styles.totalAmount}>₹{formatPrice(grandTotal)}</span>
              </div>

              <button
                className={styles.checkoutBtn}
                onClick={handleProceedToCheckout}
                disabled={items.length === 0}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <Link href="/" className={styles.continueShoppingBtn} style={{ marginTop: '8px' }}>
                <ArrowLeft size={14} />
                <span>Continue Shopping</span>
              </Link>

              <div className={styles.guaranteeBox}>
                <ShieldCheck size={20} color="#16A34A" />
                <span>100% Genuine Products & Secure Checkout</span>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
