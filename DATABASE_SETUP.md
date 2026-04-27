# 🗄️ InvoiceFlow Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- PNPM package manager

## Step-by-Step Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE invoiceflow_db;

# Create user with password
CREATE USER invoiceflow WITH PASSWORD 'invoiceflow';

# Grant privileges
ALTER ROLE invoiceflow WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE invoiceflow_db TO invoiceflow;

# Exit psql
\q
```

### 2. Update Environment Variables

Update `.env.local` with your PostgreSQL connection details:

```env
DATABASE_URL="postgresql://invoiceflow:invoiceflow@localhost:5432/invoiceflow_db?schema=public"
```

---

## 3. Install Dependencies

```bash
cd d:\sangam-enterprise\INVOICE
pnpm install
```

---

## 4. Run Prisma Migrations

Generate Prisma Client:

```bash
pnpm prisma:generate
```

Run migrations to create database schema:

```bash
pnpm prisma:migrate
```

This will:
- Create all tables defined in `prisma/schema.prisma`
- Create indexes for performance
- Set up relationships between tables

---

## 5. Seed Demo Data (Optional)

Populate the database with test data:

```bash
pnpm prisma:seed
```

This creates:
- 1 test user (test@invoiceflow.com / password123)
- 1 sample business profile
- 2 sample customers
- 3 sample products

---

## 6. Verify Setup with Prisma Studio

Launch Prisma Studio to view/edit data:

```bash
pnpm prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can browse all tables and data.

---

## Database Schema Overview

```
Users (Authentication)
├── BusinessProfile (Company Setup)
├── UserSettings (Preferences)
├── Customers
├── Products
├── Documents (Invoices/Quotes/Credit Notes)
│   ├── DocumentItems (Line items)
│   └── Payments
└── Quotes
    ├── QuoteItems
    ├── QuoteVersions (History)
    └── QuoteActivities (Audit log)
```

---

## API Endpoints Available

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Business Profile
- `GET /api/business-profile` - Get profile
- `POST /api/business-profile` - Create profile
- `PUT /api/business-profile` - Update profile

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Documents (Invoices)
- `GET /api/documents` - List all documents
- `POST /api/documents` - Create document
- `GET /api/documents/[id]` - Get document
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document

### Quotes
- `GET /api/quotes` - List all quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/[id]` - Get quote
- `PUT /api/quotes/[id]` - Update quote
- `DELETE /api/quotes/[id]` - Delete quote

---

## Testing the Backend

### 1. Start Development Server

```bash
pnpm dev
```

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

You'll receive a JWT token in the response. Use it for subsequent requests:

```bash
curl -X GET http://localhost:3000/api/business-profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Check DATABASE_URL in `.env.local`
- Ensure database and user exist

### Migration Issues
```bash
# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# View migration status
pnpm prisma migrate status
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
pnpm prisma:generate
```

---

## Next Steps

1. ✅ Database is set up and ready
2. 🔄 API endpoints are functional
3. 📝 Update frontend to use API endpoints instead of localStorage
4. 🔐 Implement proper authentication flow in frontend
5. 📊 Add data persistence layer in React components

---

## Production Deployment

For production deployment:

1. Use strong passwords for database
2. Enable SSL for PostgreSQL connections
3. Set secure JWT secrets in environment
4. Use connection pooling (PgBouncer)
5. Enable automated backups
6. Configure proper CORS settings
7. Add rate limiting and API authentication

---

## Questions or Issues?

Check Prisma documentation: https://www.prisma.io/docs/
PostgreSQL docs: https://www.postgresql.org/docs/
