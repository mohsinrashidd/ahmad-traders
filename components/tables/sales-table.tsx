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
import { useRouter } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
} from 'lucide-react';

type SaleRow = {
  id: string;
  product_name: string;
  sale_price: number;
  cost_price: number;
  total_paid: number;
  remaining_balance: number;
  status: string;
  purchase_start_date: string;
  account_source: string;
  installments_paid: number;
  installment_count: number;
  overdue_count: number;
  customers: {
    id: string;
    name: string;
    serial_no: number;
  } | null;
};

interface SalesTableProps {
  sales: SaleRow[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredSales = React.useMemo(() => {
    if (statusFilter === 'all') return sales;
    return sales.filter(s => s.status === statusFilter);
  }, [sales, statusFilter]);

  const columns: ColumnDef<SaleRow>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessorFn: (row) => row.customers?.name ?? '',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.customers?.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            #{row.original.customers?.serial_no}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.product_name}</p>
          {row.original.overdue_count > 0 && (
            <Badge variant="destructive" className="text-xs mt-1">
              {row.original.overdue_count} overdue
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sale_price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sale Price
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatPKR(row.original.sale_price)}</span>
      ),
    },
    {
      accessorKey: 'total_paid',
      header: 'Paid',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-green-500">{formatPKR(row.original.total_paid)}</span>
      ),
    },
    {
      accessorKey: 'remaining_balance',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Remaining
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-amber-500">{formatPKR(row.original.remaining_balance)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            row.original.status === 'ACTIVE' && 'text-blue-500 border-blue-500/30 bg-blue-500/5',
            row.original.status === 'COMPLETED' && 'text-green-500 border-green-500/30 bg-green-500/5',
            row.original.status === 'DEFAULTED' && 'text-red-500 border-red-500/30 bg-red-500/5'
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'account_source',
      header: 'Account',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.account_source}
        </Badge>
      ),
    },
    {
      accessorKey: 'purchase_start_date',
      header: 'Start Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.purchase_start_date)}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredSales,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sales…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DEFAULTED">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/sales/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-muted-foreground">No sales found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} sale
          {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
