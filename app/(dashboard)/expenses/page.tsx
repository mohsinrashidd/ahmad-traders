import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ExpensesTable } from '@/components/tables/expenses-table';
import { AddExpenseDialog } from '@/components/forms/add-expense-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const metadata: Metadata = { title: 'Expenses' };

export default async function ExpensesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from('company_expenses')
    .select('*')
    .order('incurred_on', { ascending: false });

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {expenses?.length ?? 0} expenses recorded
          </p>
        </div>
        <AddExpenseDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </AddExpenseDialog>
      </div>
      <ExpensesTable expenses={expenses ?? []} total={total} />
    </div>
  );
}
