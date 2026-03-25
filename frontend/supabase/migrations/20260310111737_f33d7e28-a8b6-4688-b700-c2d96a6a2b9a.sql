
-- Service categories per funding program (NDIS line items, aged care service types, etc.)
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_program text NOT NULL CHECK (funding_program IN ('ndis', 'aged_care', 'private')),
  category_code text NOT NULL,
  category_name text NOT NULL,
  description text,
  max_rate numeric,
  weekend_rate_multiplier numeric DEFAULT 1.5,
  public_holiday_rate_multiplier numeric DEFAULT 2.0,
  requires_qualification text[],
  gst_applicable boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(funding_program, category_code)
);

-- Client funding details (extends basic funding_type on clients table)
CREATE TABLE public.client_funding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  funding_program text NOT NULL CHECK (funding_program IN ('ndis', 'aged_care', 'private')),
  plan_number text,
  plan_start_date date,
  plan_end_date date,
  total_budget numeric,
  budget_used numeric DEFAULT 0,
  approved_categories text[],
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'suspended')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Care plans linked to clients
CREATE TABLE public.care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  goals text[],
  approved_services text[],
  start_date date,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'draft', 'suspended')),
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service agreements
CREATE TABLE public.service_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agreement_date date NOT NULL DEFAULT CURRENT_DATE,
  signed boolean DEFAULT false,
  document_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billing validation results (audit trail for every invoice check)
CREATE TABLE public.billing_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id uuid REFERENCES public.timesheets(id),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  validation_type text NOT NULL,
  passed boolean NOT NULL,
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Compliance flags for automated monitoring
CREATE TABLE public.compliance_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type text NOT NULL,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  resource_type text NOT NULL,
  resource_id uuid,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  resolved_by uuid,
  resolved_at timestamptz,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add service_category_id to timesheets for service mapping
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS service_category_id uuid REFERENCES public.service_categories(id);

-- Add funding_program to invoice_line_items for funding stream separation
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS funding_program text;
ALTER TABLE public.invoice_line_items ADD COLUMN IF NOT EXISTS service_category_id uuid REFERENCES public.service_categories(id);

-- Enable RLS on all new tables
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;

-- RLS: service_categories - readable by all authenticated, managed by admins
CREATE POLICY "Service categories viewable by authenticated" ON public.service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage service categories" ON public.service_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: client_funding - admins full access, staff view assigned clients
CREATE POLICY "Admins manage client funding" ON public.client_funding FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff view assigned client funding" ON public.client_funding FOR SELECT TO authenticated USING (
  client_id IN (SELECT csa.client_id FROM public.client_staff_assignments csa WHERE csa.staff_id = get_user_staff_id(auth.uid()))
);

-- RLS: care_plans - admins full access, staff view assigned
CREATE POLICY "Admins manage care plans" ON public.care_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff view assigned care plans" ON public.care_plans FOR SELECT TO authenticated USING (
  client_id IN (SELECT csa.client_id FROM public.client_staff_assignments csa WHERE csa.staff_id = get_user_staff_id(auth.uid()))
);

-- RLS: service_agreements - admins full access, staff view assigned
CREATE POLICY "Admins manage service agreements" ON public.service_agreements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff view assigned service agreements" ON public.service_agreements FOR SELECT TO authenticated USING (
  client_id IN (SELECT csa.client_id FROM public.client_staff_assignments csa WHERE csa.staff_id = get_user_staff_id(auth.uid()))
);

-- RLS: billing_validations - admins full access, staff view own
CREATE POLICY "Admins manage billing validations" ON public.billing_validations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff view own billing validations" ON public.billing_validations FOR SELECT TO authenticated USING (
  invoice_id IN (SELECT i.id FROM public.invoices i WHERE i.staff_id = get_user_staff_id(auth.uid()))
);
CREATE POLICY "Staff insert billing validations" ON public.billing_validations FOR INSERT TO authenticated WITH CHECK (
  invoice_id IN (SELECT i.id FROM public.invoices i WHERE i.staff_id = get_user_staff_id(auth.uid()))
);

-- RLS: compliance_flags - admin only
CREATE POLICY "Admins manage compliance flags" ON public.compliance_flags FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins view compliance flags" ON public.compliance_flags FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default NDIS service categories
INSERT INTO public.service_categories (funding_program, category_code, category_name, description, max_rate, gst_applicable) VALUES
  ('ndis', 'CORE_DAILY', 'Assistance with Daily Life', 'Core support for daily personal activities', 67.56, false),
  ('ndis', 'CORE_COMMUNITY', 'Community Participation', 'Support to participate in community activities', 67.56, false),
  ('ndis', 'CORE_CONSUMABLES', 'Consumables', 'Everyday items and assistive technology consumables', null, false),
  ('ndis', 'CORE_TRANSPORT', 'Transport', 'Transport assistance to activities', 0.97, false),
  ('ndis', 'CAP_HOME', 'Home Modifications', 'Modifications to make home accessible', null, false),
  ('ndis', 'CAP_LIVING', 'Specialist Disability Accommodation', 'SDA supports', null, false),
  ('ndis', 'CB_DAILY', 'Improved Daily Living Skills', 'Therapeutic and training supports', 214.41, false),
  ('ndis', 'CB_RELATIONSHIPS', 'Improved Relationships', 'Behaviour support and social skills', 214.41, false),
  ('ndis', 'CB_EMPLOYMENT', 'Finding & Keeping a Job', 'Employment related supports', 67.56, false),
  ('ndis', 'CB_HEALTH', 'Improved Health & Wellbeing', 'Exercise and health supports', 67.56, false),
  ('ndis', 'CB_LIFELONG', 'Improved Life Choices', 'Plan management and coordination', 100.14, false),
  ('aged_care', 'AC_PERSONAL', 'Personal Care', 'Assistance with personal hygiene and daily tasks', 60.00, false),
  ('aged_care', 'AC_DOMESTIC', 'Domestic Assistance', 'Help with household tasks', 55.00, false),
  ('aged_care', 'AC_MEALS', 'Meal Preparation', 'Meal planning and preparation', 55.00, false),
  ('aged_care', 'AC_SOCIAL', 'Social Support', 'Social and community participation', 55.00, false),
  ('aged_care', 'AC_TRANSPORT', 'Transport', 'Transport to appointments and activities', 50.00, false),
  ('aged_care', 'AC_NURSING', 'Nursing Care', 'Clinical nursing services', 85.00, false),
  ('aged_care', 'AC_ALLIED', 'Allied Health', 'Physiotherapy, OT, and other allied health', 100.00, false),
  ('aged_care', 'AC_RESPITE', 'Respite Care', 'Carer respite services', 60.00, false),
  ('private', 'PVT_SUPPORT', 'Support Services', 'General private support services', null, true),
  ('private', 'PVT_COMPANION', 'Companionship', 'Social and companion services', null, true),
  ('private', 'PVT_DOMESTIC', 'Domestic Services', 'Private domestic assistance', null, true);
