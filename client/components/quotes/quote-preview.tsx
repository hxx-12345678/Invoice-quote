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
import { cn, numberToWords } from '@/lib/utils';
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
  const [isQuickEdit, setIsQuickEdit] = useState(false);

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
  const grandTotalInWords = useMemo(() => numberToWords(currentQuote.grandTotal), [currentQuote.grandTotal]);
  
  const bankDetails = useMemo(() => {
    if (!businessProfile?.bankDetails) return null;
    return Array.isArray(businessProfile.bankDetails) ? businessProfile.bankDetails[0] : businessProfile.bankDetails;
  }, [businessProfile]);

  const generatePdfBlob = async () => {
    if (!previewRef.current) {
      throw new Error('Preview not available for PDF generation');
    }
    
    // Scale up for high quality
    const canvas = await (html2canvas as any)(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clone: any) => {
        const styleTags = clone.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          const style = styleTags[i];
          if (style.innerHTML) {
            style.innerHTML = style.innerHTML.replace(/(oklch|oklab|lab|lch|color-mix)\([^)]+\)/g, '#000000');
          }
        }
        const allElements = clone.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.style && el.style.cssText) {
            el.style.cssText = el.style.cssText.replace(/(oklch|oklab|lab|lch|color-mix)\([^)]+\)/g, '#000000');
          }
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate how many pages we need
    const imgWidth = pageWidth;
    const imgHeight = (canvasHeight * pageWidth) / canvasWidth;
    
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Subsequent pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

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
          <Button 
            variant={isQuickEdit ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsQuickEdit(!isQuickEdit)} 
            className="gap-1.5"
          >
            <ToggleLeft className={cn("h-3.5 w-3.5", isQuickEdit && "rotate-180")} />
            Quick Edit PDF
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
      {template?.layout === 'traditional' ? (
        <div 
          ref={previewRef} 
          className="bg-white text-black p-4 border-2 border-black mx-auto min-h-[1056px] w-full text-[12px] relative"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="absolute top-2 right-4 text-[10px] font-bold">Page 1 of 1</div>
          
          {/* Header */}
          <div className="text-center border-b border-black pb-2 mb-2">
            <h1 
              className="text-2xl font-black uppercase tracking-widest outline-none focus:bg-yellow-50"
              contentEditable={isQuickEdit}
              suppressContentEditableWarning
            >
              {businessProfile?.businessName}
            </h1>
            <p className="text-[10px] uppercase outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
              {businessProfile?.address}, {businessProfile?.city}, {businessProfile?.state}-{businessProfile?.pincode}, {businessProfile?.country}
            </p>
          </div>

          <div className="text-center border-b border-black py-1 font-bold text-sm uppercase outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
            QUOTATION
          </div>

          {/* Bill To & Info Grid */}
          <div className="grid grid-cols-12 border-b border-black min-h-[140px]">
            <div className="col-span-8 border-r border-black p-1 flex flex-col">
              <p className="font-bold border-b border-black mb-1 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                Bill To: {customer?.name}
              </p>
              <div className="space-y-0.5 flex-grow outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                {customer?.companyName && <p className="font-medium">{customer.companyName}</p>}
                <p>{customer?.billingAddress?.street}</p>
                <p>{customer?.billingAddress?.city}, {customer?.billingAddress?.state} - {customer?.billingAddress?.pincode}</p>
                <p>{customer?.billingAddress?.country}</p>
              </div>
              <p className="font-bold mt-2">GST No: {customer?.taxId || '---'}</p>
            </div>
            <div className="col-span-4 p-0">
              <div className="border-b border-black p-1 flex justify-between">
                <span>Date:</span>
                <span className="font-bold">{formatDate(currentQuote.issueDate, settings?.dateFormat)}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>Quote No:</span>
                <span className="font-bold">{currentQuote.quoteNumber}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>Valid Until:</span>
                <span className="font-bold">{formatDate(currentQuote.expiryDate, settings?.dateFormat)}</span>
              </div>
              <div className="p-1 min-h-[40px] outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <span>Reference:</span>
                <p className="font-bold text-[10px]">{currentQuote.referenceNumber || '---'}</p>
              </div>
            </div>
          </div>

          {/* Ship To Row */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-8 border-r border-black p-1">
              <p className="font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                Ship To: {template?.showShippingAddress && customer?.shippingAddress ? customer.name : '-------'}
              </p>
              {template?.showShippingAddress && customer?.shippingAddress && (
                <div className="text-[10px] outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                  {customer.shippingAddress.street}, {customer.shippingAddress.city}, {customer.shippingAddress.state}
                </div>
              )}
            </div>
            <div className="col-span-4">
              <div className="border-b border-black p-1 flex justify-between">
                <span>Date :</span>
                <span className="font-bold">{formatDate(currentQuote.issueDate, settings?.dateFormat)}</span>
              </div>
              <div className="p-1 flex justify-between outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <span>payment :</span>
                <span className="font-bold">As per terms</span>
              </div>
            </div>
          </div>

          <div className="text-center border-b border-black py-1 font-bold text-[10px] uppercase flex justify-between px-4 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
            <span>FOR MONTH OF {new Date(currentQuote.issueDate).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
            <span>Vehical No : {currentQuote.customFields?.find(f => f.key.toLowerCase().includes('vehicle'))?.value || '--------'}</span>
          </div>

          {/* Main Table */}
          <div className="flex-grow">
            <table className="w-full border-collapse border-b border-black">
              <thead>
                <tr className="border-b border-black text-[10px] uppercase font-bold text-center">
                  <th className="border-r border-black w-8 p-1">SR No.</th>
                  <th className="border-r border-black w-32 p-1">SALENOTE</th>
                  <th className="border-r border-black p-1">PARTICULARAS</th>
                  <th className="border-r border-black w-16 p-1">Material</th>
                  <th className="border-r border-black w-24 p-1">SAC CODE</th>
                  <th className="border-r border-black w-12 p-1">QTY</th>
                  <th className="border-r border-black w-20 p-1">RATE</th>
                  <th className="border-r border-black w-12 p-1">UNIT</th>
                  <th className="p-1 w-24">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item, index) => (
                  <tr key={item.id} className="text-[11px] border-b border-black/10 last:border-b-0 min-h-[35px]">
                    <td className="border-r border-black p-1 text-center font-bold">{index + 1}</td>
                    <td className="border-r border-black p-1 text-[9px] text-center font-medium outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                      {item.sku || '---'}
                    </td>
                    <td className="border-r border-black p-1">
                      <p className="font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.name}</p>
                      {item.description && <p className="text-[9px] text-gray-700 leading-tight outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.description}</p>}
                    </td>
                    <td className="border-r border-black p-1 text-center font-medium outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>CI</td>
                    <td className="border-r border-black p-1 text-center font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.sacCode || item.hsnCode || '9954'}</td>
                    <td className="border-r border-black p-1 text-center font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.quantity}</td>
                    <td className="border-r border-black p-1 text-center font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.unitPrice.toFixed(2)}</td>
                    <td className="border-r border-black p-1 text-center uppercase font-bold outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.unit || 'Nos'}</td>
                    <td className="p-1 text-right font-black outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>{item.totalBeforeTax.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Padding rows */}
                {Array.from({ length: Math.max(0, 12 - currentQuote.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="min-h-[30px] border-b border-black/5 last:border-b-0">
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="border-r border-black p-1">&nbsp;</td>
                    <td className="p-1">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-7 border-r border-black p-1 flex flex-col justify-between min-h-[180px]">
              <div className="text-[10px] space-y-1 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <div className="font-bold text-[11px] underline">Bank Details:</div>
                {bankDetails && (
                  <>
                    <p><span className="font-bold">Bank Name:</span> {bankDetails.bankName}, {bankDetails.branch}</p>
                    <p><span className="font-bold">A/C No:</span> {bankDetails.accountNumber}</p>
                    <p><span className="font-bold">IFSC No:</span> {bankDetails.ifscCode}</p>
                  </>
                )}
                <p className="font-bold text-[11px] mt-2">GSTIN NO: {businessProfile?.taxId}  State: {businessProfile?.state} (24)</p>
              </div>
              <div className="text-[9px] border-t border-black pt-1 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <p className="font-bold underline mb-1">Terms & Conditions:</p>
                <div className="leading-tight space-y-0.5">
                  <p>1. Prices are valid until {formatDate(currentQuote.expiryDate, settings?.dateFormat)}.</p>
                  <p>2. Payment terms: As per discussion.</p>
                  <p>3. Delivery timeline will be shared upon order confirmation.</p>
                </div>
              </div>
            </div>
            <div className="col-span-5 p-0 text-[10px] flex flex-col">
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-8 border-r border-black p-1 text-right font-medium italic">Quote Subtotal</div>
                <div className="col-span-4 p-1 text-right font-black">{currentQuote.subtotal.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-12 border-b border-black bg-gray-50/50">
                <div className="col-span-8 border-r border-black p-1 text-right font-black">SUB TOTAL</div>
                <div className="col-span-4 p-1 text-right font-black">{currentQuote.subtotal.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-5 border-r border-black p-1 font-bold">Discount</div>
                <div className="col-span-3 border-r border-black p-1 text-center font-bold">
                  {currentQuote.discountTotal > 0 ? `${((currentQuote.discountTotal / (currentQuote.subtotal || 1)) * 100).toFixed(1)}%` : '0%'}
                </div>
                <div className="col-span-4 p-1 text-right font-black">-{currentQuote.discountTotal.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-12 border-b border-black min-h-[50px]">
                <div className="col-span-5 border-r border-black flex items-center justify-center font-black bg-gray-50/30 text-center text-[9px]">TAX AMOUNT</div>
                <div className="col-span-7 p-0">
                  {currentQuote.taxBreakdown.length > 0 ? (
                    currentQuote.taxBreakdown.map((tax, idx) => (
                      <div key={idx} className="grid grid-cols-12 border-b border-black last:border-b-0">
                        <div className="col-span-5 border-r border-black p-1 text-center font-bold uppercase">{tax.taxType}</div>
                        <div className="col-span-3 border-r border-black p-1 text-center font-medium">{tax.taxRate}%</div>
                        <div className="col-span-4 p-1 text-right font-black">{tax.taxAmount.toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground italic">No Tax Applied</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 font-black text-[12px] bg-gray-100 items-center border-b border-black">
                <div className="col-span-8 border-r border-black p-2 text-right tracking-wider uppercase">TOTAL AMOUNT</div>
                <div className="col-span-4 p-2 text-right text-[13px]">{currentQuote.grandTotal.toFixed(2)}</div>
              </div>
              
              <div className="flex-grow flex flex-col outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <div className="text-center font-black uppercase text-[10px] py-1 border-b border-black">
                  For {businessProfile?.businessName}
                </div>
                <div className="flex-grow flex items-end justify-center pb-1">
                  <p className="font-bold text-[10px] uppercase tracking-tighter">Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-2 font-black text-[11px] bg-white flex items-center gap-2 border-b border-black outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
            <span className="uppercase text-[9px] text-muted-foreground">In Words :</span>
            <span className="uppercase text-[11px] tracking-tight">{grandTotalInWords} Only</span>
          </div>
        </div>
      ) : (
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
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>{businessProfile.address}</p>
                  <p>{businessProfile.city}, {businessProfile.state} - {businessProfile.pincode}</p>
                  <p>{businessProfile.country}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {businessProfile.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {businessProfile.email}
                      </span>
                    )}
                    {businessProfile.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {businessProfile.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: template?.primaryColor }}>QUOTATION</h2>
              <p className="text-2xl font-bold text-foreground mt-2">{currentQuote.quoteNumber}</p>
              {businessProfile?.taxId && (
                <p className="text-sm text-muted-foreground mt-2">
                  {settings?.taxSystem === 'GST' ? 'GSTIN' : 'Tax ID'}: {businessProfile.taxId}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bill To Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: template?.accentColor }}>Bill To</h3>
              {customer && (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  {customer.companyName && <p className="text-foreground">{customer.companyName}</p>}
                  <p className="text-muted-foreground">{customer.billingAddress?.street}</p>
                  <p className="text-muted-foreground">
                    {customer.billingAddress?.city}, {customer.billingAddress?.state} - {customer.billingAddress?.pincode}
                  </p>
                  {customer.taxId && (
                    <p className="text-muted-foreground mt-2">
                      {settings?.taxSystem === 'GST' ? 'GSTIN' : 'Tax ID'}: {customer.taxId}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {template?.showShippingAddress && customer?.shippingAddress && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: template?.accentColor }}>Ship To</h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  <p className="text-muted-foreground">{customer.shippingAddress.street}</p>
                  <p className="text-muted-foreground">
                    {customer.shippingAddress.city}, {customer.shippingAddress.state} - {customer.shippingAddress.pincode}
                  </p>
                </div>
              </div>
            )}

            <div className="md:text-right">
              <div className="space-y-2">
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{formatDate(currentQuote.issueDate, settings?.dateFormat)}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span className="font-medium">{formatDate(currentQuote.expiryDate, settings?.dateFormat)}</span>
                </div>
                {currentQuote.referenceNumber && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium">{currentQuote.referenceNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-xl overflow-hidden mb-8">
            <table className="w-full">
              <thead style={{ backgroundColor: `${template?.primaryColor}10` }}>
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor }}>#</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor }}>Description</th>
                  {template?.showQuantity && (
                    <th className="text-right px-4 py-3 text-sm font-semibold hidden sm:table-cell" style={{ color: template?.primaryColor }}>Qty</th>
                  )}
                  <th className="text-right px-4 py-3 text-sm font-semibold hidden sm:table-cell" style={{ color: template?.primaryColor }}>Rate</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold hidden md:table-cell" style={{ color: template?.primaryColor }}>Tax</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                    </td>
                    {template?.showQuantity && <td className="text-right px-4 py-3 hidden sm:table-cell">{item.quantity} {item.unit}</td>}
                    <td className="text-right px-4 py-3 hidden sm:table-cell">{formatCurrency(item.unitPrice, currentQuote.currency)}</td>
                    <td className="text-right px-4 py-3 hidden md:table-cell">{item.taxRate}%</td>
                    <td className="text-right px-4 py-3 font-medium tracking-tight">
                      <span className={item.isOptional ? 'line-through opacity-50' : ''}>
                        {formatCurrency(item.totalAfterTax, currentQuote.currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div className="flex flex-col md:flex-row justify-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">{formatCurrency(currentQuote.subtotal, currentQuote.currency)}</span>
              </div>
              {currentQuote.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Discount:</span>
                  <span>-{formatCurrency(currentQuote.discountTotal, currentQuote.currency)}</span>
                </div>
              )}
              {currentQuote.taxTotal > 0 && (
                <div className="space-y-1">
                  {currentQuote.taxBreakdown.map((tax, i) => (
                    <div key={i} className="flex justify-between text-sm text-muted-foreground">
                      <span>{tax.taxType} ({tax.taxRate}%):</span>
                      <span>{formatCurrency(tax.taxAmount, currentQuote.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-foreground">Grand Total:</span>
                <span className="text-xl font-bold" style={{ color: template?.primaryColor }}>
                  {formatCurrency(currentQuote.grandTotal, currentQuote.currency)}
                </span>
              </div>
              <div className="text-[10px] text-right text-muted-foreground italic mt-1">
                In Words: {grandTotalInWords} Only
              </div>
            </div>
          </div>

          {currentQuote.items.some(i => i.isOptional) && (
            <div className="mt-4 p-3 bg-muted/40 rounded-lg">
              <p className="text-xs text-muted-foreground">
                * Optional items are shown with strikethrough and not included in total.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 print:hidden">
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
