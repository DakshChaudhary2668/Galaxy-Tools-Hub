// Frontend UI constants
export const PAGINATION_DEFAULT_LIMIT = 20;

export const STOCK_STATUS = {
  IN_STOCK:      'IN_STOCK',
  LOW_STOCK:     'LOW_STOCK',
  SPECIAL_ORDER: 'SPECIAL_ORDER',
} as const;

// ponytail: stock_status thresholds derived client-side until backend adds enum column
export const STOCK_THRESHOLDS = {
  LOW_STOCK_BELOW: 5,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES:   5 * 1024 * 1024, // 5MB — matches server spec
  ACCEPTED_TYPES:   '.jpg,.jpeg,.png,.pdf',
  ACCEPTED_MIME:    ['image/jpeg', 'image/png', 'application/pdf'],
} as const;

export const UTR_VALIDATION = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 22,
} as const;

export const GST_RATE = 0.18; // 18% — from API spec
