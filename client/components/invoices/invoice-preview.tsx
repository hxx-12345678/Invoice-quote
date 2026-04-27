'use client';

import { useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Document, DocumentStatus } from '@/lib/types';
import { 
  BusinessProfileStore, 
  CustomersStore, 
  UserSettingsStore,
  DocumentsStore,
  TemplateStore,
  formatCurrency,
  formatDate 
} from '@/lib/store';
import { cn, numberToWords } from '@/lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Printer,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  CreditCard,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { PaymentTracker } from '@/components/payments/payment-tracker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InvoicePreviewProps {
  document: Document;
  onBack: () => void;
  onEdit: () => void;
  onPaymentRecorded?: () => void;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', icon: Send, className: 'bg-primary/10 text-primary' },
  paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partially_paid: { label: 'Partial', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', icon: FileText, className: 'bg-muted text-muted-foreground' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', icon: Clock, className: 'bg-orange-100 text-orange-700' },
  accepted: { label: 'Accepted', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
};

export function InvoicePreview({ document: doc, onBack, onEdit, onPaymentRecorded }: InvoicePreviewProps) {
  const [currentDoc, setCurrentDoc] = useState<Document>(doc);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sharing Dialog State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<'email' | 'whatsapp'>('email');
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isQuickEdit, setIsQuickEdit] = useState(false);
  const grandTotalInWords = useMemo(() => numberToWords(currentDoc.grandTotal), [currentDoc.grandTotal]);

  const handlePaymentRecorded = () => {
    const updated = DocumentsStore.get(doc.id);
    if (updated) setCurrentDoc(updated);
    onPaymentRecorded?.();
  };
  const businessProfile = BusinessProfileStore.get();
  const customer = CustomersStore.get(currentDoc.customerId);
  const settings = UserSettingsStore.get();
  const templates = TemplateStore.get();
  const template = currentDoc.type === 'quote' ? templates.quoteTemplate : templates.invoiceTemplate;

  const bankDetails = businessProfile?.bankDetails 
    ? (Array.isArray(businessProfile.bankDetails) ? businessProfile.bankDetails[0] : businessProfile.bankDetails)
    : null;

  const statusConfig = STATUS_CONFIG[currentDoc.status];
  const StatusIcon = statusConfig.icon;

  const handlePrint = () => {
    window.print();
  };

  const generatePdfBlob = async () => {
    if (!previewRef.current) {
      throw new Error('Preview not available for PDF generation');
    }

    const canvas = await (html2canvas as any)(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clone: any) => {
        const styleTags = clone.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          const style = styleTags[i];
          if (style.innerHTML) {
            // Robustly replace ALL modern color functions with black
            // This fixes the "unsupported color function" error in html2canvas
            style.innerHTML = style.innerHTML.replace(/(oklch|oklab|lab|lch|color-mix)\([^)]+\)/g, '#000000');
          }
        }
        // Also check inline styles on all elements
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
    
    const canvasAspectRatio = canvas.width / canvas.height;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
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

  const documentTypeLabel = useMemo(() => {
    switch (currentDoc.type) {
      case 'invoice': return 'TAX INVOICE';
      case 'quote': return 'QUOTATION';
      case 'proforma': return 'PROFORMA INVOICE';
      case 'credit_note': return 'CREDIT NOTE';
      case 'debit_note': return 'DEBIT NOTE';
      default: return 'INVOICE';
    }
  }, [currentDoc.type]);

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDoc.documentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed', error);
      toast.error('Unable to download PDF. Please try again.');
    }
  };

  const handleSendEmail = () => {
    setShareType('email');
    setShareRecipient(customer?.email || '');
    setShareSubject(`${documentTypeLabel} ${currentDoc.documentNumber}`);
    setShareMessage(`Hi ${customer?.name || 'Customer'},\n\nPlease find attached the ${documentTypeLabel.toLowerCase()} ${currentDoc.documentNumber}.\n\nThank you,\n${businessProfile?.businessName || ''}`);
    setShareDialogOpen(true);
  };

  const handleSendWhatsApp = () => {
    setShareType('whatsapp');
    setShareRecipient(customer?.phone || '');
    setShareMessage(`Hi ${customer?.name || 'Customer'}, please find your ${documentTypeLabel.toLowerCase()} ${currentDoc.documentNumber} for ${formatCurrency(currentDoc.grandTotal, currentDoc.currency)} attached here.`);
    setShareDialogOpen(true);
  };

  const handleConfirmShare = async () => {
    try {
      setIsGenerating(true);
      const blob = await generatePdfBlob();
      const file = new File([blob], `${currentDoc.documentNumber}.pdf`, { type: 'application/pdf' });

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
              title: `${documentTypeLabel} ${currentDoc.documentNumber}`,
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


  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{currentDoc.documentNumber}</h2>
            <div className="flex items-center gap-3">
              <Badge className={statusConfig.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {currentDoc.sentAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Sent on {new Date(currentDoc.sentAt).toLocaleDateString()}
                </span>
              )}
              <span className="text-muted-foreground">
                {customer?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentDoc.status === 'draft' && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            variant={isQuickEdit ? "default" : "outline"} 
            size="sm" 
            onClick={() => setIsQuickEdit(!isQuickEdit)} 
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isQuickEdit && "rotate-180")} />
            Quick Edit PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            style={{ borderColor: template?.primaryColor, color: template?.primaryColor }}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            style={{ borderColor: template?.primaryColor, color: template?.primaryColor }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendWhatsApp}
            style={{ borderColor: template?.primaryColor, color: template?.primaryColor }}
          >
            <Phone className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Payment Tracker - shown above the invoice for invoices only */}
      {currentDoc.type === 'invoice' && (
        <div className="print:hidden">
          <PaymentTracker document={currentDoc} onPaymentRecorded={handlePaymentRecorded} />
        </div>
      )}

      {/* Invoice Preview */}
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
            {currentDoc.type === 'invoice' ? 'TAX INVOICE' : currentDoc.type.replace('_', ' ').toUpperCase()}
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
                <span className="font-bold">{formatDate(currentDoc.issueDate, settings?.dateFormat)}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>{currentDoc.type === 'invoice' ? 'Invoice No:' : 'Doc No:'}</span>
                <span className="font-bold">{currentDoc.documentNumber}</span>
              </div>
              <div className="border-b border-black p-1 flex justify-between">
                <span>Challan No :</span>
                <span className="font-bold">{currentDoc.referenceNumber || '-----'}</span>
              </div>
              <div className="p-1 min-h-[40px]">
                <span>Order No : Work order / SPO Division</span>
                <p className="font-bold text-[10px]">{currentDoc.referenceNumber || '---'}</p>
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
                <span className="font-bold">{formatDate(currentDoc.issueDate, settings?.dateFormat)}</span>
              </div>
              <div className="p-1 flex justify-between outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                <span>payment :</span>
                <span className="font-bold">{currentDoc.dueDate ? formatDate(currentDoc.dueDate, settings?.dateFormat) : 'Immediate'}</span>
              </div>
            </div>
          </div>

          <div className="text-center border-b border-black py-1 font-bold text-[10px] uppercase flex justify-between px-4 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
            <span>FOR MONTH OF {new Date(currentDoc.issueDate).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
            <span>Vehical No : {currentDoc.customFields?.find(f => f.key.toLowerCase().includes('vehicle'))?.value || '--------'}</span>
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
                {currentDoc.items.map((item, index) => (
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
                {/* Padding rows to maintain height */}
                {Array.from({ length: Math.max(0, 12 - currentDoc.items.length) }).map((_, i) => (
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

          {/* Footer Totals & Summary */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-7 border-r border-black p-1 flex flex-col justify-between min-h-[180px]">
              <div className="text-[10px] space-y-1 outline-none focus:bg-yellow-50" contentEditable={isQuickEdit} suppressContentEditableWarning>
                {bankDetails && (
                  <>
                    <p className="font-bold text-[11px] underline">Bank Details:</p>
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
                  <p>1. All goods will be despatched entirely at the owners risk our responsibilitiy cease as soon as the goods leave our premises.</p>
                  <p>2. Goods once sold will be not be taken back.</p>
                  <p>3. Claims for disapproval damage and shortage can be entertained only within 7 days from receipt of goods.</p>
                  <p>4. 24% interest will be charged if the payment is not made within due date.</p>
                </div>
              </div>
            </div>
            <div className="col-span-5 p-0 text-[10px] flex flex-col">
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-8 border-r border-black p-1 text-right font-medium italic">Page Total (A)</div>
                <div className="col-span-4 p-1 text-right font-black">{currentDoc.subtotal.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-8 border-r border-black p-1 text-right font-medium italic">Forwarded Total (B)</div>
                <div className="col-span-4 p-1 text-right font-black">0.00</div>
              </div>
              <div className="grid grid-cols-12 border-b border-black bg-gray-50/50">
                <div className="col-span-8 border-r border-black p-1 text-right font-black">SUB TOTAL</div>
                <div className="col-span-4 p-1 text-right font-black">{currentDoc.subtotal.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-5 border-r border-black p-1 font-bold">Less Discounted</div>
                <div className="col-span-3 border-r border-black p-1 text-center font-bold">
                  {currentDoc.discountTotal > 0 ? `${((currentDoc.discountTotal / (currentDoc.subtotal || 1)) * 100).toFixed(1)}%` : '0%'}
                </div>
                <div className="col-span-4 p-1 text-right font-black">-{currentDoc.discountTotal.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-12 border-b border-black min-h-[50px]">
                <div className="col-span-5 border-r border-black flex items-center justify-center font-black bg-gray-50/30 text-center text-[9px]">GST AMOUNT</div>
                <div className="col-span-7 p-0">
                  {currentDoc.taxBreakdown.length > 0 ? (
                    currentDoc.taxBreakdown.map((tax, idx) => (
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
                <div className="col-span-8 border-r border-black p-1 text-right tracking-wider uppercase">TOTAL AMOUNT</div>
                <div className="col-span-4 p-1 text-right text-[13px]">{currentDoc.grandTotal.toFixed(2)}</div>
              </div>
              
              <div className="flex-grow flex flex-col">
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
          <div className="p-2 font-black text-[11px] bg-white flex items-center gap-2 border-b border-black">
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
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
            <div className="min-w-0">
              {template?.showLogo && businessProfile?.logoUrl ? (
                <img 
                  src={businessProfile.logoUrl} 
                  alt={businessProfile.businessName}
                  className="h-16 object-contain mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground">
                  {businessProfile?.businessName || 'Your Business'}
                </h1>
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
                  {businessProfile.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {businessProfile.website}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 
                className="text-xl font-bold uppercase tracking-wider" 
                style={{ color: template?.primaryColor || 'var(--primary)' }}
              >
                {documentTypeLabel}
              </h2>
              <p className="text-2xl font-bold text-foreground mt-2">
                {currentDoc.documentNumber}
              </p>
              {businessProfile?.taxId && (
                <p className="text-sm text-muted-foreground mt-2">
                  {settings?.taxSystem === 'GST' ? 'GSTIN' : settings?.taxSystem === 'VAT' ? 'VAT No' : 'Tax ID'}: {businessProfile.taxId}
                </p>
              )}
              {businessProfile?.panNumber && (
                <p className="text-sm text-muted-foreground">
                  PAN: {businessProfile.panNumber}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 
                className="text-sm font-semibold uppercase tracking-wider mb-2"
                style={{ color: template?.accentColor || 'var(--muted-foreground)' }}
              >
                Bill To
              </h3>
              {customer && (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  {customer.companyName && (
                    <p className="text-foreground">{customer.companyName}</p>
                  )}
                  <p className="text-muted-foreground">{customer.billingAddress?.street}</p>
                  <p className="text-muted-foreground">
                    {customer.billingAddress?.city}, {customer.billingAddress?.state} - {customer.billingAddress?.pincode}
                  </p>
                  <p className="text-muted-foreground">{customer.billingAddress?.country}</p>
                  {customer.taxId && (
                    <p className="text-muted-foreground mt-2">
                      {settings?.taxSystem === 'GST' ? 'GSTIN' : 'Tax ID'}: {customer.taxId}
                    </p>
                  )}
                  <p className="text-muted-foreground">{customer.email}</p>
                  {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                </div>
              )}
            </div>
            
            {template?.showShippingAddress && customer?.shippingAddress && (
              <div>
                <h3 
                  className="text-sm font-semibold uppercase tracking-wider mb-2"
                  style={{ color: template?.accentColor || 'var(--muted-foreground)' }}
                >
                  Ship To
                </h3>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  <p className="text-muted-foreground">{customer.shippingAddress?.street}</p>
                  <p className="text-muted-foreground">
                    {customer.shippingAddress?.city}, {customer.shippingAddress?.state} - {customer.shippingAddress?.pincode}
                  </p>
                  <p className="text-muted-foreground">{customer.shippingAddress?.country}</p>
                </div>
              </div>
            )}

            <div className="md:text-right">
              <div className="space-y-2">
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{formatDate(currentDoc.issueDate, settings?.dateFormat)}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{formatDate(currentDoc.dueDate, settings?.dateFormat)}</span>
                </div>
                {currentDoc.placeOfSupply && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Place of Supply:</span>
                    <span className="font-medium">{currentDoc.placeOfSupply}</span>
                  </div>
                )}
                {currentDoc.referenceNumber && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-medium">{currentDoc.referenceNumber}</span>
                  </div>
                )}
                {currentDoc.type === 'proforma' && currentDoc.validityPeriod && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Validity:</span>
                    <span className="font-medium">{currentDoc.validityPeriod} days</span>
                  </div>
                )}
                {currentDoc.type === 'proforma' && currentDoc.incoterms && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Incoterms:</span>
                    <span className="font-medium">{currentDoc.incoterms}</span>
                  </div>
                )}
                {currentDoc.type === 'proforma' && currentDoc.deliveryTerms && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Delivery:</span>
                    <span className="font-medium">{currentDoc.deliveryTerms}</span>
                  </div>
                )}
                {currentDoc.type === 'credit_note' && currentDoc.reason && (
                  <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium">{currentDoc.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead style={{ backgroundColor: `${template?.primaryColor}10` || 'var(--muted)' }}>
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor || 'inherit' }}>#</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor || 'inherit' }}>Description</th>
                  {settings?.taxSystem === 'GST' && template?.showHsnSac && (
                    <th className="text-left px-4 py-3 text-sm font-semibold hidden md:table-cell" style={{ color: template?.primaryColor || 'inherit' }}>HSN/SAC</th>
                  )}
                  {template?.showQuantity && (
                    <th className="text-right px-4 py-3 text-sm font-semibold hidden sm:table-cell" style={{ color: template?.primaryColor || 'inherit' }}>Qty</th>
                  )}
                  {template?.showUnit && (
                    <th className="text-right px-4 py-3 text-sm font-semibold hidden sm:table-cell" style={{ color: template?.primaryColor || 'inherit' }}>Unit</th>
                  )}
                  <th className="text-right px-4 py-3 text-sm font-semibold hidden sm:table-cell" style={{ color: template?.primaryColor || 'inherit' }}>Rate</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold hidden md:table-cell" style={{ color: template?.primaryColor || 'inherit' }}>Tax</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold" style={{ color: template?.primaryColor || 'inherit' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentDoc.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </td>
                    {settings?.taxSystem === 'GST' && template?.showHsnSac && (
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {item.hsnCode || item.sacCode || '-'}
                      </td>
                    )}
                    {template?.showQuantity && (
                      <td className="text-right px-4 py-3 hidden sm:table-cell">
                        {item.quantity}
                      </td>
                    )}
                    {template?.showUnit && (
                      <td className="text-right px-4 py-3 hidden sm:table-cell">
                        {item.unit}
                      </td>
                    )}
                    <td className="text-right px-4 py-3 hidden sm:table-cell">
                      {formatCurrency(item.unitPrice, currentDoc.currency)}
                    </td>
                    <td className="text-right px-4 py-3 hidden md:table-cell">
                      {item.taxRate}%
                    </td>
                    <td className="text-right px-4 py-3 font-medium">
                      {formatCurrency(item.totalAfterTax, currentDoc.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(currentDoc.subtotal, currentDoc.currency)}</span>
              </div>
              
              {currentDoc.discountTotal > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-{formatCurrency(currentDoc.discountTotal, currentDoc.currency)}</span>
                </div>
              )}

              {/* Tax Breakdown */}
              {template?.showTaxBreakdown && currentDoc.taxBreakdown?.length ? (
                <>
                  {currentDoc.taxBreakdown?.map((tax, index) => (
                    <div key={index} className="flex justify-between py-2">
                      <span className="text-muted-foreground">
                        {tax.taxType} @ {tax.taxRate}%
                      </span>
                      <span>{formatCurrency(tax.taxAmount, currentDoc.currency)}</span>
                    </div>
                  ))}
                  <Separator />
                </>
              ) : null}

              <div className="flex justify-between py-3">
                <span className="text-lg font-bold" style={{ color: template?.primaryColor || 'inherit' }}>Total</span>
                <span className="text-lg font-bold" style={{ color: template?.primaryColor || 'inherit' }}>{formatCurrency(currentDoc.grandTotal, currentDoc.currency)}</span>
              </div>

              {currentDoc.amountPaid > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="text-green-600">-{formatCurrency(currentDoc.amountPaid, currentDoc.currency)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Balance Due</span>
                    <span className={currentDoc.amountDue > 0 ? 'text-destructive' : 'text-green-600'}>
                      {formatCurrency(currentDoc.amountDue, currentDoc.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bank Details */}
          {template?.showBankDetails && bankDetails && bankDetails.bankName && (
            <>
              <Separator className="my-8" />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Bank Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bank Name</span>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account No.</span>
                    <p className="font-medium">{bankDetails.accountNumber}</p>
                  </div>
                  {bankDetails.ifscCode && (
                    <div>
                      <span className="text-muted-foreground">IFSC Code</span>
                      <p className="font-medium">{bankDetails.ifscCode}</p>
                    </div>
                  )}
                  {bankDetails.swiftCode && (
                    <div>
                      <span className="text-muted-foreground">SWIFT/BIC</span>
                      <p className="font-medium">{bankDetails.swiftCode}</p>
                    </div>
                  )}
                  {bankDetails.routingNumber && (
                    <div>
                      <span className="text-muted-foreground">Routing No.</span>
                      <p className="font-medium">{bankDetails.routingNumber}</p>
                    </div>
                  )}
                  {bankDetails.iban && (
                    <div>
                      <span className="text-muted-foreground">IBAN</span>
                      <p className="font-medium">{bankDetails.iban}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Account Holder</span>
                    <p className="font-medium">{bankDetails.accountHolderName}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes & Terms */}
          {(currentDoc.notes || currentDoc.terms) && (
            <>
              <Separator className="my-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {currentDoc.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentDoc.notes}</p>
                  </div>
                )}
                {currentDoc.terms && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Terms & Conditions
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentDoc.terms}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          {template?.footerText && (
            <>
              <Separator className="my-8" />
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{template.footerText}</div>
            </>
          )}
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            <p>This is a computer-generated {currentDoc.type === 'invoice' ? 'invoice' : 'document'} and does not require a signature.</p>
            <p className="mt-1">Thank you for your business!</p>
          </div>
          {template?.showSignature && (
            <div className="mt-10 text-left">
              <div className="border-t border-border pt-4 text-sm text-muted-foreground w-48 mx-auto">
                Authorized Signature
              </div>
            </div>
          )}
        </div>
      )}

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
                onChange={(e) => setShareRecipient(e.target.value)}
                placeholder={shareType === 'email' ? 'email@example.com' : '+1234567890'}
              />
            </div>
            {shareType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={shareSubject}
                  onChange={(e) => setShareSubject(e.target.value)}
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
              The PDF invoice will be automatically attached/shared.
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
