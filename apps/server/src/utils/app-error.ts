export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]> | string[];

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]> | string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
