import { ApiResponse, ApiErrorResponse } from '@galaxy/types';

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function encodeCursor(cursorObj: Record<string, unknown>): string {
  return btoa(JSON.stringify(cursorObj));
}

export function decodeCursor<T = Record<string, unknown>>(cursorStr: string): T | null {
  try {
    const decoded = atob(cursorStr);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function createSuccessResponse<T>(
  data: T,
  message = 'Success',
  requestId = '',
  nextCursor?: string | null,
  hasMore?: boolean,
  total?: number,
  page?: number,
  limit?: number,
  totalPages?: number
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta: {
      requestId,
      page,
      limit,
      total,
      totalPages,
      nextCursor,
      hasMore
    }
  };
}

export function createErrorResponse(
  message: string,
  errors?: Record<string, string[]> | string[],
  requestId = ''
): ApiErrorResponse {
  return {
    success: false,
    message,
    errors,
    meta: {
      requestId
    }
  };
}
