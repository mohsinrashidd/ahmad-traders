import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PaymentsTable } from '@/components/tables/payments-table';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      products(product_name, account_source, customers(name, serial_no))
    `)
    .order('paid_on', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete payment ledger — {payments?.length ?? 0} records
        </p>
      </div>
      <PaymentsTable payments={payments ?? []} />
    </div>
  );
}
