'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPKR, formatDate } from '@/lib/utils/format';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

type PaymentRow = {
  id: string;
  amount: number;
  paid_on: string;
  payment_method: string;
  payment_type: string;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  products: {
    product_name: string;
    account_source: string;
    customers: { name: string; serial_no: number } | null;
  } | null;
};

interface PaymentsTableProps {
  payments: PaymentRow[];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
  DOWN_PAYMENT: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  INSTALLMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ADVANCE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filtered = React.useMemo(() => {
    if (typeFilter === 'all') return payments;
    return payments.filter(p => p.payment_type === typeFilter);
  }, [payments, typeFilter]);

  const columns: ColumnDef<PaymentRow>[] = [
    {
      id: 'customer',
      accessorFn: (row) => row.products?.customers?.name ?? '',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.products?.customers?.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            #{row.original.products?.customers?.serial_no}
          </p>
        </div>
      ),
    },
    {
      id: 'product',
      accessorFn: (row) => row.products?.product_name ?? '',
      header: 'Product',
      cell: ({ row }) => (
        <p className="text-sm">{row.original.products?.product_name}</p>
      ),
    },
    {
      accessorKey: 'paid_on',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.paid_on)}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-green-500 font-medium">
          {formatPKR(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'payment_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs ${TYPE_COLORS[row.original.payment_type] ?? ''}`}
        >
          {row.original.payment_type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {METHOD_LABELS[row.original.payment_method] ?? row.original.payment_method}
        </span>
      ),
    },
    {
      id: 'account',
      accessorFn: (row) => row.products?.account_source ?? '',
      header: 'Account',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.products?.account_source}
        </Badge>
      ),
    },
    {
      accessorKey: 'reference_no',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.original.reference_no ?? '—'}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const exportToExcel = () => {
    const data = filtered.map(p => ({
      Customer: p.products?.customers?.name ?? '',
      'Serial No': p.products?.customers?.serial_no ?? '',
      Product: p.products?.product_name ?? '',
      Amount: p.amount,
      'Paid On': p.paid_on,
      Type: p.payment_type,
      Method: METHOD_LABELS[p.payment_method] ?? p.payment_method,
      Account: p.products?.account_source ?? '',
      Reference: p.reference_no ?? '',
      Notes: p.notes ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `Ahmad_Traders_Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="INSTALLMENT">Installment</SelectItem>
              <SelectItem value="DOWN_PAYMENT">Down Payment</SelectItem>
              <SelectItem value="ADVANCE">Advance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} payment records
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
