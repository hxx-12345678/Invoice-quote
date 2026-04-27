import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-24 flex flex-col">
      <div className="max-w-3xl mx-auto w-full">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
          <p>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
          <p>In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.</p>
        </div>
      </div>
    </div>
  );
}
