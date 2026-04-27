// ==========================================
// QUOTIQ - ENTERPRISE CPQ & BILLING SAAS
// Client-Side Data Store (Zustand-like pattern with localStorage)
// ==========================================

import { 
  BusinessProfile, 
  Customer, 
  Product, 
  Document, 
  Payment, 
  UserSettings,
  DocumentType,
  DocumentStatus,
  DocumentItem,
  TaxBreakdown,
  DashboardStats,
  Currency,
  CountryTaxConfig,
  InvoiceTemplate,
  QuoteTemplate,
  TemplateSettings,
  Quote,
  QuoteItem,
  QuoteStatus,
  QuoteVersion,
  QuoteActivityLog,
  QuoteActivityAction,
  QuoteDashboardStats,
} from './types';

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
// STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  BUSINESS_PROFILE: 'quotiq_business_profile',
  USER_SETTINGS: 'quotiq_user_settings',
  CUSTOMERS: 'quotiq_customers',
  PRODUCTS: 'quotiq_products',
  DOCUMENTS: 'quotiq_documents',
  PAYMENTS: 'quotiq_payments',
  TEMPLATES: 'quotiq_templates',
  CURRENT_USER: 'quotiq_current_user',
  QUOTES: 'quotiq_quotes',
  QUOTE_VERSIONS: 'quotiq_quote_versions',
  QUOTE_ACTIVITY: 'quotiq_quote_activity',
} as const;

// ==========================================
// AUTH STORE
// ==========================================
export const AuthStore = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('quotiq_auth_token');
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('quotiq_auth_token', token);
  },

  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('quotiq_auth_token');
  },

  getUser(): any | null {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER, null);
  },

  setUser(user: any): void {
    setToStorage(STORAGE_KEYS.CURRENT_USER, user);
  },

  logout(): void {
    this.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.BUSINESS_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
    }
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// ==========================================
// CURRENCIES DATA
// ==========================================
export const CURRENCIES: Currency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
];

