'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  father_name: z.string().optional(),
  phone: z.string().min(10, 'Enter a valid phone number'),
  cnic: z.string().optional(),
  address: z.string().optional(),
  remarks: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface AddCustomerDialogProps {
  children: React.ReactNode;
  onSuccess?: (customerId: string) => void;
}

export function AddCustomerDialog({ children, onSuccess }: AddCustomerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const onSubmit = async (values: CustomerFormValues) => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: values.name,
        father_name: values.father_name || null,
        phone: values.phone,
        cnic: values.cnic || null,
        address: values.address || null,
        remarks: values.remarks || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add customer', { description: error.message });
      return;
    }

    toast.success('Customer added successfully!');
    reset();
    setOpen(false);
    router.refresh();
    if (onSuccess && data) {
      onSuccess(data.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="Muhammad Ali" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="father_name">Father&apos;s Name</Label>
              <Input id="father_name" placeholder="Muhammad Ibrahim" {...register('father_name')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" placeholder="03XX-XXXXXXX" {...register('phone')} />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnic">CNIC</Label>
              <Input id="cnic" placeholder="XXXXX-XXXXXXX-X" {...register('cnic')} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Village / City" {...register('address')} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Input id="remarks" placeholder="Optional notes" {...register('remarks')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                'Add Customer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
