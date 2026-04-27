import { Response } from 'express';

export function success(res: Response, data: unknown, message = 'Success') {
  return res.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

export function fail(res: Response, statusCode: number, error: string, message?: string) {
  return res.status(statusCode).json({
    success: false,
    error,
    message: message || error,
    timestamp: new Date().toISOString(),
  });
}
