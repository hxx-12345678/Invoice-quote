'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote, QuoteStatus } from '@/lib/types';
import {
  QuotesStore,
  CustomersStore,
  UserSettingsStore,
  BusinessProfileStore,
  formatCurrency,
  formatDate,
} from '@/lib/store';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileQuestion,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'Sent', className: 'bg-primary/10 text-primary', icon: Send },
  viewed: { label: 'Viewed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { label: 'Expired', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle },
  converted: { label: 'Converted', className: 'bg-accent/15 text-accent-foreground', icon: ArrowRight },
};

const STATUS_FILTERS: { label: string; value: QuoteStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
  { label: 'Converted', value: 'converted' },
];

interface QuoteListProps {
  onCreateQuote: () => void;
  onViewQuote: (quote: Quote) => void;
  onEditQuote: (quote: Quote) => void;
  onConvertToInvoice?: (invoice: import('@/lib/types').Document) => void;
}

export function QuoteList({ onCreateQuote, onViewQuote, onEditQuote, onConvertToInvoice }: QuoteListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const settings = UserSettingsStore.get();
  const currency = settings?.currency || 'INR';

  const loadQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = BusinessProfileStore.get();
      if (!profile?.id) {
        const allQuotes = QuotesStore.getAll();
        setQuotes(allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        return;
      }
      const response = await ApiService.quotes.getAll(profile.id);
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setQuotes(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      console.error('Failed to load quotes from API:', error);
      const allQuotes = QuotesStore.getAll();
      setQuotes(allQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const filtered = quotes.filter(q => {
    const customer = CustomersStore.get(q.customerId);
    const matchesSearch =
      !searchQuery ||
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = (quote: Quote) => {
    const newNumber = QuotesStore.getNextNumber(settings!);
    QuotesStore.duplicate(quote.id, newNumber);
    loadQuotes();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      try {
        await ApiService.quotes.delete(id);
        QuotesStore.delete(id);
        toast.success('Quote deleted successfully');
        loadQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
        QuotesStore.delete(id);
        toast.success('Local quote deleted successfully');
        loadQuotes();
      }
    }
  };

  const handleMarkSent = async (quote: Quote) => {
    try {
      await ApiService.quotes.update(quote.id, { status: 'sent', sentAt: new Date() });
      QuotesStore.update(quote.id, { status: 'sent', sentAt: new Date() });
      toast.success('Quote marked as sent');
      loadQuotes();
    } catch (error) {
      console.error('Error marking quote as sent:', error);
      QuotesStore.update(quote.id, { status: 'sent', sentAt: new Date() });
      toast.success('Local quote marked as sent');
      loadQuotes();
    }
  };

  const handleMarkApproved = async (id: string) => {
    try {
      await ApiService.quotes.update(id, { status: 'approved' });
      QuotesStore.update(id, { status: 'approved' }, 'approved', 'Client approved');
      toast.success('Quote approved');
      loadQuotes();
    } catch (error) {
      console.error('Error approving quote:', error);
      QuotesStore.update(id, { status: 'approved' }, 'approved', 'Client approved');
      toast.success('Local quote approved');
      loadQuotes();
    }
  };

  const handleMarkRejected = async (id: string) => {
    try {
      await ApiService.quotes.update(id, { status: 'rejected' });
      QuotesStore.update(id, { status: 'rejected' }, 'rejected', 'Client rejected');
      toast.success('Quote rejected');
      loadQuotes();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      QuotesStore.update(id, { status: 'rejected' }, 'rejected', 'Client rejected');
      toast.success('Local quote rejected');
      loadQuotes();
    }
  };

  const handleDownloadPdf = (quote: Quote) => {
    onViewQuote(quote);
    toast.info('Opening preview for download...');
  };

  const handleConvert = (quote: Quote) => {
    if (quote.status !== 'approved') {
      if (!confirm('This quote is not yet approved. Convert anyway?')) return;
    }
    const invoice = QuotesStore.convertToInvoice(quote.id);
    if (invoice && onConvertToInvoice) {
      onConvertToInvoice(invoice);
    }
    loadQuotes();
  };

  const totalPipeline = filtered
    .filter(q => !['rejected', 'expired', 'converted'].includes(q.status))
    .reduce((sum, q) => sum + q.grandTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quotes</h2>
          <p className="text-muted-foreground text-sm">
            Manage proposals and convert to invoices
          </p>
        </div>
        <Button onClick={onCreateQuote} className="gap-2">
          <Plus className="h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Pipeline Value Banner */}
      {totalPipeline > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileQuestion className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Pipeline Value</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalPipeline, currency)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes by number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-base font-semibold text-foreground">No quotes found</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first quote to start closing deals'}
          </p>
          {statusFilter === 'all' && !searchQuery && (
            <Button onClick={onCreateQuote} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Quote
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quote #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Issue Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Expiry</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(quote => {
                  const customer = CustomersStore.get(quote.customerId);
                  const cfg = STATUS_CONFIG[quote.status];
                  const StatusIcon = cfg.icon;
                  const isExpiringSoon =
                    ['sent', 'viewed'].includes(quote.status) &&
                    new Date(quote.expiryDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                  const canConvert = ['approved', 'sent', 'viewed'].includes(quote.status) && quote.status !== 'converted';
                  const canEdit = ['draft', 'rejected'].includes(quote.status);

                  return (
                    <tr
                      key={quote.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onViewQuote(quote)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{quote.quoteNumber}</span>
                          {quote.versionNumber > 1 && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              v{quote.versionNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {customer?.name || 'Unknown'}
                          </p>
                          {customer?.companyName && (
                            <p className="text-xs text-muted-foreground">{customer.companyName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(quote.issueDate, settings?.dateFormat)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-sm ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                          {isExpiringSoon && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                          {formatDate(quote.expiryDate, settings?.dateFormat)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(quote.grandTotal, quote.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${cfg.className} gap-1 text-xs`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewQuote(quote)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => onEditQuote(quote)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleMarkSent(quote)}>
                                <Send className="h-4 w-4 mr-2" /> Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={() => handleMarkApproved(quote.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Approved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkRejected(quote.id)}>
                                  <XCircle className="h-4 w-4 mr-2" /> Mark Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleDownloadPdf(quote)}>
                              <Download className="h-4 w-4 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            {canConvert && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleConvert(quote)}
                                  className="text-accent-foreground font-medium"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" /> Convert to Invoice
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDuplicate(quote)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(quote.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            Showing {filtered.length} of {quotes.length} quotes
          </div>
        </div>
      )}
    </div>
  );
}
