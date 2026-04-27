'use client';

import { useState, useMemo, useRef } from 'react';
import { Quote, QuoteStatus, Document } from '@/lib/types';
import {
  QuotesStore,
  BusinessProfileStore,
  CustomersStore,
  UserSettingsStore,
  TemplateStore,
  formatCurrency,
  formatDate,
} from '@/lib/store';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Download,
  Send,
  Printer,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
  Copy,
  Share2,
  Mail,
  Phone,
  Globe,
  Building2,
  ToggleLeft,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import { QuoteActivityPanel } from '@/components/quotes/quote-activity';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', icon: FileText },
  sent: { label: 'Sent', className: 'bg-primary/10 text-primary', icon: Send },
  viewed: { label: 'Viewed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { label: 'Expired', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle },
  converted: { label: 'Converted to Invoice', className: 'bg-accent/15 text-accent-foreground font-medium', icon: ArrowRight },
};

interface QuotePreviewProps {
  quote: Quote;
  onBack: () => void;
  onEdit: () => void;
  onConverted?: (invoice: Document) => void;
  onRefresh?: () => void;
}

export function QuotePreview({ quote: initialQuote, onBack, onEdit, onConverted, onRefresh }: QuotePreviewProps) {
  const [currentQuote, setCurrentQuote] = useState<Quote>(initialQuote);
  const [convertDialog, setConvertDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [clientComment, setClientComment] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sharing Dialog State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'email' | 'whatsapp'>('email');
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const businessProfile = BusinessProfileStore.get();
  const customer = CustomersStore.get(currentQuote.customerId);
  const settings = UserSettingsStore.get();

  const statusCfg = STATUS_CONFIG[currentQuote.status];
  const StatusIcon = statusCfg.icon;
  const previewRef = useRef<HTMLDivElement | null>(null);
  const templates = TemplateStore.get();
  const template = templates.quoteTemplate;

  const generatePdfBlob = async () => {
    if (!previewRef.current) {
      throw new Error('Preview not available for PDF generation');
    }
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: globalThis.Document) => {
        const styleTags = clonedDoc.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          let css = styleTags[i].innerHTML;
          if (css.includes('oklch(') || css.includes('lab(')) {
            styleTags[i].innerHTML = css.replace(/oklch\([^)]+\)/g, '#000000').replace(/lab\([^)]+\)/g, '#000000');
          }
        }
      }
    } as any);
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate aspect ratio manually to avoid getImageProperties issues
    const canvasAspectRatio = canvas.width / canvas.height;
    const imgWidth = pageWidth;
    const imgHeight = pageWidth / canvasAspectRatio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    return pdf.output('blob');
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentQuote.quoteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Quote PDF generation failed', error);
      toast.error('Unable to download PDF.');
    }
  };

  const handleSendEmail = () => {
    setShareType('email');
    setShareRecipient(customer?.email || '');
    setShareSubject(`Quote ${currentQuote.quoteNumber}`);
    setShareMessage(`Hi ${customer?.name || 'Customer'},\n\nPlease find attached the quote ${currentQuote.quoteNumber}.\n\nThank you,\n${businessProfile?.businessName || ''}`);
    setShareDialogOpen(true);
  };

  const handleSendWhatsApp = () => {
    setShareType('whatsapp');
    setShareRecipient(customer?.phone || '');
    setShareMessage(`Hi ${customer?.name || 'Customer'}, here is your quote ${currentQuote.quoteNumber}: ${window.location.origin}/quote/${currentQuote.shareToken}`);
    setShareDialogOpen(true);
  };

  const handleConfirmShare = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const file = new File([blob], `${currentQuote.quoteNumber}.pdf`, { type: 'application/pdf' });

      if (shareType === 'email') {
        const subject = encodeURIComponent(shareSubject);
        const body = encodeURIComponent(shareMessage);

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              title: shareSubject,
              text: shareMessage,
              files: [file],
            });
            setShareDialogOpen(false);
            return;
          } catch (e) {
            console.warn('Share failed, falling back to mailto', e);
          }
        }

        window.location.href = `mailto:${shareRecipient}?subject=${subject}&body=${body}`;
      } else {
        const rawPhone = shareRecipient;
        if (!rawPhone) {
          toast.error('WhatsApp number is required');
          return;
        }

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Quote ${currentQuote.quoteNumber}`,
              text: shareMessage,
            });
            setShareDialogOpen(false);
            return;
          } catch (e) {
            console.warn('Share failed, falling back to wa.me', e);
          }
        }

        const normalizedPhone = rawPhone.replace(/[^\d+]/g, '').replace(/^\+/, '');
        const text = encodeURIComponent(shareMessage);
        window.open(`https://wa.me/${normalizedPhone}?text=${text}`, '_blank');
      }
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Share failed', error);
      toast.error(`Unable to prepare ${shareType}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const refresh = () => {
    const updated = QuotesStore.get(currentQuote.id);
    if (updated) setCurrentQuote(updated);
    onRefresh?.();
  };

  const handleMarkSent = () => {
    QuotesStore.update(currentQuote.id, { status: 'sent', sentAt: new Date() }, 'sent', 'Marked as sent');
    refresh();
  };

  const handleMarkViewed = () => {
    if (currentQuote.status === 'sent') {
      QuotesStore.update(currentQuote.id, { status: 'viewed', viewedAt: new Date() }, 'viewed', 'Marked as viewed');
      refresh();
    }
  };

  const handleApprove = () => {
    QuotesStore.update(
      currentQuote.id,
      { status: 'approved', approvedAt: new Date(), clientComment: clientComment || undefined },
      'approved',
      'Quote approved'
    );
    setApproveDialog(false);
    setClientComment('');
    refresh();
  };

  const handleReject = () => {
    QuotesStore.update(
      currentQuote.id,
      { status: 'rejected', rejectedAt: new Date(), clientComment: clientComment || undefined },
      'rejected',
      'Quote rejected'
    );
    setRejectDialog(false);
    setClientComment('');
    refresh();
  };

  const handleConvert = () => {
    const invoice = QuotesStore.convertToInvoice(currentQuote.id);
    setConvertDialog(false);
    refresh();
    if (invoice && onConverted) {
      onConverted(invoice);
    }
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/quote/${currentQuote.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const handlePrint = () => window.print();

  const daysUntilExpiry = Math.ceil(
    (new Date(currentQuote.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 3;

  const canEdit = ['draft', 'rejected'].includes(currentQuote.status);
  const canSend = currentQuote.status === 'draft';
  const canApproveReject = ['sent', 'viewed'].includes(currentQuote.status);
  const canConvert = ['approved', 'sent', 'viewed'].includes(currentQuote.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{currentQuote.quoteNumber}</h2>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              <Badge className={`${statusCfg.className} gap-1`}>
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </Badge>
              {currentQuote.sentAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Sent on {new Date(currentQuote.sentAt).toLocaleDateString()}
                </span>
              )}
              <span className="text-sm text-muted-foreground">{customer?.name}</span>
              {currentQuote.versionNumber > 1 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  v{currentQuote.versionNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
          {canSend && (
            <Button variant="outline" size="sm" onClick={handleMarkSent} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Mark Sent
            </Button>
          )}
          {canApproveReject && currentQuote.status === 'sent' && (
            <Button variant="outline" size="sm" onClick={handleMarkViewed} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Mark Viewed
            </Button>
          )}
          {canApproveReject && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                onClick={() => setApproveDialog(true)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setRejectDialog(true)}
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {canConvert && (
            <Button
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setConvertDialog(true)}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Convert to Invoice
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendEmail} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendWhatsApp} className="gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareLink} className="gap-1.5 relative">
            <Share2 className="h-3.5 w-3.5" />
            Share Link
            {shareToast && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                Link copied!
              </span>
            )}
          </Button>
          <QuoteActivityPanel quote={currentQuote} />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expiry Warning */}
      {(isExpiringSoon || isExpired) && !['converted', 'rejected', 'approved'].includes(currentQuote.status) && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          isExpired
            ? 'bg-destructive/5 border-destructive/20 text-destructive'
            : 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400'
        } print:hidden`}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            {isExpired
              ? `This quote expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago.`
              : `This quote expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`
            }
          </p>
        </div>
      )}

      {/* Client Comment */}
      {currentQuote.clientComment && (
        <div className="p-4 rounded-xl border border-border bg-muted/30 print:hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {currentQuote.status === 'approved' ? 'Approval Note' : 'Rejection Note'}
          </p>
          <p className="text-sm text-foreground">{currentQuote.clientComment}</p>
        </div>
      )}

      {/* Converted Invoice Link */}
      {currentQuote.convertedInvoiceId && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20 print:hidden">
          <ArrowRight className="h-4 w-4 text-accent flex-shrink-0" />
          <p className="text-sm">
            <span className="font-medium text-foreground">Converted to invoice.</span>{' '}
            <span className="text-muted-foreground">Invoice ID: {currentQuote.convertedInvoiceId}</span>
          </p>
        </div>
      )}

      {/* Quote Document */}
      <div 
        ref={previewRef} 
        className="bg-card border border-border shadow-sm p-8 print:shadow-none print:border-none transition-all duration-300"
        style={{ 
          fontFamily: template?.fontFamily || 'Inter, sans-serif',
          borderRadius: template?.borderRadius || '8px'
        }}
      >
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
          <div className="min-w-0">
            {template?.showLogo && businessProfile?.logoUrl ? (
              <img src={businessProfile.logoUrl} alt={businessProfile.businessName} className="h-16 object-contain mb-2" />
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">{businessProfile?.businessName || 'Your Business'}</h1>
              </div>
            )}
            {template?.headerText && (
              <p className="text-sm text-muted-foreground mb-4">{template.headerText}</p>
            )}
            {businessProfile && (
              <div className="text-sm text-muted-foreground space-y-0.5 mt-2">
                <p>{businessProfile.address}</p>
                <p>{businessProfile.city}, {businessProfile.state} {businessProfile.pincode}</p>
                <p>{businessProfile.country}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5">
                  {businessProfile.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{businessProfile.email}</span>
                  )}
                  {businessProfile.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{businessProfile.phone}</span>
                  )}
                </div>
                {businessProfile.taxId && (
                  <p className="mt-1">
                    {settings?.taxSystem === 'GST' ? 'GSTIN' : settings?.taxSystem === 'VAT' ? 'VAT No' : 'Tax ID'}: {businessProfile.taxId}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-1.5 rounded-lg bg-primary/5 border border-primary/10 mb-2">
              <h2 className="text-lg font-bold uppercase tracking-widest" style={{ color: template?.primaryColor || 'var(--primary)' }}>Quote</h2>
            </div>
            <p className="text-2xl font-bold text-foreground">{currentQuote.quoteNumber}</p>
            {currentQuote.referenceNumber && (
              <p className="text-sm text-muted-foreground mt-1">Ref: {currentQuote.referenceNumber}</p>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bill To + Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" style={{ color: template?.primaryColor }}>Quote For</h3>
            {customer && (
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">{customer.name}</p>
                {customer.companyName && <p className="text-foreground">{customer.companyName}</p>}
                <p className="text-muted-foreground text-sm">{customer.billingAddress?.street || ''}</p>
                <p className="text-muted-foreground text-sm">
                  {customer.billingAddress?.city || ''}, {customer.billingAddress?.state || ''} - {customer.billingAddress?.pincode || ''}
                </p>
                <p className="text-muted-foreground text-sm">{customer.billingAddress?.country || ''}</p>
                {customer.taxId && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {settings?.taxSystem === 'GST' ? 'GSTIN' : 'Tax ID'}: {customer.taxId}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">{customer.email}</p>
              </div>
            )}
          </div>
          <div className="md:text-right">
            <div className="space-y-2">
              {[
                { label: 'Quote Date', val: formatDate(currentQuote.issueDate, settings?.dateFormat) },
                { label: 'Valid Until', val: formatDate(currentQuote.expiryDate, settings?.dateFormat) },
                { label: 'Currency', val: currentQuote.currency },
              ].map(row => (
                <div key={row.label} className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground text-sm">{row.label}:</span>
                  <span className={`text-sm font-medium ${row.label === 'Valid Until' && isExpiringSoon ? 'text-orange-600' : ''}`}>
                    {row.val}
                  </span>
                </div>
              ))}
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-muted-foreground text-sm">Status:</span>
                <Badge className={`${statusCfg.className} text-xs gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-border rounded-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground">Description</th>
                {settings?.taxSystem === 'GST' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground hidden lg:table-cell">HSN/SAC</th>
                )}
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground hidden sm:table-cell">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground hidden sm:table-cell">Rate</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground hidden md:table-cell">Tax</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentQuote.items.map((item, idx) => (
                <tr key={item.id} className={`border-t border-border ${item.isOptional ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        {item.isOptional && (
                          <Badge className="text-xs mt-1 bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">Optional</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  {settings?.taxSystem === 'GST' && (
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {item.hsnCode || item.sacCode || '—'}
                    </td>
                  )}
                  <td className="text-right px-4 py-3 text-sm hidden sm:table-cell">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right px-4 py-3 text-sm hidden sm:table-cell">
                    {formatCurrency(item.unitPrice, currentQuote.currency)}
                    {item.discountPercent > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">-{item.discountPercent}%</span>
                    )}
                  </td>
                  <td className="text-right px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {item.taxRate}%
                  </td>
                  <td className={`text-right px-4 py-3 text-sm font-medium ${item.isOptional ? 'line-through text-muted-foreground' : ''}`}>
                    {formatCurrency(item.totalAfterTax, currentQuote.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(currentQuote.subtotal, currentQuote.currency)}</span>
            </div>
            {currentQuote.discountTotal > 0 && (
              <div className="flex justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-{formatCurrency(currentQuote.discountTotal, currentQuote.currency)}</span>
              </div>
            )}
            {template?.showTaxBreakdown && currentQuote.taxBreakdown?.length > 0 && (
              <>
                {currentQuote.taxBreakdown?.map((tax, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">{tax.taxType} @ {tax.taxRate}%</span>
                    <span>{formatCurrency(tax.taxAmount, currentQuote.currency)}</span>
                  </div>
                ))}
                <Separator />
              </>
            )}
            <div className="flex justify-between py-2">
              <span className="text-base font-bold" style={{ color: template?.primaryColor || 'inherit' }}>Total</span>
              <span className="text-base font-bold" style={{ color: template?.primaryColor || 'inherit' }}>
                {formatCurrency(currentQuote.grandTotal, currentQuote.currency)}
              </span>
            </div>
            {currentQuote.items.some(i => i.isOptional) && (
              <p className="text-xs text-muted-foreground italic">
                * Optional items are shown with strikethrough and not included in total.
              </p>
            )}
          </div>
        </div>

        {/* Notes & Terms */}
        {(currentQuote.notes || currentQuote.terms) && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentQuote.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" style={{ color: template?.primaryColor }}>Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentQuote.notes}</p>
                </div>
              )}
              {currentQuote.terms && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" style={{ color: template?.primaryColor }}>Terms & Conditions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentQuote.terms}</p>
                </div>
              )}
            </div>
          </>
        )}

        {template?.footerText && (
          <>
            <Separator className="my-8" />
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{template.footerText}</div>
          </>
        )}
        {template?.showSignature && (
          <>
            <Separator className="my-8" />
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="h-12 border-b border-border mb-1" />
                <p className="text-xs text-muted-foreground">{businessProfile?.businessName}</p>
                <p className="text-xs text-muted-foreground">Authorised Signatory</p>
              </div>
              <div>
                <div className="h-12 border-b border-border mb-1" />
                <p className="text-xs text-muted-foreground">{customer?.name}</p>
                <p className="text-xs text-muted-foreground">Client Acceptance</p>
              </div>
            </div>
            <Separator className="my-6" />
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">
          This quote is valid until {formatDate(currentQuote.expiryDate, settings?.dateFormat)}. Prices are subject to change after expiry.
        </p>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Quote</DialogTitle>
            <DialogDescription>
              Mark this quote as approved and optionally add a note from the client.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="approve-comment">Client Note (optional)</Label>
            <Textarea
              id="approve-comment"
              value={clientComment}
              onChange={e => setClientComment(e.target.value)}
              placeholder="e.g., Approved. Please proceed with the project."
              rows={3}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={handleApprove}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Mark this quote as rejected. You can duplicate it to create a revised version.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-comment">Reason / Note (optional)</Label>
            <Textarea
              id="reject-comment"
              value={clientComment}
              onChange={e => setClientComment(e.target.value)}
              placeholder="e.g., Price too high. Please revise."
              rows={3}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={handleReject}
            >
              <XCircle className="h-4 w-4" /> Reject Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={convertDialog} onOpenChange={setConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              This will create a new invoice from quote {currentQuote.quoteNumber} and mark the quote as converted.
              Optional line items will not be included.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/40 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quote Total</span>
              <span className="font-medium">{formatCurrency(currentQuote.grandTotal, currentQuote.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{currentQuote.items.filter(i => !i.isOptional).length} (optional excluded)</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialog(false)}>Cancel</Button>
            <Button
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleConvert}
            >
              <ArrowRight className="h-4 w-4" /> Convert to Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via {shareType === 'email' ? 'Email' : 'WhatsApp'}</DialogTitle>
            <DialogDescription>
              Confirm recipient and customize your message before sending.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">
                {shareType === 'email' ? 'Recipient Email' : 'WhatsApp Number'}
              </Label>
              <Input
                id="recipient"
                value={shareRecipient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareRecipient(e.target.value)}
                placeholder={shareType === 'email' ? 'email@example.com' : '+1234567890'}
              />
            </div>
            {shareType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={shareSubject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareSubject(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">Message Body</Label>
              <Textarea
                id="message"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={5}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              The PDF quote will be automatically attached/shared.
            </p>
            <div className="pt-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full gap-2 text-xs h-8"
                onClick={handleDownloadPDF}
              >
                <Download className="h-3 w-3" />
                Download PDF First (Recommended)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmShare} 
              disabled={isGenerating}
              className="gap-2"
              style={{ backgroundColor: template?.primaryColor }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send {shareType === 'email' ? 'Email' : 'WhatsApp'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
