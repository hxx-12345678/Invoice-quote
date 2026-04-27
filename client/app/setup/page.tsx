'use client';

import { BusinessProfileForm } from '@/components/setup/business-profile-form';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/register?from=setup');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background flex flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/60 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group transition-transform hover:scale-105" href="/">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Quotiq</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block font-medium">Step 1: Business Profile</p>
          <div className="h-1.5 w-24 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/2 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-2 shadow-sm">
              Quick Setup
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl text-foreground">Welcome to Quotiq</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
              Start by setting up your business profile. We&apos;ll help you create your first professional quote in seconds.
            </p>
          </div>
          
          <div className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl p-1 shadow-2xl">
            <BusinessProfileForm onComplete={handleComplete} guestMode={true} />
          </div>
        </div>
      </main>

      <footer className="py-8 border-t bg-background/50 backdrop-blur-sm">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Quotiq Solutions Pvt Ltd.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Help Center</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
