'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ApiService } from '@/lib/api-service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await ApiService.auth.forgotPassword(email);
      
      setIsSubmitted(true);
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists for this email, you will receive a reset link shortly.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-6 relative">
        <div className="flex flex-col items-center text-center space-y-2 mb-2">
          <Link href="/" className="flex items-center gap-2 mb-4 group transition-transform hover:scale-105">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Quotiq</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-muted-foreground max-w-xs mx-auto text-balance">
            We&apos;ll help you get back into your account
          </p>
        </div>

        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden border">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Forgot Password?</CardTitle>
                <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
              </CardFooter>
            </form>
          ) : (
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Check your email</h2>
                <p className="text-muted-foreground">
                  We&apos;ve sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-11" 
                onClick={() => router.push('/login')}
              >
                Return to Login
              </Button>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email?{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
