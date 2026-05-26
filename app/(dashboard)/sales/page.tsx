import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SalesTable } from '@/components/tables/sales-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Sales' };

export default async function SalesPage() {
  const supabase = await createClient();

  const { data: sales } = await supabase
    .from('product_summary')
    .select(`
      *,
      customers(id, name, serial_no, phone)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sales?.length ?? 0} total sales
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/sales/new">
            <Plus className="h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      <SalesTable sales={sales ?? []} />
    </div>
  );
}
