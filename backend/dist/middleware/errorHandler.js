"use strict";
// backend/middleware/errorHandler.ts
// Global Error Handling Middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    message;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(error, req, res, next) {
    console.error('Error:', error);
    // Zod validation error
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
        });
        return;
    }
    // AppError
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.code || 'ERROR',
            message: error.message,
        });
        return;
    }
    // Generic error
    res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.default = errorHandler;
