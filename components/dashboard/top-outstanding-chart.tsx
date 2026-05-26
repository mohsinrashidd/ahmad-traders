'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TopOutstandingCustomer } from '@/types/database';
import { formatPKR } from '@/lib/utils/format';

interface TopOutstandingChartProps {
  data: TopOutstandingCustomer[];
}

export function TopOutstandingChart({ data }: TopOutstandingChartProps) {
  const chartData = data.map(c => ({
    name: c.customer_name || `#${c.serial_no}`,
    outstanding: c.outstanding,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Top Outstanding</CardTitle>
        <CardDescription>Customers with highest pending balance</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No outstanding balances
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value) => [formatPKR(Number(value)), 'Outstanding']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="outstanding" radius={[0, 4, 4, 0]} maxBarSize={30}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(217, 91%, ${70 - index * 8}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
