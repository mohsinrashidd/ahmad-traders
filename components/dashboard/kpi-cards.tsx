'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types/database';
import {
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Banknote,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPKR } from '@/lib/utils/format';

interface KpiCardsProps {
  stats: DashboardStats;
}

interface KpiCardDef {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isCount?: boolean;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const cards: KpiCardDef[] = [
    {
      title: 'Active Customers',
      value: stats.total_active_customers,
      icon: Users,
      description: 'Customers with products',
      isCount: true,
    },
    {
      title: 'Total Sales Value',
      value: formatPKR(stats.total_sales_value),
      icon: TrendingUp,
      description: 'Active & completed sales',
    },
    {
      title: 'Total Received',
      value: formatPKR(stats.total_received),
      icon: CheckCircle2,
      description: 'All payments to date',
    },
    {
      title: 'Total Pending',
      value: formatPKR(stats.total_pending),
      icon: Clock,
      description: 'Active accounts only',
    },
    {
      title: 'Defaulted Amount',
      value: formatPKR(stats.total_defaulted_amount),
      icon: XCircle,
      description: 'Outstanding in defaults',
    },
    {
      title: 'This Month Expected',
      value: formatPKR(stats.this_month_expected),
      icon: Calendar,
      description: 'Installments due this month',
    },
    {
      title: 'This Month Collected',
      value: formatPKR(stats.this_month_actual),
      icon: Banknote,
      description: 'Payments received this month',
    },
    {
      title: 'Overdue Installments',
      value: stats.overdue_count,
      icon: AlertTriangle,
      description: 'Unpaid past due dates',
      isCount: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isPkr = typeof card.value === 'string' && card.value.startsWith('PKR ');
        const numberPart = typeof card.value === 'string' && card.value.startsWith('PKR ') ? card.value.slice(4) : card.value;

        return (
          <Card key={card.title} className="flex flex-col justify-between border-rule">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <CardTitle className="text-[12.8px] font-medium text-ink-3 uppercase tracking-[0.06em]">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-ink-3 shrink-0 mt-0.5" />
            </CardHeader>
            <CardContent className="flex flex-col justify-end flex-grow">
              {/* Currency prefix eyebrow */}
              {isPkr ? (
                <div className="font-display font-normal text-[1.83rem] tracking-[0.08em] uppercase text-ink-3 leading-none mb-1">
                  PKR
                </div>
              ) : (
                <div className="font-display font-normal text-[1.83rem] tracking-[0.08em] uppercase text-ink-3 leading-none mb-1 opacity-0 select-none">
                  &nbsp;
                </div>
              )}
              
              <div className="font-display font-semibold text-[3.052rem] text-ink tracking-[-0.02em] leading-none">
                {numberPart}
              </div>
              
              {card.description && (
                <p className="text-[12.8px] text-ink-3 font-sans font-normal mt-2 leading-tight">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

