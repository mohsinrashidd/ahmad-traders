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

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  paid_on: z.string().min(1, 'Date is required'),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  children: React.ReactNode;
  installmentId: string;
  installmentNumber: number;
  expectedAmount: number;
  productId: string;
}

export function PaymentDialog({
  children,
  installmentId,
  installmentNumber,
  expectedAmount,
  productId,
}: PaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: expectedAmount,
      paid_on: todayISO(),
      payment_method: 'CASH',
      reference_no: '',
      notes: '',
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    const { error } = await supabase.rpc('record_installment_payment', {
      p_installment_id: installmentId,
      p_amount: values.amount,
      p_paid_on: values.paid_on,
      p_method: values.payment_method,
      p_reference_no: values.reference_no || null,
      p_notes: values.notes || null,
    });

    if (error) {
      toast.error('Failed to record payment', { description: error.message });
      return;
    }

    toast.success(`Installment #${installmentNumber} marked as paid!`);
    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment — Installment #{installmentNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>
              Amount (PKR) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Payment Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              {...register('paid_on')}
              className={errors.paid_on ? 'border-destructive' : ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reference No. (optional)</Label>
            <Input
              placeholder="Transaction ID / Cheque no."
              {...register('reference_no')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any notes…" {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording…
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
