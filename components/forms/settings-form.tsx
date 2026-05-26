'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Building2, Wallet, Lock } from 'lucide-react';
import { formatPKR } from '@/lib/utils/format';
import type { AppSettings, Investor } from '@/types/database';

const settingsSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  stock_12m: z.coerce.number().min(0),
  stock_5m: z.coerce.number().min(0),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: AppSettings;
  investors: Investor[];
}

export function SettingsForm({ settings, investors }: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof settingsSchema>, any, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: settings.business_name,
      business_address: settings.business_address ?? '',
      business_phone: settings.business_phone ?? '',
      stock_12m: settings.stock_12m,
      stock_5m: settings.stock_5m,
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    const { error } = await supabase
      .from('app_settings')
      .update({
        business_name: values.business_name,
        business_address: values.business_address || null,
        business_phone: values.business_phone || null,
        stock_12m: values.stock_12m,
        stock_5m: values.stock_5m,
      })
      .eq('id', settings.id);

    if (error) {
      toast.error('Failed to save settings', { description: error.message });
      return;
    }

    toast.success('Settings saved!');
    router.refresh();
  };

  const investors12m = investors.filter(i => i.account_type === '12M');
  const investors5m = investors.filter(i => i.account_type === '5M');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input {...register('business_name')} />
            {errors.business_name && (
              <p className="text-xs text-destructive">{errors.business_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input {...register('business_address')} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register('business_phone')} />
          </div>
        </CardContent>
      </Card>

      {/* Stock at Ali Traders */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Stock at Ali Traders (Manual Values)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These values are subtracted from the &quot;Difference&quot; in account calculations.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>12M Account Stock (PKR)</Label>
              <Input type="number" step="0.01" {...register('stock_12m')} />
            </div>
            <div className="space-y-1.5">
              <Label>5M Account Stock (PKR)</Label>
              <Input type="number" step="0.01" {...register('stock_5m')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investors (read-only view) */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              12M Account
            </p>
            <div className="space-y-1">
              {investors12m.map(inv => (
                <div key={inv.id} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span>{inv.name}</span>
                  <span className="font-mono text-muted-foreground">{formatPKR(inv.contribution)}</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              5M Account
            </p>
            <div className="space-y-1">
              {investors5m.map(inv => (
                <div key={inv.id} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span>{inv.name}</span>
                  <span className="font-mono text-muted-foreground">{formatPKR(inv.contribution)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Settings
      </Button>
    </form>
  );
}
