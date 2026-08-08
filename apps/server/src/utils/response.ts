import { Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '@galaxy/utils';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  nextCursor?: string | null,
  hasMore?: boolean,
  totalCount?: number
): void {
  const requestId = (res.req as unknown as { requestId?: string }).requestId || '';
  const responsePayload = createSuccessResponse(data, message, requestId, nextCursor, hasMore, totalCount);
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
