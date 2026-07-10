-- HandymanOS AI - Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'dispatcher', 'technician', 'accountant', 'customer');
CREATE TYPE job_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'property_management');
CREATE TYPE vehicle_type AS ENUM ('truck', 'van', 'trailer', 'car');

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_plan subscription_plan DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'technician',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  type customer_type DEFAULT 'residential',
  notes TEXT,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  job_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  property_type TEXT,
  unit_number TEXT,
  access_notes TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  hourly_wage DECIMAL(8,2) NOT NULL,
  billing_rate DECIMAL(8,2) DEFAULT 0,
  payroll_tax_rate DECIMAL(4,3) DEFAULT 0.12,
  insurance_cost_monthly DECIMAL(8,2) DEFAULT 0,
  benefits_monthly DECIMAL(8,2) DEFAULT 0,
  overhead_allocation DECIMAL(8,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Catalog
CREATE TABLE service_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  avg_labor_hours DECIMAL(6,2) DEFAULT 0,
  difficulty TEXT DEFAULT 'medium',
  suggested_price DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  materials TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID REFERENCES properties(id),
  title TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'draft',
  priority priority_level DEFAULT 'medium',
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  assigned_technician_id UUID REFERENCES employees(id),
  estimated_hours DECIMAL(6,2) DEFAULT 0,
  actual_hours DECIMAL(6,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  material_cost DECIMAL(12,2) DEFAULT 0,
  fuel_cost DECIMAL(10,2) DEFAULT 0,
  overhead_cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Tasks
CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  estimated_hours DECIMAL(6,2) DEFAULT 0,
  actual_hours DECIMAL(6,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  property_id UUID REFERENCES properties(id),
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  raw_content TEXT,
  ai_extracted_data JSONB,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  property_id UUID REFERENCES properties(id),
  job_id UUID REFERENCES jobs(id),
  work_order_id UUID REFERENCES work_orders(id),
  title TEXT NOT NULL,
  status estimate_status DEFAULT 'draft',
  labor_hours DECIMAL(6,2) DEFAULT 0,
  labor_rate DECIMAL(8,2) DEFAULT 0,
  material_cost DECIMAL(10,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 25,
  total DECIMAL(12,2) DEFAULT 0,
  valid_until DATE,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  job_id UUID REFERENCES jobs(id),
  invoice_number TEXT NOT NULL,
  status invoice_status DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  due_date DATE,
  paid_date TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]',
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT DEFAULT 'card',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  supplier TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 35,
  customer_price DECIMAL(10,2) GENERATED ALWAYS AS (cost * (1 + markup_percent / 100)) STORED,
  quantity DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 5,
  unit TEXT DEFAULT 'each',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  quantity_change DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type vehicle_type DEFAULT 'van',
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  mileage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel Logs
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  miles DECIMAL(8,1) DEFAULT 0,
  gallons DECIMAL(8,2) DEFAULT 0,
  fuel_price DECIMAL(6,3) DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (gallons * fuel_price) STORED,
  job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  job_id UUID REFERENCES jobs(id),
  vehicle_id UUID REFERENCES vehicles(id),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Events
CREATE TABLE schedule_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES employees(id),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  property_id UUID REFERENCES properties(id),
  url TEXT NOT NULL,
  caption TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Results
CREATE TABLE ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  input_data JSONB,
  output_data JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_technician ON jobs(assigned_technician_id);
CREATE INDEX idx_estimates_company ON estimates(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_materials_company ON materials(company_id);
CREATE INDEX idx_schedule_events_company ON schedule_events(company_id);
CREATE INDEX idx_schedule_events_time ON schedule_events(start_time, end_time);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies (company-scoped access)
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Authenticated users can create company" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Company members can update company" ON companies
  FOR UPDATE USING (id = get_user_company_id());

CREATE POLICY "Company members can view profiles" ON profiles
  FOR SELECT USING (company_id = get_user_company_id() OR id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Company members can view customers" ON customers
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can view properties" ON properties
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can view employees" ON employees
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage jobs" ON jobs
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage job tasks" ON job_tasks
  FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE company_id = get_user_company_id()));

CREATE POLICY "Company members can manage work orders" ON work_orders
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage estimates" ON estimates
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage invoices" ON invoices
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage materials" ON materials
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage vehicles" ON vehicles
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage expenses" ON expenses
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage schedule" ON schedule_events
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can view audit logs" ON audit_logs
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Company members can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Company members can manage payments" ON payments
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id = get_user_company_id())
  );

CREATE POLICY "Company members can manage inventory" ON inventory
  FOR ALL USING (
    material_id IN (SELECT id FROM materials WHERE company_id = get_user_company_id())
  );

CREATE POLICY "Company members can manage fuel logs" ON fuel_logs
  FOR ALL USING (vehicle_id IN (SELECT id FROM vehicles WHERE company_id = get_user_company_id()));

CREATE POLICY "Company members can manage documents" ON documents
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage photos" ON photos
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage ai results" ON ai_results
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can manage notifications" ON notifications
  FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Company members can view service catalog" ON service_catalog
  FOR ALL USING (company_id = get_user_company_id());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Profit calculation trigger
CREATE OR REPLACE FUNCTION calculate_job_profit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profit := NEW.revenue - NEW.labor_cost - NEW.material_cost - NEW.fuel_cost - NEW.overhead_cost;
  IF NEW.revenue > 0 THEN
    NEW.profit_margin := (NEW.profit / NEW.revenue) * 100;
  ELSE
    NEW.profit_margin := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_calculate_profit BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION calculate_job_profit();

-- Vendor PO Records (CD Maintenance / Facil-IT PDF imports)
CREATE TABLE vendor_po_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_po_number TEXT NOT NULL,
  client_po_number TEXT,
  priority TEXT,
  order_type TEXT,
  nte_amount DECIMAL(10,2) DEFAULT 0,
  service_date TEXT,
  print_date TEXT,
  client_company TEXT,
  client_contact TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_address TEXT,
  service_location_name TEXT,
  location_number TEXT,
  service_address TEXT,
  service_city TEXT,
  service_state TEXT,
  service_zip TEXT,
  service_phone TEXT,
  vendor_name TEXT,
  vendor_number TEXT,
  vendor_address TEXT,
  vendor_phone TEXT,
  service_category TEXT,
  service_description TEXT,
  work_summary TEXT,
  special_instructions TEXT,
  source_file_name TEXT,
  status TEXT DEFAULT 'parsed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, vendor_po_number)
);

