import dotenv from 'dotenv';
import express from 'express';
import setupAppMiddleware from './config/app';
import authRoutes from './routes/authRoutes';
import businessRoutes from './routes/businessRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import documentRoutes from './routes/documentRoutes';
import quoteRoutes from './routes/quoteRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { authMiddleware } from './middleware/auth';
import errorHandler from './middleware/errorHandler';
import { testDatabaseConnection } from './config/database';

dotenv.config({ path: './.env' });

const app = express();
setupAppMiddleware(app);

app.use('/api/auth', authRoutes);
app.use('/api/business', authMiddleware, businessRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/quotes', authMiddleware, quoteRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

app.use(errorHandler);

const port = parseInt(process.env.PORT || '8000', 10);

(async () => {
  const connected = await testDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`✅ Backend started at http://localhost:${port}`);
  });
})();
