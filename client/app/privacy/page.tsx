import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-24 flex flex-col">
      <div className="max-w-3xl mx-auto w-full">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, update your profile, use the interactive features of our services, or communicate with us.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you, monitor and analyze trends and usage, and personalize the services.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this privacy policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        </div>
      </div>
    </div>
  );
}
