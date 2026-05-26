import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SaleWizard } from '@/components/forms/sale-wizard';

export const metadata: Metadata = { title: 'New Sale' };

interface PageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewSalePage({ searchParams }: PageProps) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, serial_no, phone')
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold">New Sale</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new installment sale for a customer
        </p>
      </div>
      <SaleWizard
        customers={customers ?? []}
        defaultCustomerId={customer_id}
      />
    </div>
  );
}
