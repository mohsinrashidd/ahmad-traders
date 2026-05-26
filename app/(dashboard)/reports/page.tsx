import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExcelExportButton } from '@/components/reports/excel-export-button';
import { DefaultersList } from '@/components/reports/defaulters-list';
import { FileText, Table2, AlertOctagon, BarChart3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: defaulters } = await supabase
    .from('product_summary')
    .select('*, customers(name, serial_no, phone)')
    .eq('status', 'DEFAULTED')
    .order('created_at', { ascending: false });

  const { data: allSales } = await supabase
    .from('product_summary')
    .select('*, customers(name, serial_no, phone, father_name, cnic, address)')
    .order('customers(serial_no)', { ascending: true });

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Export and analyze your business data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Table2 className="h-4 w-4 text-green-500" />
              Full Customer Sheet (Excel)
            </CardTitle>
            <CardDescription>
              Download all customers and sales data in Excel format — same columns as your original spreadsheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcelExportButton sales={allSales ?? []} />
          </CardContent>
        </Card>

        {/* Defaulters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              Defaulters List
            </CardTitle>
            <CardDescription>
              {defaulters?.length ?? 0} defaulted accounts with outstanding balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefaultersList defaulters={defaulters ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
