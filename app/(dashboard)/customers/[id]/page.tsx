import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatPKR, formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  ShoppingCart,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Customer Detail' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: products }, { data: payments }] =
    await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase
        .from('product_summary')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('payments')
        .select('*, installment_schedule(installment_number)')
        .eq('product_id', (
          await supabase
            .from('products')
            .select('id')
            .eq('customer_id', id)
            .then(r => (r.data ?? []).map(p => p.id))
        ).join(','))
        .order('paid_on', { ascending: false })
        .limit(50),
    ]);

  if (!customer) notFound();

  const totalOutstanding = (products ?? [])
    .filter(p => p.status === 'ACTIVE')
    .reduce((s, p) => s + Number(p.remaining_balance), 0);

  const totalPaid = (products ?? [])
    .reduce((s, p) => s + Number(p.total_paid), 0);

  return (
    <div className="space-y-6 animate-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">
            Customer #{customer.serial_no}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{customer.name}</p>
                {customer.father_name && (
                  <p className="text-muted-foreground">S/o {customer.father_name}</p>
                )}
              </div>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${customer.phone}`} className="hover:text-primary transition-colors font-mono">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.cnic && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono">{customer.cnic}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{customer.address}</span>
              </div>
            )}
            {customer.remarks && (
              <>
                <Separator />
                <p className="text-muted-foreground italic">{customer.remarks}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Sales</p>
              <p className="text-xl font-bold mt-1">{products?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
              <p className="text-xl font-bold text-green-500 mt-1">{formatPKR(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding</p>
              <p className="text-xl font-bold text-amber-500 mt-1">{formatPKR(totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Products / Sales ({products?.length ?? 0})
          </h2>
          <Button asChild size="sm">
            <Link href={`/sales/new?customer_id=${customer.id}`}>
              + New Sale
            </Link>
          </Button>
        </div>

        {(products ?? []).length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-30" />
              No sales recorded yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(products ?? []).map((p) => (
              <Link key={p.id} href={`/sales/${p.id}`}>
                <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{p.product_name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              p.status === 'ACTIVE' && 'text-blue-500 border-blue-500/30',
                              p.status === 'COMPLETED' && 'text-green-500 border-green-500/30',
                              p.status === 'DEFAULTED' && 'text-red-500 border-red-500/30'
                            )}
                          >
                            {p.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {p.account_source} Account
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Started: {formatDate(p.purchase_start_date)} •{' '}
                          {p.installments_paid}/{p.installment_count} installments paid
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatPKR(p.sale_price)}</p>
                        <p className="text-xs text-muted-foreground">
                          Remaining: <span className="text-amber-500 font-medium">{formatPKR(p.remaining_balance)}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      {(payments ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Payment History
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {(payments ?? []).map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{pay.payment_type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(pay.paid_on)}</p>
                    </div>
                    <p className="text-sm font-bold text-green-500">{formatPKR(pay.amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
