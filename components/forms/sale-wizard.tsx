'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateInstallment, formatPKR, todayISO } from '@/lib/utils/format';
import { AddCustomerDialog } from '@/components/forms/add-customer-dialog';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Package,
  Calculator,
  Wallet,
  FileCheck,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CustomerOption = {
  id: string;
  name: string;
  serial_no: number;
  phone: string;
};

interface SaleWizardProps {
  customers: CustomerOption[];
  defaultCustomerId?: string;
}

const saleSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  product_name: z.string().min(1, 'Product name is required'),
  supplier_name: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Cost price must be 0 or more'),
  sale_price: z.coerce.number().min(1, 'Sale price is required'),
  down_payment: z.coerce.number().min(0),
  monthly_installment: z.coerce.number().min(1, 'Monthly installment is required'),
  installment_count: z.coerce.number().int().min(1).max(60),
  pricing_mode: z.enum(['fixed_split', 'interest_percent', 'manual']),
  interest_percent: z.coerce.number().optional(),
  purchase_start_date: z.string().min(1, 'Start date is required'),
  account_source: z.enum(['12M', '5M']),
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Product', icon: Package },
  { id: 3, label: 'Pricing', icon: Calculator },
  { id: 4, label: 'Account', icon: Wallet },
  { id: 5, label: 'Review', icon: FileCheck },
];

