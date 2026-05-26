'use client';

import { formatPKR, formatDate } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ExpenseRow = {
  id: string;
  account_type: string;
  category: string;
  amount: number;
  incurred_on: string;
  notes: string | null;
};

interface ExpensesTableProps {
  expenses: ExpenseRow[];
  total: number;
}

const ACCOUNT_COLORS: Record<string, string> = {
  '12M': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '5M': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'SHARED': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export function ExpensesTable({ expenses, total }: ExpensesTableProps) {
  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold text-red-500">{formatPKR(total)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/20">
                  <TableCell className="text-sm">{formatDate(expense.incurred_on)}</TableCell>
                  <TableCell className="font-medium text-sm">{expense.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', ACCOUNT_COLORS[expense.account_type])}
                    >
                      {expense.account_type === 'SHARED' ? 'Shared' : `${expense.account_type} Account`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-500">
                    {formatPKR(expense.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No expenses recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
