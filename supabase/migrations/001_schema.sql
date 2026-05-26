-- ============================================================
-- Ahmad Traders — Database Schema
-- Migration 001: Tables, Enums, Indexes, Triggers
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE product_status AS ENUM ('ACTIVE', 'COMPLETED', 'DEFAULTED');
CREATE TYPE account_type AS ENUM ('12M', '5M', 'SHARED');
CREATE TYPE pricing_mode AS ENUM ('fixed_split', 'interest_percent', 'manual');
CREATE TYPE payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');
CREATE TYPE payment_type AS ENUM ('DOWN_PAYMENT', 'INSTALLMENT', 'ADVANCE');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: app_settings (single-row)
-- ============================================================

CREATE TABLE app_settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name               TEXT NOT NULL DEFAULT 'Ahmad Traders',
  business_address            TEXT,
  business_phone              TEXT,
  default_installment_months  INT NOT NULL DEFAULT 12,
  logo_url                    TEXT,
  -- "Stock at Ali Traders" manual values per account
  stock_12m                   NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_5m                    NUMERIC(14,2) NOT NULL DEFAULT 0,
  owner_uid                   UUID,  -- set after first login to lock down RLS
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed one row
INSERT INTO app_settings (business_name, business_address, business_phone)
VALUES ('Ahmad Traders', 'Pakistan', '');

-- ============================================================
-- TABLE: customers
-- ============================================================

-- Sequence for display serial numbers (starts at 101)
CREATE SEQUENCE customer_serial_seq START 101;

CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial_no   INT NOT NULL DEFAULT nextval('customer_serial_seq') UNIQUE,
  name        TEXT NOT NULL,
  father_name TEXT,
  phone       TEXT NOT NULL,
  cnic        TEXT,
  address     TEXT,
  remarks     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_serial ON customers(serial_no);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: investors
-- ============================================================

CREATE TABLE investors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  account_type account_type NOT NULL,
  contribution NUMERIC(14,2) NOT NULL,
  joined_on    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investors_account_type ON investors(account_type);

CREATE TRIGGER investors_updated_at
  BEFORE UPDATE ON investors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: products (each row = one sale / product purchase)
-- ============================================================

CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_name         TEXT NOT NULL,
  supplier_name        TEXT,
  cost_price           NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_price           NUMERIC(14,2) NOT NULL,
  down_payment         NUMERIC(14,2) NOT NULL DEFAULT 0,
  installment_count    INT NOT NULL DEFAULT 12,
  monthly_installment  NUMERIC(14,2) NOT NULL,
  pricing_mode         pricing_mode NOT NULL DEFAULT 'fixed_split',
  interest_percent     NUMERIC(7,4),
  purchase_start_date  DATE NOT NULL,
  status               product_status NOT NULL DEFAULT 'ACTIVE',
  account_source       account_type NOT NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_customer_id ON products(customer_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_account_source ON products(account_source);
CREATE INDEX idx_products_start_date ON products(purchase_start_date);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: installment_schedule
-- ============================================================

CREATE TABLE installment_schedule (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  installment_number  INT NOT NULL CHECK (installment_number >= 1),
  due_date            DATE NOT NULL,
  expected_amount     NUMERIC(14,2) NOT NULL,
  paid_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_on             DATE,
  is_paid             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, installment_number)
);

CREATE INDEX idx_schedule_product_id ON installment_schedule(product_id);
CREATE INDEX idx_schedule_due_date ON installment_schedule(due_date);
CREATE INDEX idx_schedule_is_paid ON installment_schedule(is_paid);

CREATE TRIGGER schedule_updated_at
  BEFORE UPDATE ON installment_schedule
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: payments (immutable ledger)
-- ============================================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  installment_id  UUID REFERENCES installment_schedule(id) ON DELETE SET NULL,
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  paid_on         DATE NOT NULL,
  payment_method  payment_method NOT NULL DEFAULT 'CASH',
  payment_type    payment_type NOT NULL,
  reference_no    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_product_id ON payments(product_id);
CREATE INDEX idx_payments_installment_id ON payments(installment_id);
CREATE INDEX idx_payments_paid_on ON payments(paid_on);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);

-- ============================================================
-- TABLE: company_expenses
-- ============================================================

CREATE TABLE company_expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_type account_type NOT NULL,
  category     TEXT NOT NULL,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  incurred_on  DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_account_type ON company_expenses(account_type);
CREATE INDEX idx_expenses_incurred_on ON company_expenses(incurred_on);

-- ============================================================
-- COMPUTED VIEW: product summary with paid/remaining amounts
-- ============================================================

