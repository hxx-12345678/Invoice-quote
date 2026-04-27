'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessProfile } from '@/lib/types';
import { AuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  FileQuestion,
  FileMinus,
  FilePlus,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Building2,
  Receipt,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

export type AppView =
  | 'dashboard'
  | 'invoices'
  | 'quotes'
  | 'proforma'
  | 'credit_notes'
  | 'customers'
  | 'products'
  | 'payments'
  | 'settings';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  badge?: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { id: 'invoices', label: 'Invoices', icon: FileText, section: 'Documents' },
  { id: 'quotes', label: 'Quotes', icon: FileQuestion },
  { id: 'proforma', label: 'Proforma', icon: Receipt },
  { id: 'credit_notes', label: 'Credit Notes', icon: FileMinus },
  { id: 'customers', label: 'Customers', icon: Users, section: 'Management' },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard, section: 'Finance' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
];

interface AppSidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout?: () => void;
  businessProfile: BusinessProfile | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({
  currentView,
  onViewChange,
  onLogout,
  businessProfile,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const handleNavClick = (view: AppView) => {
    onViewChange(view);
    onMobileClose();
  };

  const router = useRouter();

  const handleLogout = () => {
    AuthStore.logout();
    if (onLogout) {
      onLogout();
    } else {
      router.push('/');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Business Name */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-sidebar-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {businessProfile?.businessName || 'Quotiq'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate leading-tight capitalize">
              {businessProfile?.businessType?.replace('_', ' ') || 'Billing Platform'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showSection = item.section && (
            index === 0 || NAV_ITEMS[index - 1].section !== item.section
          );

          return (
            <div key={item.id}>
              {showSection && !collapsed && (
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 py-2 mt-2">
                  {item.section}
                </p>
              )}
              {showSection && collapsed && index !== 0 && (
                <div className="my-2 border-t border-sidebar-border/50" />
              )}
              <button
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge className="h-5 text-xs bg-primary/20 text-primary">{item.badge}</Badge>
                    )}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            'w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'justify-center px-2' : 'justify-between'
          )}
        >
          {!collapsed && <span className="text-xs">Collapse</span>}
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-[60px]' : 'w-[220px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] bg-sidebar border-r border-sidebar-border flex flex-col md:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-sm font-semibold text-sidebar-foreground">
              {businessProfile?.businessName || 'Quotiq'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const showSection = item.section && (
              index === 0 || NAV_ITEMS[index - 1].section !== item.section
            );
            return (
              <div key={item.id}>
                {showSection && (
                  <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 py-2 mt-2">
                    {item.section}
                  </p>
                )}
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
