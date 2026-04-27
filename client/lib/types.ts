// ==========================================
// GLOBAL INVOICE & BILLING SAAS PLATFORM
// Core Type Definitions
// ==========================================

// Business Types
export type BusinessType = 
  | 'freelancer'
  | 'sole_proprietor'
  | 'partnership'
  | 'llp'
  | 'private_limited'
  | 'enterprise';

// Tax Systems
export type TaxSystem = 'GST' | 'VAT' | 'SALES_TAX' | 'NONE';

// Document Types
export type DocumentType = 
  | 'invoice'
  | 'proforma'
  | 'quote'
  | 'credit_note'
  | 'debit_note';

// Document Status
export type DocumentStatus = 
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'accepted'
  | 'approved'
  | 'rejected'
  | 'expired';

// Payment Methods
export type PaymentMethod = 
  | 'cash'
  | 'upi'
  | 'card'
  | 'bank_transfer'
  | 'cheque'
  | 'paypal'
  | 'stripe'
  | 'other';

// Payment Terms
export type PaymentTerms = 
  | 'due_on_receipt'
  | 'net_7'
  | 'net_15'
  | 'net_30'
  | 'net_45'
  | 'net_60'
  | 'custom';

// User Roles
export type UserRole = 'owner' | 'admin' | 'accountant' | 'staff';

// Tax Types (for line items)
export type TaxType = 
  | 'CGST'
  | 'SGST'
  | 'IGST'
  | 'VAT'
  | 'SALES_TAX'
  | 'NONE';

// Unit Types
export type UnitType = 
  | 'pcs'
  | 'kg'
  | 'g'
  | 'ltr'
  | 'ml'
  | 'hrs'
  | 'days'
  | 'sqft'
  | 'sqm'
  | 'nos'
  | 'box'
  | 'unit';

