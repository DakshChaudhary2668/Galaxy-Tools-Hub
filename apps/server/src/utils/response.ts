import { Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '@galaxy/utils';

interface SuccessOptions<T> {
  data: T;
  message?: string;
  statusCode?: number;
  meta?: {
    nextCursor?: string | null;
    hasMore?: boolean;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T>): void {
  const { data, message = 'Success', statusCode = 200, meta } = options;
  const requestId = (res.req as unknown as { requestId?: string }).requestId || '';
  const responsePayload = createSuccessResponse(
    data,
    message,
    requestId,
    meta?.nextCursor,
    meta?.hasMore,
    meta?.total,
    meta?.page,
    meta?.limit,
    meta?.totalPages
  );
  res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]> | string[]
): void {
  const requestId = (res.req as unknown as { requestId?: string }).requestId || '';
  const responsePayload = createErrorResponse(message, errors, requestId);
  res.status(statusCode).json(responsePayload);
}