export function SaleWizard({ customers: initialCustomers, defaultCustomerId }: SaleWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = React.useState(1);
  const [customers, setCustomers] = React.useState(initialCustomers);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<z.input<typeof saleSchema>, any, SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_id: defaultCustomerId ?? '',
      product_name: '',
      supplier_name: '',
      cost_price: 0,
      sale_price: 0,
      down_payment: 0,
      monthly_installment: 0,
      installment_count: 12,
      pricing_mode: 'fixed_split',
      interest_percent: 0,
      purchase_start_date: todayISO(),
      account_source: '12M',
      notes: '',
    },
  });

  const watchedValues = watch() as unknown as SaleFormValues;
  const pricingMode = watchedValues.pricing_mode;

  // Auto-calculate when relevant fields change
  React.useEffect(() => {
    if (pricingMode === 'fixed_split' || pricingMode === 'interest_percent') {
      const result = calculateInstallment(pricingMode, {
        salePrice: watchedValues.sale_price,
        costPrice: watchedValues.cost_price,
        downPayment: watchedValues.down_payment,
        interestPercent: watchedValues.interest_percent,
        installmentCount: watchedValues.installment_count,
      });
      if (pricingMode === 'interest_percent' && result.salePrice > 0) {
        setValue('sale_price', parseFloat(result.salePrice.toFixed(2)));
      }
      if (result.monthlyInstallment > 0) {
        setValue('monthly_installment', parseFloat(result.monthlyInstallment.toFixed(2)));
      }
    }
  }, [
    pricingMode,
    watchedValues.sale_price,
    watchedValues.cost_price,
    watchedValues.down_payment,
    watchedValues.interest_percent,
    watchedValues.installment_count,
    setValue,
  ]);

  const selectedCustomer = customers.find(c => c.id === watchedValues.customer_id);

  const nextStep = async () => {
    let fieldsToValidate: (keyof SaleFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['customer_id'];
    if (step === 2) fieldsToValidate = ['product_name'];
    if (step === 3) fieldsToValidate = ['sale_price', 'down_payment', 'monthly_installment'];
    if (step === 4) fieldsToValidate = ['account_source', 'purchase_start_date'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(s => Math.min(s + 1, 5));
  };

  const onSubmit = async (values: SaleFormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_sale', {
        p_customer_id: values.customer_id,
        p_product_name: values.product_name,
        p_supplier_name: values.supplier_name || null,
        p_cost_price: values.cost_price,
        p_sale_price: values.sale_price,
        p_down_payment: values.down_payment,
        p_monthly_installment: values.monthly_installment,
        p_installment_count: values.installment_count,
        p_pricing_mode: values.pricing_mode,
        p_interest_percent: values.interest_percent || null,
        p_start_date: values.purchase_start_date,
        p_account_source: values.account_source,
        p_notes: values.notes || null,
      });

      if (error) throw error;

      toast.success('Sale created!', {
        description: `${values.installment_count} installment schedule generated.`,
      });
      router.push(`/sales/${data}`);
      router.refresh();
    } catch (err) {
      toast.error('Failed to create sale', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all',
                  step > s.id
                    ? 'bg-primary text-primary-foreground'
                    : step === s.id
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs hidden sm:block',
                  step >= s.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-[2px] mx-1 mt-0 sm:-mt-5 transition-colors',
                  step > s.id ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-5">
            {/* Step 1: Customer */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Select Customer</h2>
                <Controller
                  control={control}
                  name="customer_id"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.customer_id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select a customer…" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="font-mono text-xs text-muted-foreground mr-2">
                                #{c.serial_no}
                              </span>
                              {c.name}
                              <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.customer_id && (
                        <p className="text-xs text-destructive">{errors.customer_id.message}</p>
                      )}
                    </div>
                  )}
                />
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
                <AddCustomerDialog
                  onSuccess={(newId) => {
                    setValue('customer_id', newId);
                    // refresh customer list
                    supabase
                      .from('customers')
                      .select('id, name, serial_no, phone')
                      .order('name')
                      .then(({ data }) => data && setCustomers(data));
                  }}
                >
                  <Button type="button" variant="outline" className="w-full gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create New Customer
                  </Button>
                </AddCustomerDialog>
              </div>
            )}

            {/* Step 2: Product */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Product Details</h2>
                <div className="space-y-2">
                  <Label>
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Honda 125 2026"
                    {...register('product_name')}
                    className={errors.product_name ? 'border-destructive' : ''}
                  />
                  {errors.product_name && (
                    <p className="text-xs text-destructive">{errors.product_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Supplier / Shop Name</Label>
                  <Input
                    placeholder="e.g. Ali Motors"
                    {...register('supplier_name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Any additional notes…"
                    {...register('notes')}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Pricing & Installments</h2>

                {/* Pricing Mode */}
                <div className="space-y-2">
                  <Label>Pricing Mode</Label>
                  <Controller
                    control={control}
                    name="pricing_mode"
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'fixed_split', label: 'Fixed Split', desc: 'Enter sale price directly' },
                          { value: 'interest_percent', label: 'Interest %', desc: 'Markup on cost price' },
                          { value: 'manual', label: 'Manual', desc: 'Override all values' },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => field.onChange(mode.value)}
                            className={cn(
                              'rounded-lg border p-3 text-left text-sm transition-all',
                              field.value === mode.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <p className="font-medium">{mode.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cost Price */}
                  <div className="space-y-2">
                    <Label>Cost Price (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...register('cost_price')}
                    />
                  </div>

                  {/* Interest % — only for interest_percent mode */}
                  {pricingMode === 'interest_percent' && (
                    <div className="space-y-2">
                      <Label>Interest % (markup)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 20"
                        {...register('interest_percent')}
                      />
                    </div>
                  )}

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <Label>
                      Sale Price (PKR){' '}
                      {pricingMode === 'interest_percent' && (
                        <span className="text-xs text-muted-foreground">(auto-calculated)</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      readOnly={pricingMode === 'interest_percent'}
                      {...register('sale_price')}
                      className={cn(
                        errors.sale_price ? 'border-destructive' : '',
                        pricingMode === 'interest_percent' && 'bg-muted'
                      )}
                    />
                    {errors.sale_price && (
                      <p className="text-xs text-destructive">{errors.sale_price.message}</p>
                    )}
                  </div>

                  {/* Down Payment */}
                  <div className="space-y-2">
                    <Label>Down Payment (PKR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...register('down_payment')}
                    />
                  </div>

                  {/* Installment Count */}
                  <div className="space-y-2">
                    <Label>Installment Count</Label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      {...register('installment_count')}
                    />
                  </div>

                  {/* Monthly Installment */}
                  <div className="space-y-2">
                    <Label>
                      Monthly Installment (PKR){' '}
                      {pricingMode !== 'manual' && (
                        <span className="text-xs text-muted-foreground">(auto)</span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      readOnly={pricingMode !== 'manual'}
                      {...register('monthly_installment')}
                      className={cn(
                        errors.monthly_installment ? 'border-destructive' : '',
                        pricingMode !== 'manual' && 'bg-muted'
                      )}
                    />
                    {errors.monthly_installment && (
                      <p className="text-xs text-destructive">{errors.monthly_installment.message}</p>
                    )}
                  </div>
                </div>

                {/* Live Preview */}
                {watchedValues.sale_price > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Preview
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sale Price</span>
                      <span className="font-mono">{formatPKR(watchedValues.sale_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Down Payment</span>
                      <span className="font-mono">−{formatPKR(watchedValues.down_payment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance</span>
                      <span className="font-mono">
                        {formatPKR((watchedValues.sale_price || 0) - (watchedValues.down_payment || 0))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Monthly × {watchedValues.installment_count}</span>
                      <span className="text-primary">{formatPKR(watchedValues.monthly_installment)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Account & Date */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Account & Start Date</h2>
                <div className="space-y-2">
                  <Label>Investor Account</Label>
                  <Controller
                    control={control}
                    name="account_source"
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: '12M', label: '12 Million Account', desc: '6 investors — 20 Lac each' },
                          { value: '5M', label: '5 Million Account', desc: '2 partners — 25 Lac each' },
                        ].map((acc) => (
                          <button
                            key={acc.value}
                            type="button"
                            onClick={() => field.onChange(acc.value)}
                            className={cn(
                              'rounded-lg border p-4 text-left transition-all',
                              field.value === acc.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <p className="font-semibold text-sm">{acc.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{acc.desc}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    {...register('purchase_start_date')}
                    className={errors.purchase_start_date ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    First installment will be due 1 month after this date.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Review & Confirm</h2>

                <div className="rounded-lg border border-border/50 divide-y divide-border/50 text-sm">
                  <ReviewRow label="Customer" value={selectedCustomer?.name ?? '—'} />
                  <ReviewRow label="Phone" value={selectedCustomer?.phone ?? '—'} />
                  <ReviewRow label="Product" value={watchedValues.product_name} />
                  {watchedValues.supplier_name && (
                    <ReviewRow label="Supplier" value={watchedValues.supplier_name} />
                  )}
                  <ReviewRow label="Cost Price" value={formatPKR(watchedValues.cost_price)} />
                  <ReviewRow label="Sale Price" value={formatPKR(watchedValues.sale_price)} />
                  <ReviewRow label="Down Payment" value={formatPKR(watchedValues.down_payment)} />
                  <ReviewRow
                    label="Monthly Installment"
                    value={`${formatPKR(watchedValues.monthly_installment)} × ${watchedValues.installment_count}`}
                    highlight
                  />
                  <ReviewRow label="Account" value={`${watchedValues.account_source} Account`} />
                  <ReviewRow label="Start Date" value={watchedValues.purchase_start_date} />
                  <ReviewRow label="Pricing Mode" value={watchedValues.pricing_mode.replace('_', ' ')} />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This will create {watchedValues.installment_count} installment schedule rows
                  {watchedValues.down_payment > 0 && ' and record the down payment'}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(s => Math.max(s - 1, 1))}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < 5 ? (
            <Button type="button" onClick={nextStep} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Sale…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Sale
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('flex justify-between px-4 py-2.5', highlight && 'bg-primary/5')}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', highlight && 'text-primary')}>{value}</span>
    </div>
  );
}
