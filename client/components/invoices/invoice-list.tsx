'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Document, DocumentType, DocumentStatus } from '@/lib/types';
import {
  DocumentsStore,
  CustomersStore,
  BusinessProfileStore,
  formatCurrency,
  formatDate,
  UserSettingsStore
} from '@/lib/store';
import { ApiService } from '@/lib/api-service';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Send,
  Download,
  Copy,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FilePlus2
} from 'lucide-react';
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';

interface InvoiceListProps {
  onCreateInvoice: () => void;
  onViewInvoice: (invoice: Document) => void;
  onEditInvoice: (invoice: Document) => void;
  documentType?: DocumentType;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', icon: Send, className: 'bg-primary/10 text-primary' },
  paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partially_paid: { label: 'Partial', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground line-through' },
  accepted: { label: 'Accepted', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', icon: Clock, className: 'bg-orange-100 text-orange-700' },
};

export function InvoiceList({
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  documentType = 'invoice'
}: InvoiceListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const settings = UserSettingsStore.get();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [documentType]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const profile = BusinessProfileStore.get();
      if (!profile?.id) {
        // Fallback
        const allDocs = DocumentsStore.getByType(documentType);
        setDocuments(allDocs.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        return;
      }
      const response = await ApiService.documents.getAll(profile.id, documentType);
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setDocuments(data.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        // Note: syncing to store might be complex depending on existing state, but let's do simple override or just rely on API data
      }
    } catch (error) {
      console.error('Failed to load documents from API:', error);
      // Fallback
      const allDocs = DocumentsStore.getByType(documentType);
      setDocuments(allDocs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      CustomersStore.get(doc.customerId)?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await ApiService.documents.delete(id);
        DocumentsStore.delete(id);
        toast.success('Document deleted successfully');
        loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        DocumentsStore.delete(id);
        toast.success('Local document deleted successfully');
        loadDocuments();
      }
    }
  };

  const handleDuplicate = (doc: Document) => {
    const newDoc = {
      ...doc,
      id: undefined,
      documentNumber: DocumentsStore.getNextNumber(documentType, settings!),
      status: 'draft' as DocumentStatus,
      issueDate: new Date(),
      amountPaid: 0,
      amountDue: doc.grandTotal,
      sentAt: undefined,
      paidAt: undefined,
    };
    DocumentsStore.add(newDoc as Omit<Document, 'id' | 'createdAt' | 'updatedAt'>);
    loadDocuments();
  };

  const handleMarkAsSent = async (id: string) => {
    try {
      await ApiService.documents.update(id, { status: 'sent', sentAt: new Date() });
      DocumentsStore.update(id, { status: 'sent', sentAt: new Date() });
      toast.success('Document marked as sent');
      loadDocuments();
    } catch (error) {
      console.error('Error marking as sent:', error);
      DocumentsStore.update(id, { status: 'sent', sentAt: new Date() });
      toast.success('Local document marked as sent');
      loadDocuments();
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const doc = DocumentsStore.get(id) || documents.find(d => d.id === id);
    if (doc) {
      try {
        const updateData: Partial<Document> = {
          status: 'paid',
          paidAt: new Date(),
          amountPaid: doc.grandTotal,
          amountDue: 0
        };
        await ApiService.documents.update(id, updateData);
        DocumentsStore.update(id, updateData);
        toast.success('Invoice marked as paid');
        loadDocuments();
      } catch (error) {
        console.error('Error marking as paid:', error);
        DocumentsStore.update(id, {
          status: 'paid',
          paidAt: new Date(),
          amountPaid: doc.grandTotal,
          amountDue: 0
        });
        toast.success('Local invoice marked as paid');
        loadDocuments();
      }
    }
  };

  const handleDownloadPdf = (doc: Document) => {
    onViewInvoice(doc);
    toast.info('Opening preview for download...');
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'invoice': return 'Invoices';
      case 'quote': return 'Quotes/Estimates';
      case 'proforma': return 'Proforma Invoices';
      case 'credit_note': return 'Credit Notes';
      case 'debit_note': return 'Debit Notes';
      default: return 'Documents';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{getDocumentTypeLabel()}</h2>
          <p className="text-muted-foreground">
            Manage and track your {documentType === 'invoice' ? 'invoices' : 'documents'}
          </p>
        </div>
        <Button onClick={onCreateInvoice} className="gap-2">
          <Plus className="h-4 w-4" />
          Create {documentType === 'invoice' ? 'Invoice' : documentType === 'quote' ? 'Quote' : 'Document'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredDocuments.length} documents</Badge>
      </div>

      {filteredDocuments.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <FilePlus2 />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No {documentType}s yet</EmptyTitle>
            <EmptyDescription>Create your first {documentType} to get started</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onCreateInvoice} className="gap-2">
              <Plus className="h-4 w-4" />
              Create {documentType === 'invoice' ? 'Invoice' : 'Document'}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const customer = CustomersStore.get(doc.customerId);
                const statusConfig = STATUS_CONFIG[doc.status];
                const StatusIcon = statusConfig.icon;
                const isOverdue = doc.status !== 'paid' &&
                  doc.status !== 'cancelled' &&
                  new Date(doc.dueDate) < new Date();

                return (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewInvoice(doc)}
                  >
                    <TableCell>
                      <div className="font-medium text-foreground">{doc.documentNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {customer?.name || 'Unknown'}
                      </div>
                      {customer?.companyName && (
                        <div className="text-sm text-muted-foreground">
                          {customer.companyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(doc.issueDate, settings?.dateFormat)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={isOverdue && doc.status !== 'paid' ? 'text-destructive' : ''}>
                        {formatDate(doc.dueDate, settings?.dateFormat)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {formatCurrency(doc.grandTotal, doc.currency)}
                      </div>
                      {doc.amountDue > 0 && doc.amountDue < doc.grandTotal && (
                        <div className="text-sm text-muted-foreground">
                          Due: {formatCurrency(doc.amountDue, doc.currency)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewInvoice(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {doc.status === 'draft' && (
                            <DropdownMenuItem onClick={() => onEditInvoice(doc)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(doc)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPdf(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Quick Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {doc.status !== 'sent' && doc.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsSent(doc.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                          {doc.type === 'invoice' && doc.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(doc.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {doc.type === 'quote' && doc.status !== 'accepted' && (
                            <DropdownMenuItem onClick={() => {
                              ApiService.documents.update(doc.id, { status: 'accepted' });
                              DocumentsStore.update(doc.id, { status: 'accepted' });
                              loadDocuments();
                              toast.success('Quote marked as accepted');
                            }}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Accepted
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
