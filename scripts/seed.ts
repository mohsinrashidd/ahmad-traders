/**
 * Ahmad Traders — Excel Seed Script
 * Usage: npx ts-node --esm scripts/seed.ts
 *
 * Expects Ahmad_Traders_Customers_2026-05-19.xlsx in the project root.
 * Uses SUPABASE_SERVICE_ROLE_KEY for admin access (bypasses RLS).
 */

import * as XLSX from 'xlsx';
const xlsx = (XLSX as any).default || XLSX;
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ============================================================
// Excel column mapping
// ============================================================
interface ExcelRow {
  'Sr No'?: string | number;
  'Customer Name'?: string;
  'Phone Number'?: string | number;
  'Product Name'?: string;
  'Cost Price Paid By Broker'?: string | number;
  'Sale Price (PKR)'?: number;
  'Down Payment (PKR)'?: number;
  'Monthly Installment (PKR)'?: number;
  'Total Paid So Far (PKR)'?: number;
  'Remaining Balance (PKR)'?: number;
  'Status'?: string;
  'Purchase Start Date'?: string | number;
  'Remarks'?: string;
  'Account'?: string;
}

function parseDate(value: string | number | undefined): string {
  if (!value) return new Date().toISOString().split('T')[0];
  if (typeof value === 'number') {
    // Excel serial date
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return new Date().toISOString().split('T')[0];
}

async function seed() {
  const xlsxPath = path.join(process.cwd(), 'Ahmad_Traders_Customers_2026-05-19.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    console.error(`File not found: ${xlsxPath}`);
    console.error('Please place the Excel file in the project root directory.');
    process.exit(1);
  }

  console.log('📖 Reading Excel file…');
  const wb = xlsx.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws) as ExcelRow[];
  console.log(`Found ${rows.length} rows`);

  for (const row of rows) {
    const rawName = row['Customer Name'];
    if (!rawName) continue; // Skip empty rows

    const customerName = String(rawName).trim();

    // ---- GET OR CREATE CUSTOMER ----
    const customerData = {
      name: customerName,
      father_name: null,
      phone: row['Phone Number'] ? String(row['Phone Number']).trim() : '',
      cnic: null,
      address: null,
      remarks: row['Remarks'] ? String(row['Remarks']).trim() : null,
    };

    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('name', customerName)
      .limit(1)
      .maybeSingle();

    if (existingCustomer) {
      customer = existingCustomer;
      console.log(`👤 Customer already exists: ${customer.name} (#${customer.serial_no})`);
    } else {
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
      
      if (custErr || !newCustomer) {
        console.error(`❌ Customer insert failed for ${customerName}:`, custErr?.message);
        continue;
      }
      customer = newCustomer;
      console.log(`👤 Customer created: ${customer.name} (#${customer.serial_no})`);
    }

    // ---- CREATE PRODUCT / SALE ----
    const productName = String(row['Product Name'] || 'Unknown').trim();
    const costPriceRaw = row['Cost Price Paid By Broker'];
    const costPrice = (costPriceRaw && !isNaN(Number(costPriceRaw))) ? Number(costPriceRaw) : 0;
    
    const salePrice = Number(row['Sale Price (PKR)'] ?? 0);
    const downPayment = Number(row['Down Payment (PKR)'] ?? 0);
    const monthly = Number(row['Monthly Installment (PKR)'] ?? 0) ||
      (salePrice > 0 ? (salePrice - downPayment) / 12 : 0);
    
    const startDate = parseDate(row['Purchase Start Date']);
    const accountSource = (row['Account'] === '5M' ? '5M' : '12M') as '12M' | '5M';
    const status = (row['Status'] === 'DEFAULTED' ? 'DEFAULTED' :
      row['Status'] === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE') as 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';

    if (productName === 'Unknown' && salePrice === 0) {
      console.log(`  ⏭ Skipping product for ${customer.name} (no product data)`);
      continue;
    }

    // Check if product already exists for this customer
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('product_name', productName)
      .limit(1)
      .maybeSingle();

    if (existingProduct) {
      console.log(`  ⏭ Product already exists for ${customer.name}: ${productName}`);
      continue;
    }

    // Use RPC to create product + 12 schedule rows + down payment payment in one transaction
    const { data: productId, error: prodErr } = await supabase.rpc('create_sale', {
      p_customer_id: customer.id,
      p_product_name: productName,
      p_supplier_name: null,
      p_cost_price: costPrice,
      p_sale_price: salePrice,
      p_down_payment: downPayment,
      p_monthly_installment: monthly,
      p_installment_count: 12,
      p_pricing_mode: 'fixed_split' as const,
      p_interest_percent: null,
      p_start_date: startDate,
      p_account_source: accountSource,
      p_notes: null,
    });

    if (prodErr || !productId) {
      console.error(`  ❌ Product creation failed for ${productName}:`, prodErr?.message);
      continue;
    }

    console.log(`  📦 Sale created: ${productName} (Sale: ${formatPKR(salePrice)})`);

    // ---- HISTORICAL PAYMENTS RECONCILIATION ----
    const totalPaidSoFar = Number(row['Total Paid So Far (PKR)'] ?? 0);
    const installmentPaidAmount = totalPaidSoFar - downPayment;
    const installmentsPaidCount = Math.floor(installmentPaidAmount / monthly);

    if (installmentsPaidCount > 0) {
      console.log(`  💰 Reconciling payments: ${installmentsPaidCount} installments paid so far…`);
      
      // Fetch the generated schedule rows
      const { data: schedule } = await supabase
        .from('installment_schedule')
        .select('id, installment_number, due_date')
        .eq('product_id', productId)
        .order('installment_number', { ascending: true });

      if (schedule && schedule.length > 0) {
        const toPayCount = Math.min(installmentsPaidCount, schedule.length);
        
        for (let i = 0; i < toPayCount; i++) {
          const item = schedule[i];
          
          // Mark installment as paid in DB
          await supabase
            .from('installment_schedule')
            .update({
              paid_amount: monthly,
              paid_on: item.due_date,
              is_paid: true
            })
            .eq('id', item.id);

          // Add corresponding entry to payments ledger
          await supabase
            .from('payments')
            .insert({
              product_id: productId,
              installment_id: item.id,
              amount: monthly,
              paid_on: item.due_date,
              payment_method: 'CASH',
              payment_type: 'INSTALLMENT',
              notes: 'Imported from Excel historical data'
            });
        }
        console.log(`    ✅ Successfully marked ${toPayCount} installments as paid.`);
      }
    }

    // Force update status (ACTIVE / COMPLETED / DEFAULTED)
    // The record_installment_payment RPC auto-completes, but let's make sure it matches the Excel status
    if (status !== 'ACTIVE') {
      await supabase
        .from('products')
        .update({ status })
        .eq('id', productId);
      console.log(`    Badge set to: ${status}`);
    }
  }

  console.log('\n🎉 Excel Data Seed completed successfully!');
}

function formatPKR(amount: number): string {
  return `PKR ${new Intl.NumberFormat('en-US').format(Math.round(amount))}`;
}

seed().catch(console.error);
