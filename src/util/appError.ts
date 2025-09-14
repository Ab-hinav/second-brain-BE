/**
 * Domain error with HTTP status, code, and optional details/title.
 */
export class AppError extends Error {
  code: string;
  statusCode: number;
  title?: string;
  details?: unknown;

  constructor(code: string, statusCode: number, message: string, details?: unknown, title?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.title = title;
  }

  // Convenience constructors for common HTTP errors
  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(code, 400, message, details, 'Bad Request');
  }
  static unauthorized(code: string, message: string, details?: unknown) {
    return new AppError(code, 401, message, details, 'Unauthorized');
  }
  static forbidden(code: string, message: string, details?: unknown) {
    return new AppError(code, 403, message, details, 'Forbidden');
  }
  static notFound(code: string, message: string, details?: unknown) {
    return new AppError(code, 404, message, details, 'Not Found');
  }
  static conflict(code: string, message: string, details?: unknown) {
    return new AppError(code, 409, message, details, 'Conflict');
  }
  static internal(code: string, message: string, details?: unknown) {
    return new AppError(code, 500, message, details, 'Internal Server Error');
  }
}
