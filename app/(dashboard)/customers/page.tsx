import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CustomersTable } from '@/components/tables/customers-table';
import { AddCustomerDialog } from '@/components/forms/add-customer-dialog';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Customers' };

export default async function CustomersPage() {
  const supabase = await createClient();

  // Fetch customers with their product stats
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      products:products(
        id,
        sale_price,
        status
      )
    `)
    .order('serial_no', { ascending: true });

  // Compute stats per customer
  const customersWithStats = (customers ?? []).map((c) => {
    const products = (c.products ?? []) as Array<{
      id: string;
      sale_price: number;
      status: string;
    }>;
    const activeProducts = products.filter(p => p.status === 'ACTIVE');
    return {
      ...c,
      products: undefined,
      active_products_count: activeProducts.length,
      total_products_count: products.length,
      latest_status: products.length > 0 ? products[products.length - 1].status : null,
    };
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {customersWithStats.length} customers registered
          </p>
        </div>
        <AddCustomerDialog>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </AddCustomerDialog>
      </div>

      <CustomersTable customers={customersWithStats} />
    </div>
  );
}
