-- ============================================================
-- Ahmad Traders — Seed Data
-- Migration 003: Investors, Sample Expenses
-- ============================================================

-- ============================================================
-- INVESTORS — 12M Account (6 investors × PKR 20 Lac each)
-- ============================================================

INSERT INTO investors (name, account_type, contribution, joined_on) VALUES
  ('M Bilal',    '12M', 2000000.00, '2025-01-01'),
  ('G Haider',   '12M', 2000000.00, '2025-01-01'),
  ('M Usman',    '12M', 2000000.00, '2025-01-01'),
  ('R Shafique', '12M', 2000000.00, '2025-01-01'),
  ('Rai Ilyas',  '12M', 2000000.00, '2025-01-01'),
  ('Abaid',      '12M', 2000000.00, '2025-01-01');

-- ============================================================
-- INVESTORS — 5M Account (2 partners × PKR 25 Lac each)
-- ============================================================

INSERT INTO investors (name, account_type, contribution, joined_on) VALUES
  ('M Bilal',    '5M', 2500000.00, '2025-01-01'),
  ('R Shafique', '5M', 2500000.00, '2025-01-01');

-- ============================================================
-- SAMPLE COMPANY EXPENSES
-- ============================================================

INSERT INTO company_expenses (account_type, category, amount, incurred_on, notes) VALUES
  ('12M',    'Stationery',    2500.00,  '2026-01-15', 'Forms and receipt books'),
  ('12M',    'Forms & Slips', 3000.00,  '2026-02-01', 'Printed installment slips'),
  ('SHARED', 'Laptop',        85000.00, '2026-01-10', 'Office laptop for record keeping'),
  ('SHARED', 'Software',      5000.00,  '2026-03-01', 'Annual software subscription'),
  ('5M',     'Stationery',    1500.00,  '2026-02-15', 'Miscellaneous stationery'),
  ('SHARED', 'Aftari',        8000.00,  '2026-04-01', 'Ramadan aftari arrangement');
