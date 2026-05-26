'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface StatusActionsProps {
  productId: string;
  currentStatus: string;
}

export function StatusActions({ productId, currentStatus }: StatusActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleMarkDefaulted = async () => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('products')
      .update({ status: 'DEFAULTED' })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update status', { description: error.message });
    } else {
      toast.success('Sale marked as Defaulted');
      setOpen(false);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleMarkActive = async () => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('products')
      .update({ status: 'ACTIVE' })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update status', { description: error.message });
    } else {
      toast.success('Sale marked as Active');
      router.refresh();
    }
    setIsUpdating(false);
  };

  if (currentStatus === 'DEFAULTED') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleMarkActive}
        disabled={isUpdating}
      >
        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Restore to Active
      </Button>
    );
  }

  if (currentStatus === 'COMPLETED') {
    return null; // Auto-completed, no manual action needed
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-500 border-red-500/30 hover:bg-red-500/5">
          <AlertTriangle className="h-4 w-4 mr-1.5" />
          Mark Defaulted
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Defaulted?</DialogTitle>
          <DialogDescription>
            This marks the customer as having stopped payments. The sale will be
            excluded from &quot;Most Probable Amount&quot; calculations. No payments will
            be affected.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleMarkDefaulted}
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm — Mark Defaulted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
