'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { BusinessProfile, Document, DocumentType, Quote } from '@/lib/types';
import { BusinessProfileStore, AuthStore, UserSettingsStore } from '@/lib/store';
import { ApiService } from '@/lib/api-service';
import { BusinessProfileForm } from '@/components/setup/business-profile-form';
import { AppSidebar, AppView } from '@/components/layout/app-sidebar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { InvoiceForm } from '@/components/invoices/invoice-form';
const InvoicePreview = dynamic(() => import('@/components/invoices/invoice-preview').then(mod => mod.InvoicePreview), { ssr: false });
import { CustomerList } from '@/components/customers/customer-list';
import { ProductList } from '@/components/products/product-list';
import { PaymentList } from '@/components/payments/payment-list';
import { SettingsView } from '@/components/settings/settings-view';
import { QuoteList } from '@/components/quotes/quote-list';
import { QuoteForm } from '@/components/quotes/quote-form';
const QuotePreview = dynamic(() => import('@/components/quotes/quote-preview').then(mod => mod.QuotePreview), { ssr: false });
import { LandingPage } from '@/components/landing/landing-page';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

type PageMode = 'list' | 'create' | 'edit' | 'view';

export default function InvoicePage() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  
  // Persist current view to localStorage
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('quotiq_current_view') as AppView) || 'dashboard';
    }
    return 'dashboard';
  });

  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | undefined>();
  const [selectedQuote, setSelectedQuote] = useState<Quote | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = AuthStore.getToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        setIsLoaded(true);
        return;
      }

      try {
        // Verify token and get user
        const userRes = await ApiService.auth.getMe();
        if (!userRes.data.data) {
          AuthStore.logout();
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          setIsLoaded(true);
          return;
        }
        AuthStore.setUser(userRes.data.data);
        setIsAuthenticated(true);

        // Load business profile (optional - new users may not have created one yet)
        try {
          const profileRes = await ApiService.business.get();
          if (profileRes.data.data) {
            setBusinessProfile(profileRes.data.data);
            BusinessProfileStore.set(profileRes.data.data);
          }
        } catch (profileError: any) {
          // 404 is expected if business profile not created yet
          if (profileError.response?.status !== 404) {
            console.warn('Failed to load business profile:', profileError);
          }
          setBusinessProfile(null);
        }

        // Load settings (optional - use defaults if not set)
        try {
          const settingsRes = await ApiService.settings.get();
          if (settingsRes.data.data) {
            UserSettingsStore.set(settingsRes.data.data);
          }
        } catch (settingsError: any) {
          console.warn('Failed to load settings:', settingsError);
          // Use default settings - not a fatal error
        }

        setIsCheckingAuth(false);
        setIsLoaded(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthStore.logout();
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        setIsLoaded(true);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      localStorage.setItem('quotiq_current_view', currentView);
    }
  }, [currentView, isAuthenticated]);

  const handleLogout = () => {
    AuthStore.logout();
    setIsAuthenticated(false);
    setBusinessProfile(null);
    setCurrentView('dashboard');
    localStorage.removeItem('quotiq_current_view');
    router.push('/');
  };

  const handleSetupComplete = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quotiq_current_view', view);
    }
    setPageMode('list');
    setSelectedDocument(undefined);
    setSelectedQuote(undefined);
  };

  const handleCreateInvoice = () => {
    setCurrentView('invoices');
    setPageMode('create');
    setSelectedDocument(undefined);
  };

  const handleCreateQuote = () => {
    setCurrentView('quotes');
    setPageMode('create');
    setSelectedQuote(undefined);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setPageMode('view');
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setPageMode('edit');
  };

  const handleDocumentComplete = (doc: Document) => {
    setSelectedDocument(doc);
    setPageMode('view');
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setCurrentView('quotes');
    setPageMode('view');
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setCurrentView('quotes');
    setPageMode('edit');
  };

  const handleQuoteComplete = (quote: Quote) => {
    setSelectedQuote(quote);
    setPageMode('view');
  };

  const handleQuoteConverted = (invoice: Document) => {
    // Navigate to the newly created invoice
    setCurrentView('invoices');
    setSelectedDocument(invoice);
    setPageMode('view');
  };

  const handlePaymentRecorded = () => {
    // Refresh handled inside InvoicePreview
  };

  const getDocumentTypeForView = (): DocumentType => {
    switch (currentView) {
      case 'invoices': return 'invoice';
      case 'proforma': return 'proforma';
      case 'credit_notes': return 'credit_note';
      default: return 'invoice';
    }
  };

  // Loading state - Blank page as requested by user to prevent flicker
  if (!isLoaded || isCheckingAuth) {
    return <div className="min-h-screen bg-background" />;
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Onboarding: if no business profile, show setup wizard
  if (!businessProfile) {
    return <BusinessProfileForm onComplete={handleSetupComplete} />;
  }

  const renderContent = () => {
    // ── QUOTES VIEW ──────────────────────────────────────────
    if (currentView === 'quotes') {
      if (pageMode === 'view' && selectedQuote) {
        return (
          <QuotePreview
            quote={selectedQuote}
            onBack={() => setPageMode('list')}
            onEdit={() => handleEditQuote(selectedQuote)}
            onConverted={handleQuoteConverted}
            onRefresh={() => {
              // reloads handled inside QuotePreview
            }}
          />
        );
      }
      if (pageMode === 'create') {
        return (
          <QuoteForm
            onComplete={handleQuoteComplete}
            onCancel={() => setPageMode('list')}
          />
        );
      }
      if (pageMode === 'edit' && selectedQuote) {
        return (
          <QuoteForm
            quote={selectedQuote}
            onComplete={handleQuoteComplete}
            onCancel={() => setPageMode('list')}
          />
        );
      }
      return (
        <QuoteList
          onCreateQuote={() => setPageMode('create')}
          onViewQuote={handleViewQuote}
          onEditQuote={handleEditQuote}
          onConvertToInvoice={handleQuoteConverted}
        />
      );
    }

    // ── INVOICE / PROFORMA / CREDIT NOTES VIEWS ──────────────
    const isDocumentView = ['invoices', 'proforma', 'credit_notes'].includes(currentView);
    if (isDocumentView) {
      const docType = getDocumentTypeForView();

      if (pageMode === 'view' && selectedDocument) {
        return (
          <InvoicePreview
            document={selectedDocument}
            onBack={() => setPageMode('list')}
            onEdit={() => handleEditDocument(selectedDocument)}
            onPaymentRecorded={handlePaymentRecorded}
          />
        );
      }
      if (pageMode === 'create') {
        return (
          <InvoiceForm
            documentType={docType}
            onComplete={handleDocumentComplete}
            onCancel={() => setPageMode('list')}
          />
        );
      }
      if (pageMode === 'edit' && selectedDocument) {
        return (
          <InvoiceForm
            document={selectedDocument}
            documentType={docType}
            onComplete={handleDocumentComplete}
            onCancel={() => setPageMode('list')}
          />
        );
      }
      return (
        <InvoiceList
          documentType={docType}
          onCreateInvoice={() => setPageMode('create')}
          onViewInvoice={handleViewDocument}
          onEditInvoice={handleEditDocument}
        />
      );
    }

    // ── OTHER VIEWS ───────────────────────────────────────────
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onCreateInvoice={handleCreateInvoice}
            onViewInvoice={handleViewDocument}
            onCreateQuote={handleCreateQuote}
            onViewQuote={handleViewQuote}
          />
        );
      case 'customers':
        return <CustomerList />;
      case 'products':
        return <ProductList />;
      case 'payments':
        return <PaymentList />;
      case 'settings':
        return (
          <SettingsView
            onProfileUpdated={() => {
              const updated = BusinessProfileStore.get();
              if (updated) setBusinessProfile(updated);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        businessProfile={businessProfile}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar - Mobile only */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {businessProfile.businessName}
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
