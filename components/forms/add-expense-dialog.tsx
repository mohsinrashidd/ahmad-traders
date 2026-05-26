'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { todayISO } from '@/lib/utils/format';

const EXPENSE_CATEGORIES = [
  'Stationery',
  'Laptop',
  'Software',
  'Aftari',
  'Forms & Slips',
  'Transportation',
  'Utilities',
  'Other',
];

const expenseSchema = z.object({
  account_type: z.enum(['12M', '5M', 'SHARED']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  incurred_on: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface AddExpenseDialogProps {
  children: React.ReactNode;
}

export function AddExpenseDialog({ children }: AddExpenseDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      account_type: 'SHARED',
      category: '',
      amount: 0,
      incurred_on: todayISO(),
      notes: '',
    },
  });

  const onSubmit = async (values: ExpenseFormValues) => {
    const { error } = await supabase.from('company_expenses').insert({
      account_type: values.account_type,
      category: values.category,
      amount: values.amount,
      incurred_on: values.incurred_on,
      notes: values.notes || null,
    });

    if (error) {
      toast.error('Failed to add expense', { description: error.message });
      return;
    }

    toast.success('Expense recorded!');
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Account</Label>
            <Controller
              control={control}
              name="account_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12M">12M Account</SelectItem>
                    <SelectItem value="5M">5M Account</SelectItem>
                    <SelectItem value="SHARED">Shared (Both)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Amount (PKR)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register('incurred_on')} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Description…" {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
