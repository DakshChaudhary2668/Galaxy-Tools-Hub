type PricedCartItem = {
  product: { price?: number | null; weight_grams?: number | null };
  quantity: number;
};

export function calculateCartTotals(items: PricedCartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);
  const gst = Math.round(subtotal * 18) / 100;
  const totalWeightGrams = items.reduce(
    (sum, item) => sum + (item.product.weight_grams || 0) * item.quantity,
    0
  );
  const hasKnownWeight = items.every(
    (item) => Number.isInteger(item.product.weight_grams) && Number(item.product.weight_grams) > 0
  );
  const freight = items.length === 0 ? 0 : hasKnownWeight ? (totalWeightGrams <= 1_000 ? 60 : 120) : null;

  return {
    subtotal,
    gst,
    freight,
    total: freight === null ? null : subtotal + gst + freight,
    totalWeightGrams,
    hasKnownWeight
  };
}
