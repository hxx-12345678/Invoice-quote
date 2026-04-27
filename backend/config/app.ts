// backend/config/app.ts
// Express Application Configuration

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

export function setupAppMiddleware(app: Express): void {
  // Trust proxy for Render and other reverse proxies
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Logging middleware
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Rate limiting (exclude auth routes)
  const limiter = rateLimit({
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
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
      }
      return req.ip || 'unknown';
    },
  });
  app.use('/api/', limiter);
  // Separate limiter for auth with higher limit
  const authLimiter = rateLimit({
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
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
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

export default setupAppMiddleware;
