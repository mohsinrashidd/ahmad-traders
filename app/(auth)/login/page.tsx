import type { Metadata } from 'next';
import { LoginForm } from '@/components/forms/login-form';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to Ahmad Traders admin panel',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Ahmad Traders</h1>
          <p className="mt-2 text-muted-foreground">
            Installment Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-xl shadow-black/5">
          <h2 className="text-xl font-semibold mb-6">Sign in to your account</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ahmad Traders © {new Date().getFullYear()} — Confidential
        </p>
      </div>
    </div>
  );
}