// ==========================================
// COUNTRY TAX CONFIGURATIONS
// ==========================================
export const COUNTRY_TAX_CONFIGS: CountryTaxConfig[] = [
  {
    country: 'India',
    taxSystem: 'GST',
    defaultTaxRate: 18,
    taxIdLabel: 'GSTIN',
    taxIdFormat: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
    requiresStateForTax: true,
    states: [
      { code: '01', name: 'Jammu & Kashmir' },
      { code: '02', name: 'Himachal Pradesh' },
      { code: '03', name: 'Punjab' },
      { code: '04', name: 'Chandigarh' },
      { code: '05', name: 'Uttarakhand' },
      { code: '06', name: 'Haryana' },
      { code: '07', name: 'Delhi' },
      { code: '08', name: 'Rajasthan' },
      { code: '09', name: 'Uttar Pradesh' },
      { code: '10', name: 'Bihar' },
      { code: '11', name: 'Sikkim' },
      { code: '12', name: 'Arunachal Pradesh' },
      { code: '13', name: 'Nagaland' },
      { code: '14', name: 'Manipur' },
      { code: '15', name: 'Mizoram' },
      { code: '16', name: 'Tripura' },
      { code: '17', name: 'Meghalaya' },
      { code: '18', name: 'Assam' },
      { code: '19', name: 'West Bengal' },
      { code: '20', name: 'Jharkhand' },
      { code: '21', name: 'Odisha' },
      { code: '22', name: 'Chhattisgarh' },
      { code: '23', name: 'Madhya Pradesh' },
      { code: '24', name: 'Gujarat' },
      { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
      { code: '27', name: 'Maharashtra' },
      { code: '28', name: 'Andhra Pradesh (Old)' },
      { code: '29', name: 'Karnataka' },
      { code: '30', name: 'Goa' },
      { code: '31', name: 'Lakshadweep' },
      { code: '32', name: 'Kerala' },
      { code: '33', name: 'Tamil Nadu' },
      { code: '34', name: 'Puducherry' },
      { code: '35', name: 'Andaman & Nicobar Islands' },
      { code: '36', name: 'Telangana' },
      { code: '37', name: 'Andhra Pradesh' },
      { code: '38', name: 'Ladakh' },
    ],
  },
  {
    country: 'United States',
    taxSystem: 'SALES_TAX',
    defaultTaxRate: 0,
    taxIdLabel: 'EIN',
    taxIdFormat: '^[0-9]{2}-[0-9]{7}$',
    requiresStateForTax: true,
    states: [
      { code: 'AL', name: 'Alabama' },
      { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' },
      { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' },
      { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' },
      { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' },
      { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' },
      { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' },
      { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' },
      { code: 'WY', name: 'Wyoming' },
      { code: 'DC', name: 'District of Columbia' },
    ],
  },
  {
    country: 'United Kingdom',
    taxSystem: 'VAT',
    defaultTaxRate: 20,
    taxIdLabel: 'VAT Number',
    taxIdFormat: '^GB[0-9]{9}$|^GB[0-9]{12}$|^GBGD[0-9]{3}$|^GBHA[0-9]{3}$',
    requiresStateForTax: false,
  },
  {
    country: 'Germany',
    taxSystem: 'VAT',
    defaultTaxRate: 19,
    taxIdLabel: 'USt-IdNr',
    taxIdFormat: '^DE[0-9]{9}$',
    requiresStateForTax: false,
  },
  {
    country: 'France',
    taxSystem: 'VAT',
    defaultTaxRate: 20,
    taxIdLabel: 'TVA',
    taxIdFormat: '^FR[0-9A-Z]{2}[0-9]{9}$',
    requiresStateForTax: false,
  },
  {
    country: 'Canada',
    taxSystem: 'VAT',
    defaultTaxRate: 5,
    taxIdLabel: 'GST/HST Number',
    taxIdFormat: '^[0-9]{9}RT[0-9]{4}$',
    requiresStateForTax: true,
    states: [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'YT', name: 'Yukon' },
    ],
  },
  {
    country: 'Australia',
    taxSystem: 'VAT',
    defaultTaxRate: 10,
    taxIdLabel: 'ABN',
    taxIdFormat: '^[0-9]{11}$',
    requiresStateForTax: false,
  },
  {
    country: 'Singapore',
    taxSystem: 'VAT',
    defaultTaxRate: 9,
    taxIdLabel: 'GST Reg No',
    taxIdFormat: '^[A-Z][0-9]{8}[A-Z]$',
    requiresStateForTax: false,
  },
  {
    country: 'UAE',
    taxSystem: 'VAT',
    defaultTaxRate: 5,
    taxIdLabel: 'TRN',
    taxIdFormat: '^[0-9]{15}$',
    requiresStateForTax: false,
  },
];

// ==========================================
// HSN/SAC CODES (Common Indian codes)
// ==========================================
export const COMMON_HSN_CODES = [
  { code: '8471', description: 'Computers and parts', rate: 18 },
  { code: '8443', description: 'Printers, scanners', rate: 18 },
  { code: '8528', description: 'Monitors, projectors', rate: 18 },
  { code: '6109', description: 'T-shirts, singlets', rate: 5 },
  { code: '6203', description: 'Mens suits, trousers', rate: 12 },
  { code: '6204', description: 'Womens suits, dresses', rate: 12 },
  { code: '0402', description: 'Milk and cream', rate: 5 },
  { code: '1006', description: 'Rice', rate: 5 },
  { code: '1001', description: 'Wheat', rate: 0 },
  { code: '8703', description: 'Motor cars', rate: 28 },
  { code: '9403', description: 'Furniture', rate: 18 },
  { code: '9405', description: 'Lamps and lighting', rate: 18 },
];

export const COMMON_SAC_CODES = [
  { code: '998311', description: 'IT consulting services', rate: 18 },
  { code: '998312', description: 'IT design and development', rate: 18 },
  { code: '998313', description: 'IT infrastructure services', rate: 18 },
  { code: '998314', description: 'IT network services', rate: 18 },
  { code: '998315', description: 'Software support services', rate: 18 },
  { code: '998316', description: 'Data processing services', rate: 18 },
  { code: '998319', description: 'Other IT services', rate: 18 },
  { code: '998212', description: 'Accounting services', rate: 18 },
  { code: '998213', description: 'Auditing services', rate: 18 },
  { code: '998214', description: 'Tax consultancy', rate: 18 },
  { code: '998411', description: 'Research services', rate: 18 },
  { code: '998511', description: 'Advertising services', rate: 18 },
];

// ==========================================
// GST TAX RATES
// ==========================================
export const GST_TAX_RATES = [0, 5, 12, 18, 28];

// ==========================================
// DEFAULT USER SETTINGS
// ==========================================
export function getDefaultUserSettings(userId: string): UserSettings {
  return {
    id: generateId(),
    userId,
    currency: 'INR',
    taxSystem: 'GST',
    taxInclusive: false,
    defaultTaxRate: 18,
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    quotePrefix: 'QT',
    quoteStartNumber: 1,
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
    defaultPaymentTerms: 'net_30',
    defaultNotes: '',
    defaultTerms: 'Thank you for your business!',
    emailNotifications: true,
    reminderDays: [3, 7, 14],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ==========================================
// DEFAULT TEMPLATE CONFIGURATION
// ==========================================
export function getDefaultTemplate(): InvoiceTemplate {
  return {
    id: 'default-invoice',
    name: 'Invoice Template',
    showLogo: true,
    showTaxBreakdown: true,
    showHsnSac: true,
    showQuantity: true,
    showUnit: true,
    showDiscount: true,
    showShippingAddress: false,
    showBankDetails: true,
    showSignature: true,
    showQRCode: false,
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    borderRadius: '8px',
    layout: 'modern',
    headerText: '',
    footerText: '',
  };
}

export function getDefaultQuoteTemplate(): QuoteTemplate {
  return {
    id: 'default-quote',
    name: 'Quote Template',
    showLogo: true,
    showTaxBreakdown: true,
    showHsnSac: true,
    showQuantity: true,
    showUnit: true,
    showDiscount: true,
    showShippingAddress: false,
    showBankDetails: true,
    showSignature: true,
    showQRCode: false,
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
    borderRadius: '8px',
    layout: 'modern',
    headerText: '',
    footerText: '',
  };
}

export function getDefaultTemplates(): TemplateSettings {
  return {
    invoiceTemplate: getDefaultTemplate(),
    quoteTemplate: getDefaultQuoteTemplate(),
  };
}

// ==========================================
// BUSINESS PROFILE STORE
// ==========================================
export const BusinessProfileStore = {
  get(): BusinessProfile | null {
    return getFromStorage<BusinessProfile | null>(STORAGE_KEYS.BUSINESS_PROFILE, null);
  },

  set(profile: BusinessProfile): void {
    setToStorage(STORAGE_KEYS.BUSINESS_PROFILE, profile);
  },

  update(updates: Partial<BusinessProfile>): BusinessProfile | null {
    const current = this.get();
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date() };
    this.set(updated);
    return updated;
  },

  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.BUSINESS_PROFILE);
    }
  },
};

// ==========================================
// USER SETTINGS STORE
// ==========================================
export const UserSettingsStore = {
  get(): UserSettings | null {
    return getFromStorage<UserSettings | null>(STORAGE_KEYS.USER_SETTINGS, null);
  },

  set(settings: UserSettings): void {
    setToStorage(STORAGE_KEYS.USER_SETTINGS, settings);
  },

  update(updates: Partial<UserSettings>): UserSettings | null {
    const current = this.get();
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date() };
    this.set(updated);
    return updated;
  },

  getOrCreate(userId: string): UserSettings {
    const existing = this.get();
    if (existing) return existing;
    const newSettings = getDefaultUserSettings(userId);
    this.set(newSettings);
    return newSettings;
  },
};

// ==========================================
// CUSTOMERS STORE
// ==========================================
export const CustomersStore = {
  getAll(): Customer[] {
    return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  setAll(customers: Customer[]): void {
    setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  get(id: string): Customer | undefined {
    return this.getAll().find(c => c.id === id);
  },

  add(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'totalOutstanding'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      totalSpent: 0,
      totalOutstanding: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const all = this.getAll();
    all.push(newCustomer);
    setToStorage(STORAGE_KEYS.CUSTOMERS, all);
    return newCustomer;
  },

  update(id: string, updates: Partial<Customer>): Customer | undefined {
    const all = this.getAll();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], ...updates, updatedAt: new Date() };
    setToStorage(STORAGE_KEYS.CUSTOMERS, all);
    return all[index];
  },

  delete(id: string): boolean {
    // Prevent deletion if customer has any documents (invoices, quotes, etc.)
    const hasDocuments = DocumentsStore.getByCustomer(id).length > 0;
    const hasQuotes = QuotesStore.getByCustomer(id).length > 0;
    if (hasDocuments || hasQuotes) return false;
    const all = this.getAll();
    const filtered = all.filter(c => c.id !== id);
    if (filtered.length === all.length) return false;
    setToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  },

  /** Soft-delete: mark inactive instead of hard delete */
  deactivate(id: string): boolean {
    const updated = this.update(id, { isActive: false });
    return !!updated;
  },

  search(query: string): Customer[] {
    const all = this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.companyName?.toLowerCase().includes(lowerQuery)
    );
  },
};

// ==========================================
// PRODUCTS STORE
// ==========================================
export const ProductsStore = {
  getAll(): Product[] {
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  setAll(products: Product[]): void {
    setToStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  get(id: string): Product | undefined {
    return this.getAll().find(p => p.id === id);
  },

  add(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const all = this.getAll();
    all.push(newProduct);
    setToStorage(STORAGE_KEYS.PRODUCTS, all);
    return newProduct;
  },

  update(id: string, updates: Partial<Product>): Product | undefined {
    const all = this.getAll();
    const index = all.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], ...updates, updatedAt: new Date() };
    setToStorage(STORAGE_KEYS.PRODUCTS, all);
    return all[index];
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length === all.length) return false;
    setToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  search(query: string): Product[] {
    const all = this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku?.toLowerCase().includes(lowerQuery) ||
      p.hsnCode?.includes(query) ||
      p.sacCode?.includes(query)
    );
  },
};

// ==========================================
// DOCUMENTS STORE
// ==========================================
export const DocumentsStore = {
  getAll(): Document[] {
    return getFromStorage<Document[]>(STORAGE_KEYS.DOCUMENTS, []);
  },

  get(id: string): Document | undefined {
    return this.getAll().find(d => d.id === id);
  },

  getByType(type: DocumentType): Document[] {
    return this.getAll().filter(d => d.type === type);
  },

  getByStatus(status: DocumentStatus): Document[] {
    return this.getAll().filter(d => d.status === status);
  },

  getByCustomer(customerId: string): Document[] {
    return this.getAll().filter(d => d.customerId === customerId);
  },

  add(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document {
    const newDocument: Document = {
      ...document,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const all = this.getAll();
    all.push(newDocument);
    setToStorage(STORAGE_KEYS.DOCUMENTS, all);
    return newDocument;
  },

  update(id: string, updates: Partial<Document>): Document | undefined {
    const all = this.getAll();
    const index = all.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], ...updates, updatedAt: new Date() };
    setToStorage(STORAGE_KEYS.DOCUMENTS, all);
    return all[index];
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(d => d.id !== id);
    if (filtered.length === all.length) return false;
    setToStorage(STORAGE_KEYS.DOCUMENTS, filtered);
    return true;
  },

  getNextNumber(type: DocumentType, settings: UserSettings): string {
    const all = this.getByType(type);
    const prefix = type === 'invoice' ? settings.invoicePrefix : settings.quotePrefix;
    const startNumber = type === 'invoice' ? settings.invoiceStartNumber : settings.quoteStartNumber;
    const year = new Date().getFullYear();
    // Find the highest sequence number already used (across ALL years, to avoid any collision)
    const currentMax = all.reduce((max, doc) => {
      const numMatch = doc.documentNumber.match(/(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, startNumber - 1);
    const next = currentMax + 1;
    const candidate = `${prefix}-${year}-${String(next).padStart(4, '0')}`;
    // Ensure no collision (edge case: manually entered duplicate number)
    const exists = all.some(d => d.documentNumber === candidate);
    if (exists) {
      return `${prefix}-${year}-${String(next + 1).padStart(4, '0')}`;
    }
    return candidate;
  },
};

// ==========================================
// PAYMENTS STORE
// ==========================================
export const PaymentsStore = {
  getAll(): Payment[] {
    return getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
  },

  get(id: string): Payment | undefined {
    return this.getAll().find(p => p.id === id);
  },

  getByDocument(documentId: string): Payment[] {
    return this.getAll().filter(p => p.documentId === documentId);
  },

  add(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const newPayment: Payment = {
      ...payment,
      id: generateId(),
      createdAt: new Date(),
    };
    const all = this.getAll();
    all.push(newPayment);
    setToStorage(STORAGE_KEYS.PAYMENTS, all);

    // Update document payment status
    // IMPORTANT: sum existing completed payments FIRST (from the already-saved list),
    // then add the new payment amount — avoids double-counting.
    const document = DocumentsStore.get(payment.documentId);
    if (document) {
      const existingPaid = all
        .filter(p => p.documentId === payment.documentId && p.status === 'completed' && p.id !== newPayment.id)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const newPaymentAmount = payment.status === 'completed' ? payment.amount : 0;
      const totalPaid = existingPaid + newPaymentAmount;

      // Clamp: never record more than grandTotal as paid
      const clampedTotalPaid = Math.min(totalPaid, document.grandTotal);
      const amountDue = Math.max(0, document.grandTotal - clampedTotalPaid);

      let status: DocumentStatus = document.status;
      if (clampedTotalPaid >= document.grandTotal) {
        status = 'paid';
      } else if (clampedTotalPaid > 0) {
        status = 'partially_paid';
      }

      DocumentsStore.update(payment.documentId, {
        amountPaid: clampedTotalPaid,
        amountDue,
        status,
        paidAt: status === 'paid' ? new Date() : document.paidAt,
      });
    }

    return newPayment;
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length === all.length) return false;
    setToStorage(STORAGE_KEYS.PAYMENTS, filtered);
    return true;
  },
};

// ==========================================
// TEMPLATE STORE
// ==========================================
export const TemplateStore = {
  get(): TemplateSettings {
    return getFromStorage<TemplateSettings>(STORAGE_KEYS.TEMPLATES, getDefaultTemplates());
  },

  set(template: TemplateSettings): void {
    setToStorage(STORAGE_KEYS.TEMPLATES, template);
  },

  update(updates: Partial<TemplateSettings>): TemplateSettings {
    const current = this.get();
    const updated = { ...current, ...updates };
    this.set(updated);
    return updated;
  },
};

// ==========================================
// QUOTE HELPERS
// ==========================================
export function generateShareToken(): string {
  return `qt_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

// ==========================================
// QUOTES STORE
// ==========================================
export const QuotesStore = {
  getAll(): Quote[] {
    return getFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, []);
  },

  get(id: string): Quote | undefined {
    return this.getAll().find(q => q.id === id);
  },

  getByToken(token: string): Quote | undefined {
    return this.getAll().find(q => q.shareToken === token);
  },

  getByCustomer(customerId: string): Quote[] {
    return this.getAll().filter(q => q.customerId === customerId);
  },

  getByStatus(status: QuoteStatus): Quote[] {
    return this.getAll().filter(q => q.status === status);
  },

  add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'shareToken' | 'versionNumber'>): Quote {
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      shareToken: generateShareToken(),
      versionNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const all = this.getAll();
    all.push(newQuote);
    setToStorage(STORAGE_KEYS.QUOTES, all);

    // Log activity
    QuoteActivityStore.add(newQuote.id, 'created', 'Quote created');

    // Save initial version snapshot
    QuoteVersionsStore.snapshot(newQuote, 'Initial version');

    return newQuote;
  },

  update(id: string, updates: Partial<Quote>, logAction?: QuoteActivityAction, logDescription?: string): Quote | undefined {
    const all = this.getAll();
    const index = all.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    const prev = all[index];
    all[index] = { ...prev, ...updates, updatedAt: new Date() };
    setToStorage(STORAGE_KEYS.QUOTES, all);

    if (logAction) {
      QuoteActivityStore.add(id, logAction, logDescription || logAction);
    }

    return all[index];
  },

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(q => q.id !== id);
    if (filtered.length === all.length) return false;
    setToStorage(STORAGE_KEYS.QUOTES, filtered);
    // Clean up versions and activity
    QuoteVersionsStore.deleteByQuote(id);
    QuoteActivityStore.deleteByQuote(id);
    return true;
  },

  duplicate(id: string, newNumber: string): Quote | undefined {
    const original = this.get(id);
    if (!original) return undefined;
    const settings = UserSettingsStore.get();
    const duplicated = this.add({
      ...original,
      quoteNumber: newNumber,
      status: 'draft',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      convertedInvoiceId: undefined,
      clientComment: undefined,
      sentAt: undefined,
      viewedAt: undefined,
      approvedAt: undefined,
      rejectedAt: undefined,
    });
    QuoteActivityStore.add(duplicated.id, 'duplicated', `Duplicated from ${original.quoteNumber}`);
    return duplicated;
  },

  getNextNumber(settings: UserSettings): string {
    const all = this.getAll();
    const prefix = settings.quotePrefix || 'QT';
    const startNumber = settings.quoteStartNumber || 1;
    const currentMax = all.reduce((max, q) => {
      const numMatch = q.quoteNumber.match(/(\d+)$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, startNumber - 1);
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(currentMax + 1).padStart(4, '0')}`;
  },

  /** Mark expired quotes automatically */
  checkAndMarkExpired(): void {
    const all = this.getAll();
    const now = new Date();
    let changed = false;
    all.forEach((q, i) => {
      if (
        (q.status === 'sent' || q.status === 'viewed') &&
        new Date(q.expiryDate) < now
      ) {
        all[i] = { ...q, status: 'expired', updatedAt: new Date() };
        QuoteActivityStore.add(q.id, 'expired', 'Quote expired automatically');
        changed = true;
      }
    });
    if (changed) setToStorage(STORAGE_KEYS.QUOTES, all);
  },

  /** Convert quote to invoice — core Quote-to-Cash feature */
  convertToInvoice(quoteId: string): Document | null {
    const quote = this.get(quoteId);
    if (!quote) return null;
    // Prevent duplicate conversion — already converted quotes must not produce another invoice
    if (quote.status === 'converted' || quote.convertedInvoiceId) return null;
    if (quote.status !== 'approved' && quote.status !== 'sent' && quote.status !== 'viewed') return null;

    const settings = UserSettingsStore.get();
    if (!settings) return null;

    // Map QuoteItems → DocumentItems (exclude optional items from conversion)
    const docItems: DocumentItem[] = quote.items
      .filter(item => !item.isOptional)
      .map(item => {
        // Preserve tax amounts exactly as quoted — do not recalculate
        return {
          id: generateId(),
          productId: item.productId,
          name: item.name,
          description: item.description,
          hsnCode: item.hsnCode,
          sacCode: item.sacCode,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          taxType: item.taxType,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalBeforeTax: item.totalBeforeTax,
          totalAfterTax: item.totalAfterTax,
        };
      });

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (settings.defaultPaymentTerms === 'net_30' ? 30 : 15));

    const invoice = DocumentsStore.add({
      userId: quote.userId,
      businessProfileId: quote.businessProfileId,
      type: 'invoice',
      documentNumber: DocumentsStore.getNextNumber('invoice', settings),
      customerId: quote.customerId,
      issueDate: now,
      dueDate,
      currency: quote.currency,
      exchangeRate: quote.exchangeRate,
      items: docItems,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxTotal: quote.taxTotal,
      grandTotal: quote.grandTotal,
      amountPaid: 0,
      amountDue: quote.grandTotal,
      status: 'draft',
      taxBreakdown: quote.taxBreakdown,
      notes: quote.notes,
      terms: quote.terms,
      referenceNumber: quote.quoteNumber,
      placeOfSupply: quote.placeOfSupply,
    });

    // Update quote status
    this.update(quoteId, { status: 'converted', convertedInvoiceId: invoice.id }, 'converted', `Converted to invoice ${invoice.documentNumber}`);

    return invoice;
  },
};

// ==========================================
// QUOTE VERSIONS STORE
// ==========================================
export const QuoteVersionsStore = {
  getAll(): QuoteVersion[] {
    return getFromStorage<QuoteVersion[]>(STORAGE_KEYS.QUOTE_VERSIONS, []);
  },

  getByQuote(quoteId: string): QuoteVersion[] {
    return this.getAll()
      .filter(v => v.quoteId === quoteId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  },

  snapshot(quote: Quote, changeNote?: string): QuoteVersion {
    const all = this.getAll();
    const existing = all.filter(v => v.quoteId === quote.id);
    const versionNumber = existing.length + 1;
    const version: QuoteVersion = {
      id: generateId(),
      quoteId: quote.id,
      versionNumber,
      snapshotJson: JSON.stringify(quote),
      changeNote,
      createdAt: new Date(),
    };
    all.push(version);
    setToStorage(STORAGE_KEYS.QUOTE_VERSIONS, all);
    return version;
  },

  deleteByQuote(quoteId: string): void {
    const all = this.getAll().filter(v => v.quoteId !== quoteId);
    setToStorage(STORAGE_KEYS.QUOTE_VERSIONS, all);
  },
};

// ==========================================
// QUOTE ACTIVITY STORE
// ==========================================
export const QuoteActivityStore = {
  getAll(): QuoteActivityLog[] {
    return getFromStorage<QuoteActivityLog[]>(STORAGE_KEYS.QUOTE_ACTIVITY, []);
  },

  getByQuote(quoteId: string): QuoteActivityLog[] {
    return this.getAll()
      .filter(a => a.quoteId === quoteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  add(quoteId: string, action: QuoteActivityAction, description: string, metadata?: Record<string, unknown>): QuoteActivityLog {
    const log: QuoteActivityLog = {
      id: generateId(),
      quoteId,
      action,
      description,
      metadata,
      createdAt: new Date(),
    };
    const all = this.getAll();
    all.push(log);
    setToStorage(STORAGE_KEYS.QUOTE_ACTIVITY, all);
    return log;
  },

  deleteByQuote(quoteId: string): void {
    const all = this.getAll().filter(a => a.quoteId !== quoteId);
    setToStorage(STORAGE_KEYS.QUOTE_ACTIVITY, all);
  },
};

// ==========================================
// QUOTE ANALYTICS
// ==========================================
export function calculateQuoteStats(): QuoteDashboardStats {
  const quotes = QuotesStore.getAll();

  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;
  const sentQuotes = quotes.filter(q => q.status === 'sent').length;
  const viewedQuotes = quotes.filter(q => q.status === 'viewed').length;
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;
  const expiredQuotes = quotes.filter(q => q.status === 'expired').length;
  const convertedQuotes = quotes.filter(q => q.status === 'converted').length;

  const totalSent = sentQuotes + viewedQuotes + approvedQuotes + rejectedQuotes + expiredQuotes + convertedQuotes;
  const conversionRate = totalSent > 0 ? Math.round((convertedQuotes / totalSent) * 100) : 0;

  const totalPipelineValue = quotes
    .filter(q => !['rejected', 'expired', 'converted'].includes(q.status))
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const approvedValue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const conversionFunnel = [
    { stage: 'Created', count: totalQuotes, value: quotes.reduce((s, q) => s + q.grandTotal, 0) },
    { stage: 'Sent', count: totalSent, value: quotes.filter(q => q.status !== 'draft').reduce((s, q) => s + q.grandTotal, 0) },
    { stage: 'Viewed', count: viewedQuotes + approvedQuotes + convertedQuotes, value: 0 },
    { stage: 'Approved', count: approvedQuotes + convertedQuotes, value: approvedValue + quotes.filter(q => q.status === 'converted').reduce((s, q) => s + q.grandTotal, 0) },
    { stage: 'Converted', count: convertedQuotes, value: quotes.filter(q => q.status === 'converted').reduce((s, q) => s + q.grandTotal, 0) },
  ];

  return {
    totalQuotes,
    draftQuotes,
    sentQuotes,
    approvedQuotes,
    rejectedQuotes,
    expiredQuotes,
    convertedQuotes,
    conversionRate,
    totalPipelineValue,
    approvedValue,
    recentQuotes,
    conversionFunnel,
  };
}

// ==========================================
// TAX CALCULATION HELPERS
// ==========================================
export function calculateTax(
  amount: number,
  taxRate: number,
  taxInclusive: boolean = false
): { taxableAmount: number; taxAmount: number; total: number } {
  if (taxInclusive) {
    const taxableAmount = amount / (1 + taxRate / 100);
    const taxAmount = amount - taxableAmount;
    return { taxableAmount, taxAmount, total: amount };
  } else {
    const taxAmount = amount * (taxRate / 100);
    return { taxableAmount: amount, taxAmount, total: amount + taxAmount };
  }
}

export function calculateGSTBreakdown(
  amount: number,
  taxRate: number,
  isInterState: boolean,
  taxInclusive: boolean = false
): TaxBreakdown[] {
  const { taxableAmount, taxAmount } = calculateTax(amount, taxRate, taxInclusive);
  
  if (isInterState) {
    return [{
      taxType: 'IGST',
      taxRate,
      taxableAmount,
      taxAmount,
    }];
  } else {
    const halfRate = taxRate / 2;
    const halfTax = taxAmount / 2;
    return [
      {
        taxType: 'CGST',
        taxRate: halfRate,
        taxableAmount,
        taxAmount: halfTax,
      },
      {
        taxType: 'SGST',
        taxRate: halfRate,
        taxableAmount,
        taxAmount: halfTax,
      },
    ];
  }
}

export function calculateDocumentTotals(
  items: DocumentItem[],
  discountPercent: number = 0,
  discountAmount: number = 0
): {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdown[];
} {
  // subtotal = sum of all per-item pre-tax totals (after per-item discounts)
  const subtotal = items.reduce((sum, item) => sum + item.totalBeforeTax, 0);

  // Document-level discount
  let discountTotal = discountAmount;
  if (discountPercent > 0) {
    discountTotal += subtotal * (discountPercent / 100);
  }

  // Tax is always calculated on the per-item taxable amount (item.totalBeforeTax),
  // NOT on the post-document-discount amount.  Document-level discounts are rare
  // in Indian GST and the per-item tax has already been embedded.
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);

  // grandTotal = subtotal (pre-tax) - document discount + total tax
  const grandTotal = subtotal - discountTotal + taxTotal;

  // Tax breakdown grouped by type + rate
  const taxBreakdownMap = new Map<string, TaxBreakdown>();
  items.forEach(item => {
    if (item.taxAmount === 0 || item.taxRate === 0) return;
    const key = `${item.taxType}-${item.taxRate}`;
    const existing = taxBreakdownMap.get(key);
    if (existing) {
      existing.taxableAmount += item.totalBeforeTax;
      existing.taxAmount += item.taxAmount;
    } else {
      taxBreakdownMap.set(key, {
        taxType: item.taxType,
        taxRate: item.taxRate,
        taxableAmount: item.totalBeforeTax,
        taxAmount: item.taxAmount,
      });
    }
  });

  const taxBreakdown = Array.from(taxBreakdownMap.values());

  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    taxBreakdown,
  };
}

// ==========================================
// DASHBOARD STATS CALCULATOR
// ==========================================
export function calculateDashboardStats(): DashboardStats {
  const documents = DocumentsStore.getAll();
  const customers = CustomersStore.getAll();
  const products = ProductsStore.getAll();
  
  const invoices = documents.filter(d => d.type === 'invoice');
  
  const totalRevenue = invoices
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + d.grandTotal, 0);
  
  const totalOutstanding = invoices
    .filter(d => ['sent', 'partially_paid'].includes(d.status))
    .reduce((sum, d) => sum + d.amountDue, 0);
  
  const totalOverdue = invoices
    .filter(d => d.status === 'overdue')
    .reduce((sum, d) => sum + d.amountDue, 0);
  
  const paidInvoices = invoices.filter(d => d.status === 'paid').length;
  const unpaidInvoices = invoices.filter(d => ['sent', 'partially_paid', 'draft'].includes(d.status)).length;
  const overdueInvoices = invoices.filter(d => d.status === 'overdue').length;
  
  // Monthly revenue (last 12 months)
  const monthlyRevenue: { month: string; revenue: number; invoices: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const monthInvoices = invoices.filter(d => {
      const docDate = new Date(d.issueDate);
      return docDate.getMonth() === date.getMonth() && 
             docDate.getFullYear() === date.getFullYear() &&
             d.status === 'paid';
    });
    monthlyRevenue.push({
      month: monthStr,
      revenue: monthInvoices.reduce((sum, d) => sum + d.grandTotal, 0),
      invoices: monthInvoices.length,
    });
  }
  
  // Top customers by spending
  const customerSpending = new Map<string, number>();
  invoices.filter(d => d.status === 'paid').forEach(d => {
    const current = customerSpending.get(d.customerId) || 0;
    customerSpending.set(d.customerId, current + d.grandTotal);
  });
  const topCustomers = Array.from(customerSpending.entries())
    .map(([customerId, totalSpent]) => ({
      customer: customers.find(c => c.id === customerId)!,
      totalSpent,
    }))
    .filter(c => c.customer)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
  
  // Top products by quantity sold
  const productSales = new Map<string, number>();
  invoices.forEach(d => {
    d.items.forEach(item => {
      if (item.productId) {
        const current = productSales.get(item.productId) || 0;
        productSales.set(item.productId, current + item.quantity);
      }
    });
  });
  const topProducts = Array.from(productSales.entries())
    .map(([productId, totalSold]) => ({
      product: products.find(p => p.id === productId)!,
      totalSold,
    }))
    .filter(p => p.product)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);
  
  // Revenue by status
  const revenueByStatus = [
    { status: 'paid' as DocumentStatus, amount: totalRevenue },
    { status: 'sent' as DocumentStatus, amount: invoices.filter(d => d.status === 'sent').reduce((s, d) => s + d.grandTotal, 0) },
    { status: 'overdue' as DocumentStatus, amount: totalOverdue },
    { status: 'draft' as DocumentStatus, amount: invoices.filter(d => d.status === 'draft').reduce((s, d) => s + d.grandTotal, 0) },
  ];
  
  return {
    totalRevenue,
    totalOutstanding,
    totalOverdue,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalCustomers: customers.length,
    totalProducts: products.length,
    recentDocuments: documents.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10),
    topCustomers,
    topProducts,
    monthlyRevenue,
    revenueByStatus,
  };
}

