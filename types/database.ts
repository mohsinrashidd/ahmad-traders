// ============================================================
// Ahmad Traders — Database Types
// Generated from Supabase schema
// ============================================================

export type ProductStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
export type AccountType = '12M' | '5M' | 'SHARED';
export type PricingMode = 'fixed_split' | 'interest_percent' | 'manual';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
export type PaymentType = 'DOWN_PAYMENT' | 'INSTALLMENT' | 'ADVANCE';

export interface Customer {
  id: string;
  serial_no: number;
  name: string;
  father_name: string | null;
  phone: string;
  cnic: string | null;
  address: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  customer_id: string;
  product_name: string;
  supplier_name: string | null;
  cost_price: number;
  sale_price: number;
  down_payment: number;
  installment_count: number;
  monthly_installment: number;
  pricing_mode: PricingMode;
  interest_percent: number | null;
  purchase_start_date: string;
  status: ProductStatus;
  account_source: '12M' | '5M';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSummary extends Product {
  total_paid: number;
  remaining_balance: number;
  installments_paid: number;
  installments_remaining: number;
  overdue_count: number;
}

export interface InstallmentSchedule {
  id: string;
  product_id: string;
  installment_number: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  paid_on: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  product_id: string;
  installment_id: string | null;
  amount: number;
  paid_on: string;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
}

export interface Investor {
  id: string;
  name: string;
  account_type: '12M' | '5M';
  contribution: number;
  joined_on: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyExpense {
  id: string;
  account_type: AccountType;
  category: string;
  amount: number;
  incurred_on: string;
  notes: string | null;
  created_at: string;
}

export interface AppSettings {
  id: string;
  business_name: string;
  business_address: string | null;
  business_phone: string | null;
  default_installment_months: number;
  logo_url: string | null;
  stock_12m: number;
  stock_5m: number;
  owner_uid: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Joined / composite types
// ============================================================

export interface CustomerWithStats extends Customer {
  active_products_count: number;
  total_outstanding: number;
  latest_status: ProductStatus | null;
}

export interface ProductWithCustomer extends ProductSummary {
  customer: Customer;
}

export interface PaymentWithDetails extends Payment {
  product: Pick<Product, 'product_name' | 'account_source'>;
  customer: Pick<Customer, 'name' | 'serial_no'>;
}

export interface InstallmentWithStatus extends InstallmentSchedule {
  status: 'paid' | 'overdue' | 'pending';
}

// ============================================================
// Account summary computation types
// ============================================================

export interface AccountSummaryLine {
  label: string;
  key: string;
  value: number;
  formula?: string;
}

export interface AccountSummary {
  account_type: '12M' | '5M' | 'COMBINED';
  lines: AccountSummaryLine[];
  investors: Investor[];
  total_investment: number;
  received_amount: number;
  total_in_hand: number;
  purchasing: number;
  difference: number;
  stock_at_ali_traders: number;
  remaining_in_company: number;
  company_expenses: number;
  remaining_balance: number;
  most_probable_received: number;
  pending_amount: number;
}

// ============================================================
// Form / input types
// ============================================================

export interface NewCustomerInput {
  name: string;
  father_name?: string;
  phone: string;
  cnic?: string;
  address?: string;
  remarks?: string;
}

export interface NewSaleInput {
  customer_id: string;
  product_name: string;
  supplier_name?: string;
  cost_price: number;
  sale_price: number;
  down_payment: number;
  monthly_installment: number;
  installment_count: number;
  pricing_mode: PricingMode;
  interest_percent?: number;
  purchase_start_date: string;
  account_source: '12M' | '5M';
  notes?: string;
}

export interface RecordPaymentInput {
  installment_id: string;
  amount: number;
  paid_on: string;
  payment_method: PaymentMethod;
  reference_no?: string;
  notes?: string;
}

export interface NewExpenseInput {
  account_type: AccountType;
  category: string;
  amount: number;
  incurred_on: string;
  notes?: string;
}

// ============================================================
// Dashboard stats
// ============================================================

export interface DashboardStats {
  total_active_customers: number;
  total_sales_value: number;
  total_received: number;
  total_pending: number;
  total_defaulted_amount: number;
  this_month_expected: number;
  this_month_actual: number;
  overdue_count: number;
}

export interface MonthlyCollectionPoint {
  month: string; // e.g. "Jan 2026"
  expected: number;
  actual: number;
}

export interface StatusBreakdown {
  status: ProductStatus;
  count: number;
  amount: number;
}

export interface TopOutstandingCustomer {
  customer_name: string;
  serial_no: number;
  outstanding: number;
}