// ==========================================
// BUSINESS PROFILE
// ==========================================
export interface BusinessProfile {
  id: string;
  userId: string;
  businessType: BusinessType;
  businessName: string;
  legalName: string;
  registrationNumber?: string;
  taxId?: string; // GSTIN / VAT / EIN
  panNumber?: string; // India specific
  country: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  bankDetails?: BankDetails | BankDetails[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode?: string; // India
  swiftCode?: string; // International
  routingNumber?: string; // US
  iban?: string; // EU
  accountHolderName: string;
  branch?: string;
}

// ==========================================
// USER SETTINGS
// ==========================================
export interface UserSettings {
  id: string;
  userId: string;
  currency: string;
  taxSystem: TaxSystem;
  taxInclusive: boolean;
  defaultTaxRate: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
  quotePrefix: string;
  quoteStartNumber: number;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  defaultPaymentTerms: PaymentTerms;
  defaultNotes?: string;
  defaultTerms?: string;
  emailNotifications: boolean;
  reminderDays: number[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// CUSTOMER
// ==========================================
export interface Customer {
  id: string;
  userId: string;
  businessProfileId: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  addresses?: Address[];
  billingAddress?: Address; // Helper for frontend display
  shippingAddress?: Address; // Helper for frontend display
  taxId?: string; // Customer's GSTIN/VAT/EIN
  creditLimit?: number;
  paymentTerms: PaymentTerms;
  currency: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  totalSpent: number;
  totalOutstanding: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id?: string;
  type?: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

// ==========================================
// PRODUCT / SERVICE
// ==========================================
export interface Product {
  id: string;
  userId: string;
  businessProfileId: string;
  name: string;
  description?: string;
  sku?: string;
  hsnCode?: string; // India - Harmonized System of Nomenclature
  sacCode?: string; // India - Services Accounting Code
  barcode?: string;
  unitPrice: number;
  unit: UnitType;
  taxRate: number;
  taxType: TaxType;
  category?: string;
  isService: boolean;
  isActive: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// DOCUMENT (Invoice/Quote/Credit Note etc.)
// ==========================================
export interface Document {
  id: string;
  userId: string;
  businessProfileId: string;
  type: DocumentType;
  documentNumber: string;
  customerId: string;
  customer?: Customer;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate: number;
  items: DocumentItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  status: DocumentStatus;
  taxBreakdown: TaxBreakdown[];
  notes?: string;
  terms?: string;
  attachments?: string[];
  customFields?: CustomField[];
  referenceNumber?: string;
  placeOfSupply?: string; // For GST
  validityPeriod?: number; // For proforma
  incoterms?: string; // For proforma
  deliveryTerms?: string; // For proforma
  reason?: string; // For credit notes
  reasonCode?: string; // For credit notes
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  paidAt?: Date;
}

export interface DocumentItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  totalBeforeTax: number;
  totalAfterTax: number;
  sku?: string;
}

export interface TaxBreakdown {
  taxType: TaxType;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface CustomField {
  key: string;
  value: string;
  visible: boolean;
}

// ==========================================
// PAYMENT
// ==========================================
export interface Payment {
  id: string;
  documentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentDate: Date;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

// ==========================================
// TEAM (Enterprise Support)
// ==========================================
export interface Team {
  id: string;
  businessProfileId: string;
  name: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
}

export interface Permission {
  resource: 'invoices' | 'quotes' | 'customers' | 'products' | 'reports' | 'settings';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
export interface DashboardStats {
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  recentDocuments: Document[];
  topCustomers: { customer: Customer; totalSpent: number }[];
  topProducts: { product: Product; totalSold: number }[];
  monthlyRevenue: { month: string; revenue: number; invoices: number }[];
  revenueByStatus: { status: DocumentStatus; amount: number }[];
}

// ==========================================
// CURRENCY DATA
// ==========================================
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

// ==========================================
// COUNTRY TAX CONFIG
// ==========================================
export interface CountryTaxConfig {
  country: string;
  taxSystem: TaxSystem;
  defaultTaxRate: number;
  taxIdLabel: string;
  taxIdFormat: string;
  requiresStateForTax: boolean;
  states?: { code: string; name: string }[];
}

// ==========================================
// QUOTE SYSTEM
// ==========================================

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted';

export type QuoteActivityAction =
  | 'created'
  | 'edited'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'duplicated'
  | 'comment';

export interface Quote {
  id: string;
  userId: string;
  businessProfileId: string;
  customerId: string;
  quoteNumber: string;
  status: QuoteStatus;
  issueDate: Date;
  expiryDate: Date;
  currency: string;
  exchangeRate: number;
  items: QuoteItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakdown: TaxBreakdown[];
  notes?: string;
  terms?: string;
  referenceNumber?: string;
  placeOfSupply?: string;
  // Linked invoice after conversion
  convertedInvoiceId?: string;
  // Version tracking
  versionNumber: number;
  // Unique public share token
  shareToken: string;
  // Client comment on approval/rejection
  clientComment?: string;
  customFields?: CustomField[];
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface QuoteItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  sku?: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  totalBeforeTax: number;
  totalAfterTax: number;
  isOptional?: boolean; // Client can choose to include or exclude
}

export interface QuoteVersion {
  id: string;
  quoteId: string;
  versionNumber: number;
  snapshotJson: string; // JSON.stringify of the Quote at that point
  changeNote?: string;
  createdAt: Date;
}

export interface QuoteActivityLog {
  id: string;
  quoteId: string;
  action: QuoteActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ==========================================
// QUOTE ANALYTICS
// ==========================================
export interface QuoteDashboardStats {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  convertedQuotes: number;
  conversionRate: number; // approved / total sent
  totalPipelineValue: number; // sum of all non-rejected quote grandTotals
  approvedValue: number;
  recentQuotes: Quote[];
  conversionFunnel: { stage: string; count: number; value: number }[];
}

// ==========================================
// INVOICE TEMPLATE CUSTOMIZATION
// ==========================================
export interface InvoiceTemplate {
  id: string;
  name: string;
  showLogo: boolean;
  showTaxBreakdown: boolean;
  showHsnSac: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showDiscount: boolean;
  showShippingAddress: boolean;
  showBankDetails: boolean;
  showSignature: boolean;
  showQRCode: boolean;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  layout: 'modern' | 'traditional';
  headerText?: string;
  footerText?: string;
}

export interface QuoteTemplate extends InvoiceTemplate {}

export interface TemplateSettings {
  invoiceTemplate: InvoiceTemplate;
  quoteTemplate: QuoteTemplate;
}