// ==========================================
// FORMAT HELPERS
// ==========================================
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  // Fallback to INR if unknown currency code
  const currencyData = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  // Use locale appropriate to each currency for correct number formatting
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'ar-AE',
    SGD: 'en-SG',
    AUD: 'en-AU',
    CAD: 'en-CA',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
  };
  const locale = localeMap[currencyData.code] || 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyData.code,
      minimumFractionDigits: currencyData.decimalPlaces,
      maximumFractionDigits: currencyData.decimalPlaces,
    }).format(amount);
  } catch {
    // Fallback: manual symbol + fixed decimal
    return `${currencyData.symbol}${amount.toFixed(currencyData.decimalPlaces)}`;
  }
}

export function formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

// ==========================================
// SEED DATA FOR DEMO
// ==========================================
export function seedDemoData(): void {
  // Check if already seeded
  if (BusinessProfileStore.get()) return;
  
  const userId = generateId();
  
  // Create business profile
  const businessProfile: BusinessProfile = {
    id: generateId(),
    userId,
    businessType: 'private_limited',
    businessName: 'TechCorp Solutions',
    legalName: 'TechCorp Solutions Private Limited',
    registrationNumber: 'U72200MH2020PTC123456',
    taxId: '27AABCT1234F1Z5',
    panNumber: 'AABCT1234F',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '123 Business Park, Andheri East',
    pincode: '400069',
    email: 'billing@techcorp.com',
    phone: '+91 22 1234 5678',
    website: 'https://techcorp.com',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '50100123456789',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'TechCorp Solutions Pvt Ltd',
      branch: 'Andheri East',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  BusinessProfileStore.set(businessProfile);
  
  // Create user settings
  const settings = getDefaultUserSettings(userId);
  UserSettingsStore.set(settings);
  
  // Create sample customers
  const customers = [
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Rajesh Kumar',
      companyName: 'Kumar Enterprises',
      email: 'rajesh@kumar.com',
      phone: '+91 98765 43210',
      billingAddress: {
        street: '45 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560001',
      },
      taxId: '29AABCK1234F1Z5',
      paymentTerms: 'net_30' as const,
      currency: 'INR',
      isActive: true,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Sarah Johnson',
      companyName: 'Global Tech Inc',
      email: 'sarah@globaltech.com',
      phone: '+1 555 123 4567',
      billingAddress: {
        street: '100 Main Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        pincode: '94105',
      },
      taxId: '12-3456789',
      paymentTerms: 'net_15' as const,
      currency: 'USD',
      isActive: true,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Amit Sharma',
      companyName: 'Sharma & Co',
      email: 'amit@sharmaco.in',
      phone: '+91 98123 45678',
      billingAddress: {
        street: '78 Nehru Place',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        pincode: '110019',
      },
      taxId: '07AABCS1234F1Z5',
      paymentTerms: 'net_7' as const,
      currency: 'INR',
      isActive: true,
    },
  ];
  
  customers.forEach(c => CustomersStore.add(c));
  
  // Create sample products
  const products = [
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Web Development Service',
      description: 'Full-stack web application development',
      sacCode: '998314',
      unitPrice: 50000,
      unit: 'hrs' as const,
      taxRate: 18,
      taxType: 'CGST' as const,
      isService: true,
      isActive: true,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Mobile App Development',
      description: 'iOS and Android app development',
      sacCode: '998312',
      unitPrice: 75000,
      unit: 'hrs' as const,
      taxRate: 18,
      taxType: 'CGST' as const,
      isService: true,
      isActive: true,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Cloud Hosting - Basic',
      description: 'Basic cloud hosting package - Monthly',
      sacCode: '998315',
      unitPrice: 2999,
      unit: 'nos' as const,
      taxRate: 18,
      taxType: 'CGST' as const,
      isService: true,
      isActive: true,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'Laptop - Dell XPS 15',
      description: 'Dell XPS 15 Laptop, i7, 16GB RAM, 512GB SSD',
      sku: 'DELL-XPS15-001',
      hsnCode: '8471',
      unitPrice: 125000,
      unit: 'pcs' as const,
      taxRate: 18,
      taxType: 'CGST' as const,
      isService: false,
      isActive: true,
      stockQuantity: 10,
    },
    {
      userId,
      businessProfileId: businessProfile.id,
      name: 'UI/UX Design Service',
      description: 'User interface and experience design',
      sacCode: '998312',
      unitPrice: 35000,
      unit: 'hrs' as const,
      taxRate: 18,
      taxType: 'CGST' as const,
      isService: true,
      isActive: true,
    },
  ];
  
  products.forEach(p => ProductsStore.add(p));
}
