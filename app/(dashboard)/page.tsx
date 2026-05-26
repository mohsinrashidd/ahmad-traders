import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { MonthlyCollectionChart } from '@/components/dashboard/monthly-collection-chart';
import { StatusBreakdownChart } from '@/components/dashboard/status-breakdown-chart';
import { TopOutstandingChart } from '@/components/dashboard/top-outstanding-chart';
import { RecentPayments } from '@/components/dashboard/recent-payments';
import { formatPKR } from '@/lib/utils/format';
import type {
  DashboardStats,
  MonthlyCollectionPoint,
  StatusBreakdown,
  TopOutstandingCustomer,
  Payment,
} from '@/types/database';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  // Parallel fetches
  const [
    { data: products },
    { data: payments },
    { data: installments },
    { data: customers },
  ] = await Promise.all([
    supabase
      .from('product_summary')
      .select('*'),
    supabase
      .from('payments')
      .select('*, products(product_name, account_source), customers!inner(name, serial_no)')
      .order('paid_on', { ascending: false })
      .limit(100),
    supabase
      .from('installment_schedule')
      .select('id, due_date, is_paid, expected_amount')
      .eq('is_paid', false)
      .lt('due_date', now.toISOString().split('T')[0]),
    supabase
      .from('customers')
      .select('id'),
  ]);

  const activeProducts = products?.filter(p => p.status === 'ACTIVE') ?? [];
  const defaultedProducts = products?.filter(p => p.status === 'DEFAULTED') ?? [];

  // KPI calculations
  const stats: DashboardStats = {
    total_active_customers: customers?.length ?? 0,
    total_sales_value: activeProducts.reduce((s, p) => s + Number(p.sale_price), 0),
    total_received: (payments ?? []).reduce((s, p) => s + Number(p.amount), 0),
    total_pending: activeProducts.reduce((s, p) => s + Number(p.remaining_balance), 0),
    total_defaulted_amount: defaultedProducts.reduce((s, p) => s + Number(p.remaining_balance), 0),
    this_month_expected: (installments ?? []).reduce((s, i) => s + Number(i.expected_amount), 0),
    this_month_actual: (payments ?? [])
      .filter(p => p.paid_on >= monthStart.split('T')[0] && p.paid_on <= monthEnd.split('T')[0])
      .reduce((s, p) => s + Number(p.amount), 0),
    overdue_count: installments?.length ?? 0,
  };

  // Monthly collection for last 12 months
  const monthlyData: MonthlyCollectionPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    const mStart = startOfMonth(d).toISOString().split('T')[0];
    const mEnd = endOfMonth(d).toISOString().split('T')[0];
    const label = format(d, 'MMM yyyy');

    const monthPayments = (payments ?? []).filter(
      p => p.paid_on >= mStart && p.paid_on <= mEnd
    );
    // For "expected" — sum installments due that month
    // We compute from the full installments list filtered by due_date
    monthlyData.push({
      month: label,
      expected: 0, // Will be enhanced with a dedicated query if needed
      actual: monthPayments.reduce((s, p) => s + Number(p.amount), 0),
    });
  }

  // Status breakdown
  const statusBreakdown: StatusBreakdown[] = [
    {
      status: 'ACTIVE',
      count: activeProducts.length,
      amount: activeProducts.reduce((s, p) => s + Number(p.sale_price), 0),
    },
    {
      status: 'COMPLETED',
      count: (products?.filter(p => p.status === 'COMPLETED') ?? []).length,
      amount: (products?.filter(p => p.status === 'COMPLETED') ?? [])
        .reduce((s, p) => s + Number(p.sale_price), 0),
    },
    {
      status: 'DEFAULTED',
      count: defaultedProducts.length,
      amount: defaultedProducts.reduce((s, p) => s + Number(p.sale_price), 0),
    },
  ];

  // Top 5 outstanding customers
  const customerOutstanding: Record<string, { name: string; serial_no: number; outstanding: number }> = {};
  for (const p of activeProducts) {
    const cid = p.customer_id as string;
    if (!customerOutstanding[cid]) {
      customerOutstanding[cid] = { name: '', serial_no: 0, outstanding: 0 };
    }
    customerOutstanding[cid].outstanding += Number(p.remaining_balance);
  }

  // Fetch customer names for outstanding
  const topCustomerIds = Object.keys(customerOutstanding).slice(0, 10);
  if (topCustomerIds.length > 0) {
    const { data: custData } = await supabase
      .from('customers')
      .select('id, name, serial_no')
      .in('id', topCustomerIds);
    for (const c of custData ?? []) {
      if (customerOutstanding[c.id]) {
        customerOutstanding[c.id].name = c.name;
        customerOutstanding[c.id].serial_no = c.serial_no;
      }
    }
  }

  const topOutstanding: TopOutstandingCustomer[] = Object.values(customerOutstanding)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 5)
    .map(c => ({ customer_name: c.name, serial_no: c.serial_no, outstanding: c.outstanding }));

  // Recent payments (last 10)
  const recentPayments = (payments ?? []).slice(0, 10) as Payment[];

  return { stats, monthlyData, statusBreakdown, topOutstanding, recentPayments };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { stats, monthlyData, statusBreakdown, topOutstanding, recentPayments } =
    await getDashboardData(supabase);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of Ahmad Traders installment business
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MonthlyCollectionChart data={monthlyData} />
        </div>
        <div>
          <StatusBreakdownChart data={statusBreakdown} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopOutstandingChart data={topOutstanding} />
        <RecentPayments payments={recentPayments} />
      </div>
    </div>
  );
}
