import api from './api';
import { 
  BusinessProfile, 
  Customer, 
  Product, 
  Document, 
  Quote, 
  UserSettings 
} from './types';

export const ApiService = {
  // Auth
  auth: {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    getMe: () => api.get('/auth/me'),
    exportData: () => api.get('/auth/export-data'),
    deleteAccount: () => api.delete('/auth/account'),
  },

  // Business Profile
  business: {
    get: () => api.get('/business'),
    update: (data: any) => api.put('/business', data),
    create: (data: any) => api.post('/business', data),
  },

  // Customers
  customers: {
    getAll: (businessProfileId: string) => api.get(`/customers?businessProfileId=${businessProfileId}`),
    getById: (id: string) => api.get(`/customers/${id}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: string, data: any) => api.put(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`),
  },

  // Products
  products: {
    getAll: (businessProfileId: string) => api.get(`/products?businessProfileId=${businessProfileId}`),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
  },

  // Documents (Invoices)
  documents: {
    getAll: (businessProfileId: string, type?: string) => 
      api.get(`/documents?businessProfileId=${businessProfileId}${type ? `&type=${type}` : ''}`),
    getById: (id: string) => api.get(`/documents/${id}`),
    create: (data: any) => api.post('/documents', data),
    update: (id: string, data: any) => api.put(`/documents/${id}`, data),
    delete: (id: string) => api.delete(`/documents/${id}`),
  },

  // Quotes
  quotes: {
    getAll: (businessProfileId: string) => api.get(`/quotes?businessProfileId=${businessProfileId}`),
    getById: (id: string) => api.get(`/quotes/${id}`),
    create: (data: any) => api.post('/quotes', data),
    update: (id: string, data: any) => api.put(`/quotes/${id}`, data),
    delete: (id: string) => api.delete(`/quotes/${id}`),
  },

  // Settings
  settings: {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
  },
};
