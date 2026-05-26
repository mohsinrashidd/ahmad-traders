import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSummaryPanel } from '@/components/accounts/account-summary-panel';
import { computeAccountSummary, computeCombinedSummary } from '@/lib/calculations/accounts';

export const metadata: Metadata = { title: 'Investor Accounts' };

export default async function AccountsPage() {
  const supabase = await createClient();

  const [
    { data: investors },
    { data: products12m },
    { data: products5m },
    { data: payments12m },
    { data: payments5m },
    { data: expenses },
    { data: settings },
  ] = await Promise.all([
    supabase.from('investors').select('*').order('account_type'),
    supabase.from('products').select('*').eq('account_source', '12M'),
    supabase.from('products').select('*').eq('account_source', '5M'),
    supabase
      .from('payments')
      .select('*, products!inner(account_source)')
      .eq('products.account_source', '12M'),
    supabase
      .from('payments')
      .select('*, products!inner(account_source)')
      .eq('products.account_source', '5M'),
    supabase.from('company_expenses').select('*'),
    supabase.from('app_settings').select('*').single(),
  ]);

  const investors12m = (investors ?? []).filter(i => i.account_type === '12M');
  const investors5m = (investors ?? []).filter(i => i.account_type === '5M');

  const summary12m = computeAccountSummary({
    accountType: '12M',
    investors: investors12m,
    products: products12m ?? [],
    payments: payments12m ?? [],
    expenses: expenses ?? [],
    settings: settings!,
  });

  const summary5m = computeAccountSummary({
    accountType: '5M',
    investors: investors5m,
    products: products5m ?? [],
    payments: payments5m ?? [],
    expenses: expenses ?? [],
    settings: settings!,
  });

  const summaryCombined = computeCombinedSummary(summary12m, summary5m);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investor Accounts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live financial summary for each investor pool
        </p>
      </div>

      <Tabs defaultValue="12m">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="12m">12M Account</TabsTrigger>
          <TabsTrigger value="5m">5M Account</TabsTrigger>
          <TabsTrigger value="combined">Sub Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="12m" className="mt-6">
          <AccountSummaryPanel summary={summary12m} />
        </TabsContent>

        <TabsContent value="5m" className="mt-6">
          <AccountSummaryPanel summary={summary5m} />
        </TabsContent>

        <TabsContent value="combined" className="mt-6">
          <AccountSummaryPanel summary={summaryCombined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
