"use strict";
// backend/middleware/auth.ts
// Authentication & Authorization Middleware
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function authMiddleware(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'No token provided',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const payload = decoded;
        req.userId = payload.userId || payload.id || undefined;
        req.user = { id: payload.id || payload.userId || '', email: payload.email || '' };
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
        });
    }
}
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return null;
    return parts[1];
}
exports.default = authMiddleware;
