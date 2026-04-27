'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Cookie, X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('quotiq_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('quotiq_cookie_consent', 'all');
    // Set first-party cookies with 2026 security standards
    document.cookie = "quotiq_analytics_enabled=true; max-age=31536000; path=/; SameSite=Lax; Secure; Priority=High";
    document.cookie = "quotiq_marketing_enabled=true; max-age=31536000; path=/; SameSite=Lax; Secure; Priority=High";
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('quotiq_cookie_consent', 'necessary');
    // Remove non-essential cookies if they exist
    document.cookie = "quotiq_analytics_enabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "quotiq_marketing_enabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-10 duration-500">
      <Card className="p-6 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Cookie Preferences</h3>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              We use cookies to enhance your experience, analyze site traffic, and ensure security. 
              By clicking "Accept All", you consent to our use of cookies.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={acceptNecessary}
              >
                Necessary Only
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={acceptAll}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
