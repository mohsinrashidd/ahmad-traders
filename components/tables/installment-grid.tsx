'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { formatPKR, formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentDialog } from '@/components/forms/payment-dialog';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, CreditCard } from 'lucide-react';

type ScheduleRow = {
  id: string;
  product_id: string;
  installment_number: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  paid_on: string | null;
  is_paid: boolean;
};

interface InstallmentGridProps {
  schedule: ScheduleRow[];
  productId: string;
  monthlyAmount: number;
}

export function InstallmentGrid({ schedule, productId, monthlyAmount }: InstallmentGridProps) {
  const today = new Date().toISOString().split('T')[0];

  const getStatus = (row: ScheduleRow) => {
    if (row.is_paid) return 'paid';
    if (row.due_date < today) return 'overdue';
    return 'pending';
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Installment Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {schedule.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No installment schedule found
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {schedule.map((row) => {
              const status = getStatus(row);
              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    status === 'paid' && 'bg-green-500/5',
                    status === 'overdue' && 'bg-red-500/5',
                    status === 'pending' && ''
                  )}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {status === 'paid' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {status === 'overdue' && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    {status === 'pending' && (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Installment number */}
                  <div className="shrink-0 w-8 text-sm font-mono text-muted-foreground">
                    #{row.installment_number}
                  </div>

                  {/* Due date */}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatDate(row.due_date)}
                    </p>
                    {row.is_paid && row.paid_on && (
                      <p className="text-xs text-muted-foreground">
                        Paid on {formatDate(row.paid_on)}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'text-sm font-mono font-medium',
                      status === 'paid' && 'text-green-500',
                      status === 'overdue' && 'text-red-500',
                    )}>
                      {formatPKR(row.is_paid ? row.paid_amount : row.expected_amount)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 w-20 text-right">
                    {status === 'paid' ? (
                      <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 bg-green-500/5">
                        Paid
                      </Badge>
                    ) : status === 'overdue' ? (
                      <Badge variant="outline" className="text-xs text-red-500 border-red-500/30 bg-red-500/5">
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </div>

                  {/* Pay Button */}
                  <div className="shrink-0">
                    {!row.is_paid ? (
                      <PaymentDialog
                        installmentId={row.id}
                        installmentNumber={row.installment_number}
                        expectedAmount={row.expected_amount}
                        productId={productId}
                      >
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Mark Paid
                        </Button>
                      </PaymentDialog>
                    ) : (
                      <div className="w-[72px]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
