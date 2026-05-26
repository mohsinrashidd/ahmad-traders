'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StatusBreakdown } from '@/types/database';
import { formatNumber } from '@/lib/utils/format';

interface StatusBreakdownChartProps {
  data: StatusBreakdown[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'hsl(217, 91%, 60%)',
  COMPLETED: 'hsl(142, 76%, 36%)',
  DEFAULTED: 'hsl(0, 84%, 60%)',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  DEFAULTED: 'Defaulted',
};

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const chartData = data.map(d => ({
    name: STATUS_LABELS[d.status],
    value: d.count,
    amount: d.amount,
    status: d.status,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Sale Status</CardTitle>
        <CardDescription>Breakdown by product status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${Number(value)} sales • PKR ${formatNumber(Number(props.payload?.amount ?? 0))}`,
                String(name),
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
