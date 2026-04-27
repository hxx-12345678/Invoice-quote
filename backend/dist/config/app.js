"use strict";
// backend/config/app.ts
// Express Application Configuration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAppMiddleware = setupAppMiddleware;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = require("express-rate-limit");
function setupAppMiddleware(app) {
    // Trust proxy for Render and other reverse proxies
    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS configuration
    const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    app.use((0, cors_1.default)({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
    else {
        app.use((0, morgan_1.default)('combined'));
    }
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
    // Rate limiting (exclude auth routes)
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: {
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: 'Too many requests from this IP, please try again later.'
        },
        skip: (req) => {
            // Don't rate limit health checks and local requests
            return req.path === '/health' || req.path === '/api/health';
        },
        keyGenerator: (req) => {
            // For production, use X-Forwarded-For header (set by Render proxy)
            if (process.env.NODE_ENV === 'production') {
                return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
            }
            return req.ip || 'unknown';
        },
    });
    app.use('/api/', limiter);
    // Separate limiter for auth with higher limit
    const authLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 attempts per 15 minutes for testing
        message: {
            success: false,
            error: 'TOO_MANY_AUTH_ATTEMPTS',
            message: 'Too many authentication attempts. Please try again after 15 minutes.'
        },
        keyGenerator: (req) => {
            // For production, use X-Forwarded-For header (set by Render proxy)
            if (process.env.NODE_ENV === 'production') {
                return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
            }
            return req.ip || 'unknown';
        },
    });
    app.use('/api/auth', authLimiter);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
}
exports.default = setupAppMiddleware;
