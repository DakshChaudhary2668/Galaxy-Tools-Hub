import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ProductView } from '@galaxy/types';

export interface CartItem {
  product: ProductView;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (product: ProductView) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: (open?: boolean) => void;
  getTotalItems: () => number;
}

interface PersistedCartState {
  items: CartItem[];
}

function compactProduct(product: ProductView): ProductView {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category_id: product.category_id,
    category: product.category,
    price: product.price,
    tax_rate: product.tax_rate,
    weight_grams: product.weight_grams,
    compare_at_price: product.compare_at_price,
    image: product.image,
    image_url: product.image_url,
    currency: product.currency
  };
}

function sanitizePersistedItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const seenProductIds = new Set<string>();
  const items: CartItem[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;

    const rawItem = candidate as { product?: unknown; quantity?: unknown };
    if (!rawItem.product || typeof rawItem.product !== 'object') continue;

    const product = rawItem.product as ProductView;
    const quantity = rawItem.quantity;
    if (
      typeof product.id !== 'string' ||
      typeof product.name !== 'string' ||
      !Number.isInteger(quantity) ||
      (quantity as number) <= 0 ||
      seenProductIds.has(product.id)
    ) {
      continue;
    }

    if (product.price != null && (typeof product.price !== 'number' || !Number.isFinite(product.price))) {
      continue;
    }

    seenProductIds.add(product.id);
    items.push({ product: compactProduct(product), quantity: quantity as number });
  }

  return items;
}

export const useCartStore = create<CartStore>()(
  persist<CartStore, [], [], PersistedCartState>(
    (set, get) => ({
      items: [],
      isOpen: false,
      addToCart: (product: ProductView) => {
        if (!product.id) return;

        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { product: compactProduct(product), quantity: 1 }],
            isOpen: true,
          };
        });
      },
      removeFromCart: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.product.id !== productId),
          }));
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleDrawer: (open?: boolean) => set((state) => ({ isOpen: open ?? !state.isOpen })),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'galaxy-tools-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items.map((item) => ({
          product: compactProduct(item.product),
          quantity: item.quantity
        }))
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        items: sanitizePersistedItems((persistedState as PersistedCartState | undefined)?.items)
      }),
      skipHydration: true
    }
  )
);
