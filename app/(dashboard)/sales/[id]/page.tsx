import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatPKR, formatDate, getInstallmentStatus } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallmentGrid } from '@/components/tables/installment-grid';
import { StatusActions } from '@/components/forms/status-actions';

export const metadata: Metadata = { title: 'Sale Detail' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
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
      .order('installment_number', { ascending: true }),
  ]);

  if (!product) notFound();

  const customer = (product as Record<string, unknown>).customers as {
    id: string;
    name: string;
    serial_no: number;
    phone: string;
    cnic: string | null;
    father_name: string | null;
  } | null;

  const progressPercent =
    product.sale_price > 0
      ? Math.min(100, (product.total_paid / product.sale_price) * 100)
      : 0;

  const overdueCount = (schedule ?? []).filter(
    s => !s.is_paid && s.due_date < new Date().toISOString().split('T')[0]
  ).length;

  const shouldWarnDefaulted =
    product.status === 'ACTIVE' && overdueCount >= 3;

  return (
    <div className="space-y-6 animate-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{product.product_name}</h1>
            <p className="text-muted-foreground text-sm">
              {customer?.name} • #{customer?.serial_no}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/sales/${id}/bilty`} target="_blank">
              <Printer className="h-4 w-4" />
              Print Bilty
            </Link>
          </Button>
          <StatusActions productId={id} currentStatus={product.status} />
        </div>
      </div>

      {/* DEFAULTED Warning */}
      {shouldWarnDefaulted && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-500 text-sm">
              {overdueCount} overdue installments detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Consider marking this sale as Defaulted if the customer has stopped paying.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Summary */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Product</p>
                  <p className="font-medium mt-1">{product.product_name}</p>
                </div>
                {product.supplier_name && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Supplier</p>
                    <p className="font-medium mt-1">{product.supplier_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Cost Price</p>
                  <p className="font-mono font-medium mt-1">{formatPKR(product.cost_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Sale Price</p>
                  <p className="font-mono font-medium mt-1">{formatPKR(product.sale_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Down Payment</p>
                  <p className="font-mono font-medium mt-1">{formatPKR(product.down_payment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Monthly</p>
                  <p className="font-mono font-medium mt-1">{formatPKR(product.monthly_installment)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Start Date</p>
                  <p className="font-medium mt-1">{formatDate(product.purchase_start_date)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Account</p>
                  <Badge variant="secondary" className="mt-1">{product.account_source} Account</Badge>
                </div>
              </div>

              <Separator />

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Progress</span>
                  <span className="font-medium">{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Paid: <span className="text-green-500 font-medium">{formatPKR(product.total_paid)}</span></span>
                  <span>Remaining: <span className="text-amber-500 font-medium">{formatPKR(product.remaining_balance)}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installment Grid */}
          <InstallmentGrid
            schedule={schedule ?? []}
            productId={id}
            monthlyAmount={product.monthly_installment}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm px-3',
                    product.status === 'ACTIVE' && 'text-blue-500 border-blue-500/30 bg-blue-500/5',
                    product.status === 'COMPLETED' && 'text-green-500 border-green-500/30 bg-green-500/5',
                    product.status === 'DEFAULTED' && 'text-red-500 border-red-500/30 bg-red-500/5'
                  )}
                >
                  {product.status === 'ACTIVE' && <Clock className="h-3 w-3 mr-1.5" />}
                  {product.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                  {product.status === 'DEFAULTED' && <XCircle className="h-3 w-3 mr-1.5" />}
                  {product.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installments</span>
                  <span className="font-medium">
                    {product.installments_paid}/{product.installment_count} paid
                  </span>
                </div>
                {overdueCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overdue</span>
                    <span className="font-medium text-red-500">{overdueCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          {customer && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  {customer.father_name && (
                    <p className="text-xs text-muted-foreground">S/o {customer.father_name}</p>
                  )}
                </div>
                <p className="font-mono text-xs">{customer.phone}</p>
                {customer.cnic && (
                  <p className="font-mono text-xs text-muted-foreground">{customer.cnic}</p>
                )}
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href={`/customers/${customer.id}`}>View Customer</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
