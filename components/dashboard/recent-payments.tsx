'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Payment } from '@/types/database';
import { formatPKR, formatDate } from '@/lib/utils/format';
import { Banknote } from 'lucide-react';

interface RecentPaymentsProps {
  payments: (Payment & {
    products?: { product_name: string; account_source: string } | null;
    customers?: { name: string; serial_no: number } | null;
  })[];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const TYPE_LABELS: Record<string, string> = {
  DOWN_PAYMENT: 'Down',
  INSTALLMENT: 'Installment',
  ADVANCE: 'Advance',
};

export function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Banknote className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {payment.customers?.name ?? 'Customer'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {payment.products?.product_name ?? '—'}{' '}
                    • {formatDate(payment.paid_on)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-green-500">
                    {formatPKR(payment.amount)}
                  </p>
                  <div className="flex gap-1 justify-end mt-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {TYPE_LABELS[payment.payment_type]}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {METHOD_LABELS[payment.payment_method]}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
