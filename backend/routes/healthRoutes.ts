import { Router } from 'express';

const router = Router();

// Health check endpoint - shows configuration (safe for production)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    config: {
      cors_origin: process.env.CORS_ORIGIN || 'NOT SET',
      frontend_url: process.env.FRONTEND_URL || 'NOT SET',
      backend_url: process.env.BACKEND_URL || 'NOT SET',
      database_connected: !!process.env.DATABASE_URL,
      jwt_configured: !!process.env.JWT_SECRET,
      node_version: process.version,
    }
  });
});

export default router;
