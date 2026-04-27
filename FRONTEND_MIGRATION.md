# 🔄 Frontend-to-Backend Migration Guide

## Overview
This guide explains how to migrate the existing localStorage-based frontend to use the new PostgreSQL database with the REST API backend.

---

## Current Architecture vs New Architecture

### Current (LocalStorage)
```
Frontend Component
     ↓
React State
     ↓
localStorage.setItem()
     ↓
Browser localStorage (Lost on refresh)
```

### New (API + Database)
```
Frontend Component
     ↓
React State
     ↓
API Request (HTTP)
     ↓
Backend API Handler
     ↓
Prisma ORM
     ↓
PostgreSQL Database (Persistent)
```

---

## Migration Strategy

### Phase 1: Authentication
**Current:** localStorage key `invoice_current_user`
**New:** JWT token from API

#### Step 1.1: Create Auth Context
```typescript
// lib/auth/auth-context.tsx
import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Optionally verify token with API
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const { data } = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('authToken', data.token);
    router.push('/dashboard');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) throw new Error('Registration failed');

    const { data } = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('authToken', data.token);
    router.push('/setup');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

#### Step 1.2: Update page.tsx
```typescript
// app/page.tsx - Entry point with authentication

'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';

export default function HomePage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (!isLoading && token) {
      router.push('/dashboard');
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!token) {
    return mode === 'login' 
      ? <LoginForm onSwitchToRegister={() => setMode('register')} />
      : <RegisterForm onSwitchToLogin={() => setMode('login')} />;
  }

  return null;
}
```

---

### Phase 2: Business Profile

**Current:** localStorage key `invoice_business_profile`
**New:** `/api/business-profile` endpoints

#### Step 2.1: Update useBusinessProfile Hook
```typescript
// lib/hooks/use-business-profile.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export function useBusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/business-profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const { data } = await response.json();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (profileData: BusinessProfile) => {
    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to create profile');

      const { data } = await response.json();
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (profileData: Partial<BusinessProfile>) => {
    try {
      const response = await fetch('/api/business-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const { data } = await response.json();
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  return {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
}
```

#### Step 2.2: Update BusinessProfileForm
```typescript
// app/page.tsx - Updated with new hook

'use client';

import { useBusinessProfile } from '@/lib/hooks/use-business-profile';
import { useState } from 'react';

export default function SetupPage() {
  const { profile, createProfile, isLoading } = useBusinessProfile();

  const handleSubmit = async (data: BusinessProfile) => {
    try {
      await createProfile(data);
      // Navigate to dashboard
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  return profile ? (
    <Dashboard />
  ) : (
    <BusinessProfileForm onSubmit={handleSubmit} isLoading={isLoading} />
  );
}
```

---

### Phase 3: Customers

**Current:** localStorage key `invoice_customers`
**New:** `/api/customers` endpoints

#### Step 3.1: Create useCustomers Hook
```typescript
// lib/hooks/use-customers.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useBusinessProfile } from './use-business-profile';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { profile } = useBusinessProfile();

  const fetchCustomers = useCallback(async () => {
    if (!token || !profile) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch customers');

      const { data } = await response.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, profile]);

  const createCustomer = useCallback(async (customer: Customer) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
      });

      if (!response.ok) throw new Error('Failed to create customer');

      const { data } = await response.json();
      setCustomers([...customers, data]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, customers]);

  const updateCustomer = useCallback(
    async (customerId: string, customerData: Partial<Customer>) => {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        });

        if (!response.ok) throw new Error('Failed to update customer');

        const { data } = await response.json();
        setCustomers(customers.map(c => c.id === customerId ? data : c));
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [token, customers]
  );

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete customer');

      setCustomers(customers.filter(c => c.id !== customerId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, customers]);

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
```

#### Step 3.2: Update CustomerList Component
```typescript
// Replace CustomerList.tsx

'use client';

import { useCustomers } from '@/lib/hooks/use-customers';
import { useEffect } from 'react';
import { CustomerTable } from './customer-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function CustomerList() {
  const { customers, isLoading, error, fetchCustomers } = useCustomers();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;

  return <CustomerTable customers={customers} />;
}
```

---

### Phase 4: Products

**Current:** localStorage key `invoice_products`
**New:** `/api/products` endpoints

Create `useProducts` hook following same pattern as `useCustomers`.

---

### Phase 5: Documents (Invoices)

**Current:** localStorage key `invoice_documents`
**New:** `/api/documents` endpoints

#### Step 5.1: Create useDocuments Hook
```typescript
// lib/hooks/use-documents.ts
import { useAuth } from '@/lib/auth/auth-context';
import { useState, useCallback } from 'react';

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetchDocuments = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    const response = await fetch('/api/documents', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const { data } = await response.json();
    setDocuments(data);
    setIsLoading(false);
  }, [token]);

  const createDocument = useCallback(
    async (documentData: CreateDocumentRequest) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      const { data } = await response.json();
      setDocuments([...documents, data]);
      return data;
    },
    [token, documents]
  );

  return {
    documents,
    isLoading,
    fetchDocuments,
    createDocument,
  };
}
```

---

## Migration Checklist

- [ ] **Phase 1: Authentication**
  - [ ] Create AuthContext
  - [ ] Create login/register forms
  - [ ] Test login flow
  - [ ] Test registration flow

- [ ] **Phase 2: Business Profile**
  - [ ] Create useBusinessProfile hook
  - [ ] Update BusinessProfileForm
  - [ ] Test create profile
  - [ ] Test update profile

- [ ] **Phase 3: Customers**
  - [ ] Create useCustomers hook
  - [ ] Update CustomerList component
  - [ ] Update CustomerForm component
  - [ ] Test CRUD operations

- [ ] **Phase 4: Products**
  - [ ] Create useProducts hook
  - [ ] Update ProductList component
  - [ ] Update ProductForm component
  - [ ] Test CRUD operations

- [ ] **Phase 5: Documents**
  - [ ] Create useDocuments hook
  - [ ] Update InvoiceForm component
  - [ ] Update InvoiceList component
  - [ ] Test document creation with calculations
  - [ ] Test document status updates
  - [ ] Test payment recording

- [ ] **Phase 6: Quotes**
  - [ ] Create useQuotes hook
  - [ ] Update QuoteForm component
  - [ ] Update QuoteList component
  - [ ] Test quote creation
  - [ ] Test quote versioning
  - [ ] Test quote-to-invoice conversion

---

## Key Points for Frontend Team

### 1. Always Include Auth Header
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

### 2. Handle API Errors
```typescript
if (!response.ok) {
  const { error, message } = await response.json();
  throw new Error(message);
}
```

### 3. Manage Loading States
- Show loading spinner while fetching
- Disable buttons during submission
- Display error messages to user

### 4. Optimistic Updates
```typescript
// Update UI immediately, then sync with server
setItems([...items, newItem]);
try {
  const response = await fetch(...);
  // Update with server's response if needed
} catch (err) {
  // Revert optimistic update
  setItems(originalItems);
}
```

### 5. Caching Strategy
Use React Query or SWR for:
- Automatic refetching
- Caching
- Background updates

---

## TypeScript Types to Update

```typescript
// lib/api-types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateDocumentRequest {
  type: 'invoice' | 'proforma' | 'credit_note';
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: DocumentItemInput[];
  // ... other fields
}

