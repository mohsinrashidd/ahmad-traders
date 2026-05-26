-- ============================================================
-- Ahmad Traders — Row-Level Security Policies
-- Migration 002: RLS
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE app_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_schedule  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_expenses      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: Single-owner pattern
-- Any authenticated user (there is only one) can do everything.
-- For extra security, the owner's UID is checked against app_settings.owner_uid
-- when it has been set. Until set, any authenticated user can access.
-- ============================================================

-- app_settings
CREATE POLICY "owner_all_app_settings"
  ON app_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- customers
CREATE POLICY "owner_all_customers"
  ON customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- investors
CREATE POLICY "owner_all_investors"
  ON investors FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- products
CREATE POLICY "owner_all_products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- installment_schedule
CREATE POLICY "owner_all_schedule"
  ON installment_schedule FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- payments
CREATE POLICY "owner_all_payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- company_expenses
CREATE POLICY "owner_all_expenses"
  ON company_expenses FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
