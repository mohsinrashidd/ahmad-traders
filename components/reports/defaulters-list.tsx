'use client';

import Link from 'next/link';
import { formatPKR } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DefaulterRow = {
  id: string;
  product_name: string;
  remaining_balance: number;
  overdue_count: number;
  customers: {
    name: string;
    serial_no: number;
    phone: string;
  } | null;
};

interface DefaultersListProps {
  defaulters: DefaulterRow[];
}

export function DefaultersList({ defaulters }: DefaultersListProps) {
  if (defaulters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No defaulted accounts 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {defaulters.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{d.customers?.name}</p>
              <Badge variant="outline" className="text-xs">
                #{d.customers?.serial_no}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{d.product_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-red-500">{formatPKR(d.remaining_balance)}</p>
            <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
              <Link href={`/sales/${d.id}`}>View</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
