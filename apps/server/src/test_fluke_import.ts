import assert from 'node:assert/strict';
import { PricingType } from '@galaxy/constants';
import { buildAuthoritativeCheckout, CheckoutInventory, CheckoutProduct } from './services/payment.service';

const product = (id: string, weight_grams: number | null, price = 100): CheckoutProduct => ({
  id,
  name: id,
  sku: id,
  hsn_code: '9030',
  tax_rate: 18,
  price,
  pricing_type: PricingType.FIXED,
  minimum_order_quantity: 1,
  weight_grams,
  is_active: true,
  is_purchasable: true
});
const stock = (...ids: string[]): CheckoutInventory[] => ids.map((id) => ({ product_id: id, quantity: 20, reserved_quantity: 0 }));
const checkout = (items: { productId: string; quantity: number }[], products: CheckoutProduct[]) => buildAuthoritativeCheckout(items, products, stock(...products.map((p) => p.id)));

assert.equal(checkout([{ productId: 'a', quantity: 1 }], [product('a', 999)]).shippingAmount, 60);
assert.equal(checkout([{ productId: 'a', quantity: 1 }], [product('a', 1000)]).shippingAmount, 60);
assert.equal(checkout([{ productId: 'a', quantity: 1 }], [product('a', 1001)]).shippingAmount, 120);
assert.equal(checkout([{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 1 }], [product('a', 600), product('b', 500)]).shippingAmount, 120);
assert.equal(checkout([{ productId: 'a', quantity: 2 }], [product('a', 600)]).shippingAmount, 120);

const fluke101 = checkout([{ productId: 'fluke-101', quantity: 1 }], [product('fluke-101', 160, 3577.5)]);
assert.equal(fluke101.subtotal, 3577.5);
assert.equal(fluke101.taxAmount, 643.95);
assert.equal(fluke101.shippingAmount, 60);
assert.equal(fluke101.totalAmount, 4281.45);
assert.equal(fluke101.amountInPaise, 428145);

assert.throws(
  () => checkout([{ productId: 'unknown', quantity: 1 }], [product('unknown', null)]),
  /Shipping weight is unavailable/
);

console.log('Fluke catalogue pricing and freight tests passed');
