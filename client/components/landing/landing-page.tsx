'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  LayoutDashboard, 
  ShieldCheck, 
  Zap,
  Globe,
  Users,
  CreditCard
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Quotiq</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">
            How it Works
          </Link>
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                  New: GST-ready Invoicing for Indian Businesses
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Professional Invoicing <br />
                  <span className="text-primary">Simplified for Your Business</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl dark:text-gray-400 mt-6">
                  Create, manage, and track invoices and quotes with ease. Built for modern enterprises, 
                  freelancers, and small businesses.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/setup">
                    Try Out Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/login">View Demo</Link>
                </Button>
              </div>
              <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground grayscale opacity-70">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> GST Compliant</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Secure Cloud</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Multi-Currency</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to get paid</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our comprehensive suite of tools helps you manage your entire billing lifecycle in one place.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Creation</h3>
                <p className="text-muted-foreground">Create professional invoices and quotes in under 60 seconds with our intuitive builder.</p>
              </div>
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-time Insights</h3>
                <p className="text-muted-foreground">Monitor your business health with a powerful dashboard showing revenue, pending payments, and growth.</p>
              </div>
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Compliance Built-in</h3>
                <p className="text-muted-foreground">Stay compliant with GST, tax regulations, and professional standards automatically.</p>
              </div>
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Multi-currency</h3>
                <p className="text-muted-foreground">Invoice international clients in their local currency with automatic exchange rate handling.</p>
              </div>
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Client Management</h3>
                <p className="text-muted-foreground">Keep all your customer details, billing history, and preferences organized in one CRM.</p>
              </div>
              <div className="flex flex-col items-start p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Payment Tracking</h3>
                <p className="text-muted-foreground">Track when clients view invoices and record payments to keep your books balanced.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">Ready to transform your invoicing?</h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl mb-10">
              Join thousands of businesses that trust Quotiq for their billing needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link href="/setup">Start Your Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link href="/login">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <Link className="flex items-center gap-2" href="/">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                QT
              </div>
              <span className="text-lg font-bold">Quotiq</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Quotiq Solutions Pvt Ltd. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</Link>
            <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</Link>
            <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
