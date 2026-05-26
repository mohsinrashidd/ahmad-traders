// ============================================================
// Format utilities for Ahmad Traders
// ============================================================

/**
 * Format a number as PKR currency with international comma format
 * e.g. 12000000 → "PKR 12,000,000"
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'PKR 0';
  return `PKR ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))}`;
}

/**
 * Format PKR with decimal places
 */
export function formatPKRDecimal(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'PKR 0.00';
  return `PKR ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * Format a number with commas (no currency prefix)
 */
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

/**
 * Format a date string to dd/MM/yyyy
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date string to "Jan 2026" for charts
 */
export function formatMonthYear(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Get first day of a given month offset from today
 * offset: 0 = this month, -1 = last month, etc.
 */
export function getMonthBounds(offset = 0): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Generate last N month labels for charts
 */
export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const { start } = getMonthBounds(-i);
    months.push(formatMonthYear(start));
  }
  return months;
}

/**
 * Parse a date string safely, returning null if invalid
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Check if a date is today or in the past
 */
export function isPast(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/**
 * Get YYYY-MM-DD string for today
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Add N months to a date and return YYYY-MM-DD string
 */
export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Compute installment amounts based on pricing mode
 */
export function calculateInstallment(
  mode: 'fixed_split' | 'interest_percent' | 'manual',
  params: {
    salePrice?: number;
    costPrice?: number;
    downPayment?: number;
    interestPercent?: number;
    monthlyInstallment?: number;
    installmentCount?: number;
  }
): { salePrice: number; monthlyInstallment: number } {
  const count = params.installmentCount ?? 12;
  const down = params.downPayment ?? 0;

  if (mode === 'fixed_split') {
    const sale = params.salePrice ?? 0;
    return {
      salePrice: sale,
      monthlyInstallment: count > 0 ? (sale - down) / count : 0,
    };
  }

  if (mode === 'interest_percent') {
    const cost = params.costPrice ?? 0;
    const pct = params.interestPercent ?? 0;
    const sale = cost * (1 + pct / 100);
    return {
      salePrice: sale,
      monthlyInstallment: count > 0 ? (sale - down) / count : 0,
    };
  }

  // manual — use as-is
  return {
    salePrice: params.salePrice ?? 0,
    monthlyInstallment: params.monthlyInstallment ?? 0,
  };
}

/**
 * Determine installment row display status
 */
export function getInstallmentStatus(
  isPaid: boolean,
  dueDate: string
): 'paid' | 'overdue' | 'pending' {
  if (isPaid) return 'paid';
  if (isPast(dueDate)) return 'overdue';
  return 'pending';
}

/**
 * cn utility (re-export for convenience)
 */
export { cn } from '../utils';