CREATE INDEX idx_vendor_po_company ON vendor_po_records(company_id);
CREATE INDEX idx_vendor_po_number ON vendor_po_records(vendor_po_number);

ALTER TABLE vendor_po_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage vendor PO records" ON vendor_po_records
  FOR ALL USING (company_id = get_user_company_id());

-- Auth: create profile row when user signs up (company linked during onboarding)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'owner'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Portal magic links (customer / property manager access)
CREATE TABLE portal_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  portal_type TEXT NOT NULL CHECK (portal_type IN ('customer', 'property')),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portal_tokens_company ON portal_tokens(company_id);
CREATE INDEX idx_portal_tokens_token ON portal_tokens(token);

ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage portal tokens" ON portal_tokens
  FOR ALL USING (company_id = get_user_company_id());

-- Team invites
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_invites_company ON team_invites(company_id);
CREATE INDEX idx_team_invites_token ON team_invites(token);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage team invites" ON team_invites
  FOR ALL USING (company_id = get_user_company_id());

-- Public token validation (no auth required — used by portal access page)
CREATE OR REPLACE FUNCTION validate_portal_token(p_token TEXT)
RETURNS TABLE (customer_id UUID, portal_type TEXT, company_id UUID, expires_at TIMESTAMPTZ, customer_name TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT pt.customer_id, pt.portal_type, pt.company_id, pt.expires_at, c.name AS customer_name
  FROM portal_tokens pt
  JOIN customers c ON c.id = pt.customer_id
  WHERE pt.token = p_token AND pt.expires_at > NOW()
$$;

CREATE OR REPLACE FUNCTION get_portal_estimates(p_token TEXT)
RETURNS SETOF estimates
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT e.*
  FROM estimates e
  INNER JOIN portal_tokens pt ON pt.token = p_token AND pt.expires_at > NOW()
  WHERE e.company_id = pt.company_id AND e.customer_id = pt.customer_id
  ORDER BY e.created_at DESC
$$;

CREATE OR REPLACE FUNCTION get_portal_invoices(p_token TEXT)
RETURNS SETOF invoices
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT i.*
  FROM invoices i
  INNER JOIN portal_tokens pt ON pt.token = p_token AND pt.expires_at > NOW()
  WHERE i.company_id = pt.company_id AND i.customer_id = pt.customer_id
  ORDER BY i.created_at DESC
$$;

CREATE OR REPLACE FUNCTION get_portal_jobs(p_token TEXT)
RETURNS SETOF jobs
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT j.*
  FROM jobs j
  INNER JOIN portal_tokens pt ON pt.token = p_token AND pt.expires_at > NOW()
  WHERE j.company_id = pt.company_id AND j.customer_id = pt.customer_id
  ORDER BY j.created_at DESC
$$;

CREATE OR REPLACE FUNCTION portal_update_estimate_status(
  p_token TEXT,
  p_estimate_id UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pt portal_tokens%ROWTYPE;
BEGIN
  SELECT * INTO pt FROM portal_tokens WHERE token = p_token AND expires_at > NOW();
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN RETURN FALSE; END IF;

  UPDATE estimates
  SET status = p_status
  WHERE id = p_estimate_id
    AND company_id = pt.company_id
    AND customer_id = pt.customer_id
    AND status = 'sent';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION portal_submit_job_request(
  p_token TEXT,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pt portal_tokens%ROWTYPE;
  v_job_id UUID;
BEGIN
  SELECT * INTO pt FROM portal_tokens WHERE token = p_token AND expires_at > NOW();
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF pt.portal_type <> 'property' THEN RETURN NULL; END IF;

  v_job_id := uuid_generate_v4();
  INSERT INTO jobs (
    id, company_id, customer_id, title, description, status, priority,
    estimated_hours, actual_hours, revenue, labor_cost, material_cost,
    fuel_cost, overhead_cost, profit, profit_margin
  ) VALUES (
    v_job_id, pt.company_id, pt.customer_id, p_title, p_description, 'draft',
    COALESCE(p_priority, 'medium'), 2, 0, 0, 0, 0, 0, 0, 0, 0
  );

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_team_invite(p_token TEXT)
RETURNS TABLE (
  email TEXT,
  role user_role,
  company_id UUID,
  company_name TEXT,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ti.email, ti.role, ti.company_id, c.name AS company_name, ti.expires_at, ti.accepted_at
  FROM team_invites ti
  JOIN companies c ON c.id = ti.company_id
  WHERE ti.token = p_token
$$;

GRANT EXECUTE ON FUNCTION validate_portal_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_portal_estimates(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_portal_invoices(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_portal_jobs(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION portal_update_estimate_status(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION portal_submit_job_request(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_team_invite(TEXT) TO anon, authenticated;

-- Accept invite: mark accepted and link profile to company (bypasses team_invites RLS)
CREATE OR REPLACE FUNCTION accept_team_invite(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite team_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF lower((SELECT email FROM auth.users WHERE id = auth.uid())) <> lower(v_invite.email) THEN
    RETURN FALSE;
  END IF;

  UPDATE team_invites
  SET accepted_at = NOW()
  WHERE id = v_invite.id;

  UPDATE profiles
  SET company_id = v_invite.company_id,
      role = v_invite.role
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_team_invite(TEXT) TO authenticated;

-- Time entries (technician clock in/out)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  profile_id UUID REFERENCES profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_company ON time_entries(company_id);
CREATE INDEX idx_time_entries_job ON time_entries(job_id);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage time entries" ON time_entries
  FOR ALL USING (company_id = get_user_company_id());

-- Storage bucket for job photos and documents (private — use signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('handymanos', 'handymanos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Company members can read files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'handymanos'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Company members can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'handymanos'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Company members can update files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'handymanos'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Company members can delete files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'handymanos'
    AND (storage.foldername(name))[1] = get_user_company_id()::text
  );
