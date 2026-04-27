'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { DashboardStats, Document, QuoteDashboardStats } from '@/lib/types';
import {
  calculateDashboardStats,
  calculateQuoteStats,
  formatCurrency,
  formatDate,
  UserSettingsStore,
  CustomersStore,
  QuotesStore,
} from '@/lib/store';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  Send,
  Package,
  FileQuestion,
  BarChart3,
  ThumbsUp,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
} from 'recharts';

const STATUS_COLORS = {
  paid: '#22c55e',
  sent: '#3b82f6',
  overdue: '#ef4444',
  draft: '#94a3b8',
};

interface DashboardViewProps {
  onCreateInvoice: () => void;
  onViewInvoice: (doc: Document) => void;
  onCreateQuote?: () => void;
  onViewQuote?: (quote: import('@/lib/types').Quote) => void;
}

export function DashboardView({ onCreateInvoice, onViewInvoice, onCreateQuote, onViewQuote }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteDashboardStats | null>(null);
  const settings = UserSettingsStore.get();

  useEffect(() => {
    QuotesStore.checkAndMarkExpired();
    const calculatedStats = calculateDashboardStats();
    setStats(calculatedStats);
    setQuoteStats(calculateQuoteStats());
  }, []);

  if (!stats) return null;

  const currency = settings?.currency || 'INR';

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue, currency),
      subtitle: `${stats.paidInvoices} paid invoices`,
      icon: DollarSign,
      trend: 'up',
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats.totalOutstanding, currency),
      subtitle: `${stats.unpaidInvoices} pending invoices`,
      icon: Clock,
      trend: 'neutral',
      color: 'text-primary',
      bg: 'bg-primary/5',
    },
    {
      title: 'Overdue',
      value: formatCurrency(stats.totalOverdue, currency),
      subtitle: `${stats.overdueInvoices} overdue invoices`,
      icon: AlertTriangle,
      trend: 'down',
      color: 'text-destructive',
      bg: 'bg-destructive/5',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers.toString(),
      subtitle: `${stats.totalProducts} products/services`,
      icon: Users,
      trend: 'up',
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  const pieData = stats.revenueByStatus
    .filter(item => item.amount > 0)
    .map(item => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.amount,
      color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#94a3b8',
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Business overview and analytics</p>
        </div>
        <Button onClick={onCreateInvoice} className="gap-2">
          <FileText className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quote Analytics Row */}
      {quoteStats && quoteStats.totalQuotes > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quote Funnel */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Quote-to-Cash Pipeline</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Conversion Rate:
                  <span className="font-semibold text-primary">{quoteStats.conversionRate}%</span>
                </div>
                {onCreateQuote && (
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={onCreateQuote}>
                    <FileQuestion className="h-3 w-3" /> New Quote
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={quoteStats.conversionFunnel} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" vertical={false} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: 'hsl(260 5% 50%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(260 5% 50%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 100%)',
                      border: '1px solid hsl(240 5% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: number, name: string) => [val, 'Quotes']}
                  />
                  <Bar dataKey="count" fill="hsl(250 80% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quote Stats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quote Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Total Quotes', val: quoteStats.totalQuotes, icon: FileQuestion, color: 'text-primary' },
                { label: 'Pipeline Value', val: formatCurrency(quoteStats.totalPipelineValue, currency), icon: DollarSign, color: 'text-green-600' },
                { label: 'Approved', val: quoteStats.approvedQuotes, icon: ThumbsUp, color: 'text-green-500' },
                { label: 'Converted', val: quoteStats.convertedQuotes, icon: ArrowRight, color: 'text-accent' },
                { label: 'Pending Approval', val: quoteStats.sentQuotes, icon: Clock, color: 'text-primary' },
                { label: 'Conversion Rate', val: `${quoteStats.conversionRate}%`, icon: Percent, color: 'text-blue-500' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${item.color}`}>{item.val}</span>
                  </div>
                );
              })}

              {quoteStats.recentQuotes.length > 0 && onViewQuote && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Quotes</p>
                  {quoteStats.recentQuotes.slice(0, 3).map(q => {
                    const customer = CustomersStore.get(q.customerId);
                    return (
                      <button
                        key={q.id}
                        className="w-full flex items-center justify-between hover:bg-muted/40 rounded-lg px-2 py-1.5 -mx-2 transition-colors text-left"
                        onClick={() => onViewQuote(q)}
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">{q.quoteNumber}</p>
                          <p className="text-xs text-muted-foreground">{customer?.name}</p>
                        </div>
                        <span className="text-xs font-medium">{formatCurrency(q.grandTotal, q.currency)}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue Trend (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.some(m => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(250 80% 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(250 80% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 90%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(260 5% 50%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(260 5% 50%)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 100%)',
                      border: '1px solid hsl(240 5% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(250 80% 55%)"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No revenue data yet. Create and mark invoices as paid to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, currency), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(0 0% 100%)',
                      border: '1px solid hsl(240 5% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: '11px', color: 'hsl(260 5% 50%)' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No invoice data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => {}}>
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No invoices yet.{' '}
                <button
                  className="text-primary underline"
                  onClick={onCreateInvoice}
                >
                  Create your first invoice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDocuments.slice(0, 6).map((doc) => {
                  const customer = CustomersStore.get(doc.customerId);
                  const statusColors: Record<string, string> = {
                    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    sent: 'bg-primary/10 text-primary',
                    overdue: 'bg-destructive/10 text-destructive',
                    draft: 'bg-muted text-muted-foreground',
                    partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    cancelled: 'bg-muted text-muted-foreground',
                  };
                  const StatusIcon =
                    doc.status === 'paid' ? CheckCircle2
                    : doc.status === 'sent' ? Send
                    : doc.status === 'overdue' ? AlertTriangle
                    : FileText;

                  return (
                    <button
                      key={doc.id}
                      onClick={() => onViewInvoice(doc)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.documentNumber}</p>
                          <p className="text-xs text-muted-foreground">{customer?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(doc.grandTotal, doc.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(doc.issueDate, settings?.dateFormat)}
                          </p>
                        </div>
                        <Badge className={`text-xs ${statusColors[doc.status] || ''}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {doc.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No customer data yet.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topCustomers.map((item, index) => (
                  <div key={item.customer.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {item.customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.totalSpent, currency)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {stats.topProducts.length > 0 && (
              <>
                <Separator className="my-4" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Top Products
                </p>
                <div className="space-y-3">
                  {stats.topProducts.slice(0, 3).map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalSold} {item.product.unit} sold
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