CREATE OR REPLACE VIEW product_summary AS
SELECT
  p.id,
  p.customer_id,
  p.product_name,
  p.sale_price,
  p.cost_price,
  p.down_payment,
  p.monthly_installment,
  p.installment_count,
  p.purchase_start_date,
  p.status,
  p.account_source,
  p.pricing_mode,
  p.interest_percent,
  p.supplier_name,
  p.notes,
  p.created_at,
  COALESCE(pay_totals.total_paid, 0)                         AS total_paid,
  p.sale_price - COALESCE(pay_totals.total_paid, 0)          AS remaining_balance,
  COALESCE(sched.paid_count, 0)                              AS installments_paid,
  p.installment_count - COALESCE(sched.paid_count, 0)        AS installments_remaining,
  COALESCE(sched.overdue_count, 0)                           AS overdue_count
FROM products p
LEFT JOIN (
  SELECT product_id, SUM(amount) AS total_paid
  FROM payments
  GROUP BY product_id
) pay_totals ON pay_totals.product_id = p.id
LEFT JOIN (
  SELECT
    product_id,
    COUNT(*) FILTER (WHERE is_paid = TRUE)               AS paid_count,
    COUNT(*) FILTER (WHERE is_paid = FALSE AND due_date < CURRENT_DATE) AS overdue_count
  FROM installment_schedule
  GROUP BY product_id
) sched ON sched.product_id = p.id;

-- ============================================================
-- FUNCTION: auto-generate installment schedule
-- ============================================================

CREATE OR REPLACE FUNCTION generate_installment_schedule(
  p_product_id    UUID,
  p_start_date    DATE,
  p_amount        NUMERIC,
  p_count         INT DEFAULT 12
)
RETURNS VOID AS $$
DECLARE
  i INT;
BEGIN
  FOR i IN 1..p_count LOOP
    INSERT INTO installment_schedule (
      product_id,
      installment_number,
      due_date,
      expected_amount
    ) VALUES (
      p_product_id,
      i,
      p_start_date + (i * INTERVAL '1 month'),
      p_amount
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: create sale with schedule (transaction)
-- ============================================================

CREATE OR REPLACE FUNCTION create_sale(
  p_customer_id       UUID,
  p_product_name      TEXT,
  p_supplier_name     TEXT,
  p_cost_price        NUMERIC,
  p_sale_price        NUMERIC,
  p_down_payment      NUMERIC,
  p_monthly_installment NUMERIC,
  p_installment_count INT,
  p_pricing_mode      pricing_mode,
  p_interest_percent  NUMERIC,
  p_start_date        DATE,
  p_account_source    account_type,
  p_notes             TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Insert product
  INSERT INTO products (
    customer_id, product_name, supplier_name, cost_price, sale_price,
    down_payment, monthly_installment, installment_count,
    pricing_mode, interest_percent, purchase_start_date,
    account_source, notes
  ) VALUES (
    p_customer_id, p_product_name, p_supplier_name, p_cost_price, p_sale_price,
    p_down_payment, p_monthly_installment, p_installment_count,
    p_pricing_mode, p_interest_percent, p_start_date,
    p_account_source, p_notes
  ) RETURNING id INTO v_product_id;

  -- Generate installment schedule
  PERFORM generate_installment_schedule(
    v_product_id, p_start_date, p_monthly_installment, p_installment_count
  );

  -- Record down payment if > 0
  IF p_down_payment > 0 THEN
    INSERT INTO payments (product_id, amount, paid_on, payment_method, payment_type)
    VALUES (v_product_id, p_down_payment, p_start_date, 'CASH', 'DOWN_PAYMENT');
  END IF;

  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: record installment payment
-- ============================================================

CREATE OR REPLACE FUNCTION record_installment_payment(
  p_installment_id UUID,
  p_amount         NUMERIC,
  p_paid_on        DATE,
  p_method         payment_method DEFAULT 'CASH',
  p_reference_no   TEXT DEFAULT NULL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get product_id from installment
  SELECT product_id INTO v_product_id
  FROM installment_schedule WHERE id = p_installment_id;

  -- Update installment schedule row
  UPDATE installment_schedule
  SET
    paid_amount = p_amount,
    paid_on     = p_paid_on,
    is_paid     = TRUE
  WHERE id = p_installment_id;

  -- Insert payment record
  INSERT INTO payments (product_id, installment_id, amount, paid_on, payment_method, payment_type)
  VALUES (v_product_id, p_installment_id, p_amount, p_paid_on, p_method, 'INSTALLMENT');

  -- Auto-complete product if all installments paid
  UPDATE products
  SET status = 'COMPLETED'
  WHERE id = v_product_id
    AND status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM installment_schedule
      WHERE product_id = v_product_id AND is_paid = FALSE
    );
END;
$$ LANGUAGE plpgsql;