export interface DocumentItemInput {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  // ... other fields
}
```

---

## Testing Strategy

### 1. API Integration Tests
```typescript
// __tests__/api/documents.test.ts
describe('Documents API', () => {
  it('should create invoice with correct calculations', async () => {
    const response = await fetch('/api/documents', { ... });
    const { data } = await response.json();
    
    expect(data.documentNumber).toMatch(/^INV\d+$/);
    expect(data.grandTotal).toBe(expected);
  });
});
```

### 2. Component Tests
Test that components correctly call API hooks and display data.

### 3. E2E Tests
Test complete workflows:
- Register → Create Profile → Create Invoice → Record Payment

---

## Rollback Strategy

If issues occur:

1. Keep localStorage store as fallback
2. Add feature flag to switch between API and localStorage
3. Gradually migrate features, not all at once
4. Monitor error logs in production

---

## Performance Tips

1. **Pagination** - Implement `?page=1&limit=50` for large lists
2. **Caching** - Use React Query for automatic caching
3. **Batch Requests** - Send multiple updates in one request
4. **Debouncing** - Debounce search/filter requests
5. **Lazy Loading** - Load data only when needed

---

## Deployment Checklist

Before deploying frontend changes:

- [ ] All API endpoints responding correctly
- [ ] Authentication flow working
- [ ] CORS properly configured
- [ ] Error messages clear
- [ ] Loading states working
- [ ] Offline handling (if needed)
- [ ] API rate limiting understood
- [ ] Environment variables set correctly

---

## Timeline Estimate

- **Phase 1 (Auth):** 2-3 days
- **Phase 2 (Business Profile):** 1-2 days
- **Phase 3 (Customers):** 2-3 days
- **Phase 4 (Products):** 1-2 days
- **Phase 5 (Documents):** 3-4 days
- **Phase 6 (Quotes):** 3-4 days
- **Testing & Fixes:** 2-3 days

**Total:** 2-3 weeks for complete migration

---

## Support Resources

- API Documentation: `API_DOCUMENTATION.md`
- Database Setup: `DATABASE_SETUP.md`
- Backend Implementation: `BACKEND_IMPLEMENTATION.md`
- Prisma Docs: https://www.prisma.io/docs
