'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Lock,
  CreditCard,
  AlertCircle,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { AnnouncementBar } from '../../components/AnnouncementBar/AnnouncementBar';
import { Header } from '../../components/Header/Header';
import { CategoryNav } from '../../components/CategoryNav/CategoryNav';
import { Footer } from '../../components/Footer/Footer';
import { CartDrawer } from '../../components/CartDrawer/CartDrawer';
import { useCartStore } from '../../store/useCartStore';
import { apiClient } from '../../services/api';
import styles from './Checkout.module.scss';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  shippingName: string;
  shippingPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

interface FormErrors {
  [key: string]: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    shippingName: '',
    shippingPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [sameAsContact, setSameAsContact] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Load Razorpay Script dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Pricing calculations matching /cart logic
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price || 0) * item.quantity,
    0
  );

  const shippingThreshold = 50000;
  const shippingRate = 500;
  const shipping = items.length === 0 || subtotal >= shippingThreshold ? 0 : shippingRate;
  const gstAmount = Math.round((subtotal * 18) / 118);
  const grandTotal = subtotal + shipping;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-IN').format(amount);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (sameAsContact) {
        if (name === 'fullName') next.shippingName = value;
        if (name === 'phone') next.shippingPhone = value;
      }
      return next;
    });

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Contact Validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }

    // Shipping Validation
    const shippingNameVal = sameAsContact ? formData.fullName : formData.shippingName;
    const shippingPhoneVal = sameAsContact ? formData.phone : formData.shippingPhone;

    if (!shippingNameVal.trim()) newErrors.shippingName = 'Recipient name is required';
    if (!shippingPhoneVal.trim()) {
      newErrors.shippingPhone = 'Recipient phone number is required';
    } else if (shippingPhoneVal.replace(/\D/g, '').length < 10) {
      newErrors.shippingPhone = 'Enter a valid 10-digit recipient phone number';
    }

    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    const pincodeDigits = formData.pincode.replace(/\D/g, '');
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (pincodeDigits.length !== 6) {
      newErrors.pincode = 'Enter a valid 6-digit Indian pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setPaymentError(null);

    if (items.length === 0) {
      setPaymentError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Prepare checkout payload
      const checkoutPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          category: item.product.category,
          sku: item.product.sku || item.product.id
        })),
        contact: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        },
        shipping: {
          fullName: (sameAsContact ? formData.fullName : formData.shippingName).trim(),
          phone: (sameAsContact ? formData.phone : formData.shippingPhone).trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim()
        }
      };

      // 2. Call backend to create draft order + Razorpay order
      const res = await apiClient.post<{
        data: {
          orderId: string;
          orderNumber: string;
          razorpayOrderId: string;
          amountInPaise: number;
          currency: string;
          keyId: string;
          contact: { name: string; email: string; phone: string };
        };
      }>('/payments/checkout', checkoutPayload);

      const orderData = res.data;

      if (!orderData?.razorpayOrderId) {
        throw new Error('Failed to create payment session. Please try again.');
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your connection.');
      }

      // 3. Open Razorpay Checkout
      const rzpOptions = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Galaxy Tools Hub',
        description: `Order #${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: orderData.contact.name,
          email: orderData.contact.email,
          contact: orderData.contact.phone
        },
        theme: {
          color: '#F5C710'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentError('Payment was cancelled. You can retry anytime.');
          }
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment signature on backend
            await apiClient.post('/payments/verify', {
              orderId: orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            // 5. Clear cart and redirect to order success page
            clearCart();
            router.push(`/order-success?orderId=${orderData.orderId}`);
          } catch (err: unknown) {
            setIsProcessing(false);
            const msg = err instanceof Error ? err.message : 'Payment verification failed.';
            setPaymentError(`${msg} Please contact support if your account was debited.`);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(rzpOptions);
      razorpayInstance.on('payment.failed', (response: unknown) => {
        setIsProcessing(false);
        const failureData = response as { error?: { description?: string } };
        setPaymentError(
          failureData?.error?.description || 'Payment failed. Please try again with a different payment method.'
        );
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'An error occurred while creating your order.';
      setPaymentError(msg);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <AnnouncementBar />
      <Header />
      <CategoryNav />

      <main className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/cart">Shopping Cart</Link>
          <span>›</span>
          <strong>Checkout</strong>
        </div>

        {/* Title */}
        <div className={styles.titleRow}>
          <h1>
            <Lock size={24} />
            <span>Secure Checkout</span>
          </h1>
          <div className={styles.secureBadge}>
            <ShieldCheck size={16} />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {paymentError && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{paymentError}</span>
          </div>
        )}

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className={styles.emptyCard}>
            <ShoppingBag size={64} strokeWidth={1.5} color="#999999" />
            <h2>Your cart is empty</h2>
            <p>You need at least one item in your cart to proceed with checkout.</p>
            <Link href="/" className={styles.shopNowBtn}>
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          /* Checkout Grid */
          <div className={styles.checkoutLayout}>
            {/* Left Column: Forms */}
            <div className={styles.formSection}>
              {/* Step 1: Contact Info */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.stepNumber}>1</span>
                  <h2>Contact Information</h2>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={errors.fullName ? styles.errorInput : ''}
                    />
                    {errors.fullName && (
                      <span className={styles.errorMessage}>{errors.fullName}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? styles.errorInput : ''}
                    />
                    {errors.email && (
                      <span className={styles.errorMessage}>{errors.email}</span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Mobile Phone Number *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? styles.errorInput : ''}
                  />
                  {errors.phone && (
                    <span className={styles.errorMessage}>{errors.phone}</span>
                  )}
                </div>
              </section>

              {/* Step 2: Shipping Address */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.stepNumber}>2</span>
                  <h2>Delivery Address</h2>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={sameAsContact}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsContact(checked);
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            shippingName: prev.fullName,
                            shippingPhone: prev.phone
                          }));
                        }
                      }}
                    />
                    <span>Recipient name & phone same as contact details</span>
                  </label>
                </div>

                {!sameAsContact && (
                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label htmlFor="shippingName">Recipient Name *</label>
                      <input
                        id="shippingName"
                        name="shippingName"
                        type="text"
                        placeholder="Recipient full name"
                        value={formData.shippingName}
                        onChange={handleInputChange}
                        className={errors.shippingName ? styles.errorInput : ''}
                      />
                      {errors.shippingName && (
                        <span className={styles.errorMessage}>{errors.shippingName}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="shippingPhone">Recipient Phone *</label>
                      <input
                        id="shippingPhone"
                        name="shippingPhone"
                        type="tel"
                        placeholder="Recipient 10-digit phone"
                        maxLength={10}
                        value={formData.shippingPhone}
                        onChange={handleInputChange}
                        className={errors.shippingPhone ? styles.errorInput : ''}
                      />
                      {errors.shippingPhone && (
                        <span className={styles.errorMessage}>{errors.shippingPhone}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="addressLine1">Flat / House No. / Building / Street *</label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    placeholder="e.g. Unit 402, Galaxy Heights, Industrial Area"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className={errors.addressLine1 ? styles.errorInput : ''}
                  />
                  {errors.addressLine1 && (
                    <span className={styles.errorMessage}>{errors.addressLine1}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="addressLine2">
                    Apartment, Suite, Landmark <span className={styles.optional}>(Optional)</span>
                  </label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    type="text"
                    placeholder="e.g. Near Metro Station Phase 2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.grid3}>
                  <div className={styles.formGroup}>
                    <label htmlFor="city">City / District *</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={errors.city ? styles.errorInput : ''}
                    />
                    {errors.city && (
                      <span className={styles.errorMessage}>{errors.city}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="state">State *</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={errors.state ? styles.errorInput : ''}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <span className={styles.errorMessage}>{errors.state}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="pincode">PIN Code *</label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      placeholder="6-digit PIN"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={errors.pincode ? styles.errorInput : ''}
                    />
                    {errors.pincode && (
                      <span className={styles.errorMessage}>{errors.pincode}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Step 3: Payment Method Info */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <span className={styles.stepNumber}>3</span>
                  <h2>Payment Method</h2>
                </div>

                <div className={styles.paymentBanner}>
                  <CreditCard className={styles.razorpayIcon} size={28} color="#111111" />
                  <div className={styles.paymentInfo}>
                    <h4>Razorpay Secure Checkout</h4>
                    <p>UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking & Wallets supported.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary */}
            <aside className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>
                <span>Order Summary</span>
                <span className={styles.itemCount}>
                  {items.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
              </h2>

              {/* Items List */}
              <div className={styles.itemsList}>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className={styles.summaryItem}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      className={styles.itemThumb}
                    />
                    <div className={styles.itemDetails}>
                      <div className={styles.itemName} title={product.name}>
                        {product.name}
                      </div>
                      <div className={styles.itemMeta}>
                        Qty: {quantity} × {product.currency}{formatPrice(product.price)}
                      </div>
                    </div>
                    <div className={styles.itemTotal}>
                      {product.currency}{formatPrice(product.price * quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Item Subtotal</span>
                  <span>₹{formatPrice(subtotal)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>GST (18% Included)</span>
                  <span>₹{formatPrice(gstAmount)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Shipping Fee</span>
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
                type="button"
                className={styles.payBtn}
                onClick={handlePlaceOrder}
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Place Order & Pay ₹{formatPrice(grandTotal)}</span>
                  </>
                )}
              </button>

              <Link href="/cart" className={styles.returnCartLink}>
                <ArrowLeft size={14} />
                <span>Return to Cart</span>
              </Link>

              {/* Trust Badges */}
              <div className={styles.trustBadgesBox}>
                <div className={styles.trustItem}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span>GST Invoice with Input Tax Credit</span>
                </div>
                <div className={styles.trustItem}>
                  <Truck size={16} color="#16A34A" />
                  <span>Safe & Insured Doorstep Delivery</span>
                </div>
                <div className={styles.trustItem}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>Official Manufacturer Warranty</span>
                </div>
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
