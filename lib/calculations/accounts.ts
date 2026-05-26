import type {
  AccountSummary,
  AccountSummaryLine,
  Investor,
  Product,
  Payment,
  CompanyExpense,
  AppSettings,
} from '@/types/database';

interface AccountRawData {
  investors: Investor[];
  products: Product[];  // products for this account
  payments: Payment[];  // payments for these products
  expenses: CompanyExpense[];
  settings: AppSettings;
  accountType: '12M' | '5M';
}

export function computeAccountSummary(data: AccountRawData): AccountSummary {
  const { investors, products, payments, expenses, settings, accountType } = data;

  // (A) Total Investment
  const totalInvestment = investors.reduce((sum, inv) => sum + Number(inv.contribution), 0);

  // (B) Received Amount — sum of all payments for non-defaulted products in this account
  const activeProductIds = new Set(
    products
      .filter(p => p.status !== 'DEFAULTED')
      .map(p => p.id)
  );
  const receivedAmount = payments
    .filter(pay => activeProductIds.has(pay.product_id))
    .reduce((sum, pay) => sum + Number(pay.amount), 0);

  // (C) Total Amount in Hand = A + B
  const totalInHand = totalInvestment + receivedAmount;

  // (D) Purchasing = sum of cost_price for all products
  const purchasing = products.reduce((sum, p) => sum + Number(p.cost_price), 0);

  // (E) Difference = C - D
  const difference = totalInHand - purchasing;

  // (F) Stock at Ali Traders (manual value from settings)
  const stockAtAliTraders = accountType === '12M'
    ? Number(settings.stock_12m)
    : Number(settings.stock_5m);

  // (G) Remaining in Company = E - F
  const remainingInCompany = difference - stockAtAliTraders;

  // (H) Company Expenses — expenses for this account + SHARED split in half
  const directExpenses = expenses
    .filter(e => e.account_type === accountType)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const sharedExpenses = expenses
    .filter(e => e.account_type === 'SHARED')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const companyExpenses = directExpenses + sharedExpenses / 2;

  // (I) Remaining Balance = G - H
  const remainingBalance = remainingInCompany - companyExpenses;

  // (J) Most Probable Amount Received = sum of sale_price for non-defaulted
  const mostProbableReceived = products
    .filter(p => p.status !== 'DEFAULTED')
    .reduce((sum, p) => sum + Number(p.sale_price), 0);

  // (K) Pending Amount = J - B
  const pendingAmount = mostProbableReceived - receivedAmount;

  const lines: AccountSummaryLine[] = [
    { key: 'A', label: 'Total Investment', value: totalInvestment },
    { key: 'B', label: 'Received Amount', value: receivedAmount, formula: 'Sum of all payments received' },
    { key: 'C', label: 'Total Amount in Hand', value: totalInHand, formula: 'A + B' },
    { key: 'D', label: 'Purchasing (Cost)', value: purchasing, formula: 'Sum of cost prices' },
    { key: 'E', label: 'Difference', value: difference, formula: 'C − D' },
    { key: 'F', label: 'Stock at Ali Traders', value: stockAtAliTraders, formula: 'Manually set' },
    { key: 'G', label: 'Remaining in Company', value: remainingInCompany, formula: 'E − F' },
    { key: 'H', label: 'Company Expenses', value: companyExpenses, formula: 'Direct + 50% of Shared' },
    { key: 'I', label: 'Remaining Balance', value: remainingBalance, formula: 'G − H' },
    { key: 'J', label: 'Most Probable Amount Received', value: mostProbableReceived, formula: 'Sum of sale prices (non-defaulted)' },
    { key: 'K', label: 'Pending Amount', value: pendingAmount, formula: 'J − B' },
  ];

  return {
    account_type: accountType,
    lines,
    investors,
    total_investment: totalInvestment,
    received_amount: receivedAmount,
    total_in_hand: totalInHand,
    purchasing,
    difference,
    stock_at_ali_traders: stockAtAliTraders,
    remaining_in_company: remainingInCompany,
    company_expenses: companyExpenses,
    remaining_balance: remainingBalance,
    most_probable_received: mostProbableReceived,
    pending_amount: pendingAmount,
  };
}

export function computeCombinedSummary(
  summary12m: AccountSummary,
  summary5m: AccountSummary
): AccountSummary {
  const combined = (key: keyof AccountSummary) => {
    const a = summary12m[key];
    const b = summary5m[key];
    if (typeof a === 'number' && typeof b === 'number') return a + b;
    return 0;
  };

  const lines: AccountSummaryLine[] = summary12m.lines.map((line, i) => ({
    ...line,
    value: (summary12m.lines[i]?.value ?? 0) + (summary5m.lines[i]?.value ?? 0),
  }));

  return {
    account_type: 'COMBINED',
    lines,
    investors: [...summary12m.investors, ...summary5m.investors],
    total_investment: combined('total_investment') as number,
    received_amount: combined('received_amount') as number,
    total_in_hand: combined('total_in_hand') as number,
    purchasing: combined('purchasing') as number,
    difference: combined('difference') as number,
    stock_at_ali_traders: combined('stock_at_ali_traders') as number,
    remaining_in_company: combined('remaining_in_company') as number,
    company_expenses: combined('company_expenses') as number,
    remaining_balance: combined('remaining_balance') as number,
    most_probable_received: combined('most_probable_received') as number,
    pending_amount: combined('pending_amount') as number,
  };
}
