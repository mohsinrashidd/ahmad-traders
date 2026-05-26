import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BiltyRenderer } from '@/components/bilty/bilty-renderer';

export const metadata: Metadata = { title: 'Print Bilty' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BiltyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: schedule }] = await Promise.all([
    supabase
      .from('product_summary')
      .select('*, customers(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('installment_schedule')
      .select('*')
      .eq('product_id', id)
      .order('installment_number'),
  ]);

  if (!product) notFound();

  const customer = (product as Record<string, unknown>).customers as {
    name: string;
    father_name: string | null;
    address: string | null;
    cnic: string | null;
    serial_no: number;
    phone: string;
  } | null;

  // Receipt number = serial_no of customer + product order
  const receiptNo = customer?.serial_no ?? product.id.slice(0, 6);

  return (
    <div className="min-h-screen bg-paper py-8">
      <BiltyRenderer
        product={product}
        customer={customer}
        schedule={schedule ?? []}
        receiptNo={String(receiptNo)}
      />
    </div>
  );
}
