'use client';

import { useState, useEffect } from 'react';
import { Quote, QuoteActivityLog, QuoteVersion } from '@/lib/types';
import { QuoteActivityStore, QuoteVersionsStore, formatDate, UserSettingsStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Clock,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Edit,
  Copy,
  ArrowRight,
  AlertTriangle,
  History,
  MessageSquare,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  created:   { icon: FileText,     color: 'text-primary',             label: 'Quote Created' },
  edited:    { icon: Edit,         color: 'text-blue-500',            label: 'Quote Edited' },
  sent:      { icon: Send,         color: 'text-primary',             label: 'Sent to Client' },
  viewed:    { icon: Eye,          color: 'text-blue-500',            label: 'Viewed by Client' },
  approved:  { icon: CheckCircle2, color: 'text-green-500',           label: 'Approved' },
  rejected:  { icon: XCircle,      color: 'text-destructive',         label: 'Rejected' },
  expired:   { icon: AlertTriangle,color: 'text-orange-500',          label: 'Expired' },
  converted: { icon: ArrowRight,   color: 'text-accent',              label: 'Converted to Invoice' },
  duplicated:{ icon: Copy,         color: 'text-muted-foreground',    label: 'Duplicated' },
  comment:   { icon: MessageSquare,color: 'text-muted-foreground',    label: 'Comment Added' },
};

interface QuoteActivityPanelProps {
  quote: Quote;
}

export function QuoteActivityPanel({ quote }: QuoteActivityPanelProps) {
  const [activity, setActivity] = useState<QuoteActivityLog[]>([]);
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [tab, setTab] = useState<'activity' | 'versions'>('activity');
  const settings = UserSettingsStore.get();

  useEffect(() => {
    setActivity(QuoteActivityStore.getByQuote(quote.id));
    setVersions(QuoteVersionsStore.getByQuote(quote.id));
  }, [quote.id]);

  const timeAgo = (date: Date | string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 print:hidden">
          <History className="h-3.5 w-3.5" />
          Activity
          {activity.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 rounded-full">{activity.length}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Quote History</SheetTitle>
        </SheetHeader>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mt-2">
          <button
            onClick={() => setTab('activity')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
              tab === 'activity'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity ({activity.length})
          </button>
          <button
            onClick={() => setTab('versions')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
              tab === 'versions'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Versions ({versions.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {tab === 'activity' && (
            <div className="space-y-1">
              {activity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No activity recorded yet.
                </div>
              ) : (
                activity.map((log, index) => {
                  const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.comment;
                  const Icon = cfg.icon;
                  const isLast = index === activity.length - 1;

                  return (
                    <div key={log.id} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 bg-muted border border-border`}>
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-2 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatDate(log.createdAt, settings?.dateFormat)}{' '}
                          {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div className="space-y-2">
              {versions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No version history yet.
                </div>
              ) : (
                [...versions].reverse().map((version) => {
                  const isExpanded = expandedVersion === version.id;
                  let snapshot: Quote | null = null;
                  try {
                    snapshot = JSON.parse(version.snapshotJson);
                  } catch {}

                  const isCurrent = version.versionNumber === quote.versionNumber;

                  return (
                    <div key={version.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
                        onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            v{version.versionNumber}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                Version {version.versionNumber}
                              </p>
                              {isCurrent && (
                                <Badge className="text-xs h-4 bg-primary/10 text-primary">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {version.changeNote || 'No change note'} · {timeAgo(version.createdAt)}
                            </p>
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                      </button>

                      {isExpanded && snapshot && (
                        <div className="p-3 border-t border-border bg-muted/20 space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium capitalize">{snapshot.status}</span>
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: snapshot.currency,
                                minimumFractionDigits: 2,
                              }).format(snapshot.grandTotal)}
                            </span>
                            <span className="text-muted-foreground">Items</span>
                            <span className="font-medium">{snapshot.items?.length || 0}</span>
                            <span className="text-muted-foreground">Expiry</span>
                            <span className="font-medium">
                              {formatDate(snapshot.expiryDate, settings?.dateFormat)}
                            </span>
                          </div>
                          <Separator />
                          <div className="space-y-1">
                            {snapshot.items?.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate flex-1 mr-2">{item.name}</span>
                                <span>{item.quantity} × {new Intl.NumberFormat('en-IN', { style: 'currency', currency: snapshot!.currency }).format(item.unitPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
