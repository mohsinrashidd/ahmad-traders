'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatPKR } from '@/lib/utils/format';

type SaleData = {
  id: string;
  product_name: string;
  sale_price: number;
  cost_price: number;
  down_payment: number;
  monthly_installment: number;
  installment_count: number;
  purchase_start_date: string;
  status: string;
  account_source: string;
  total_paid: number;
  remaining_balance: number;
  installments_paid: number;
  customers: {
    name: string;
    serial_no: number;
    phone: string;
    father_name: string | null;
    cnic: string | null;
    address: string | null;
  } | null;
};

interface ExcelExportButtonProps {
  sales: SaleData[];
}

export function ExcelExportButton({ sales }: ExcelExportButtonProps) {
  const handleExport = () => {
    const rows = sales.map((s) => ({
      'Serial No': s.customers?.serial_no ?? '',
      'Customer Name': s.customers?.name ?? '',
      "Father's Name": s.customers?.father_name ?? '',
      'Phone': s.customers?.phone ?? '',
      'CNIC': s.customers?.cnic ?? '',
      'Address': s.customers?.address ?? '',
      'Product': s.product_name,
      'Account': s.account_source,
      'Cost Price (PKR)': s.cost_price,
      'Sale Price (PKR)': s.sale_price,
      'Down Payment (PKR)': s.down_payment,
      'Monthly Installment (PKR)': s.monthly_installment,
      'Installment Count': s.installment_count,
      'Start Date': s.purchase_start_date,
      'Status': s.status,
      'Total Paid (PKR)': s.total_paid,
      'Remaining (PKR)': s.remaining_balance,
      'Installments Paid': s.installments_paid,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Style column widths
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 },
      { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ahmad Traders Customers');
    XLSX.writeFile(
      wb,
      `Ahmad_Traders_Customers_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <Button onClick={handleExport} className="gap-2" variant="outline">
      <Download className="h-4 w-4" />
      Download Excel ({sales.length} records)
    </Button>
  );
}
