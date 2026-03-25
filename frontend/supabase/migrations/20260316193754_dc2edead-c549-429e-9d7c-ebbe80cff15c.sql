
-- 1. Training Records table
CREATE TABLE public.training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_type TEXT NOT NULL DEFAULT 'other',
  provider TEXT,
  completion_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage training records" ON public.training_records
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff view own training" ON public.training_records
  FOR SELECT TO authenticated
  USING (staff_id = get_user_staff_id(auth.uid()));

CREATE POLICY "Staff insert own training" ON public.training_records
  FOR INSERT TO authenticated
  WITH CHECK (staff_id = get_user_staff_id(auth.uid()));

-- 2. Policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  policy_category TEXT NOT NULL,
  document_url TEXT,
  content TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  published_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  requires_acknowledgement BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage policies" ON public.policies
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "All staff view published policies" ON public.policies
  FOR SELECT TO authenticated
  USING (status = 'published');

-- 3. Policy Acknowledgements table
CREATE TABLE public.policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  UNIQUE(staff_id, policy_id)
);

ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all acknowledgements" ON public.policy_acknowledgements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff view own acknowledgements" ON public.policy_acknowledgements
  FOR SELECT TO authenticated
  USING (staff_id = get_user_staff_id(auth.uid()));

CREATE POLICY "Staff insert own acknowledgements" ON public.policy_acknowledgements
  FOR INSERT TO authenticated
  WITH CHECK (staff_id = get_user_staff_id(auth.uid()));

-- 4. Onboarding Tasks table (DB-backed checklist)
CREATE TABLE public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'document',
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage onboarding tasks" ON public.onboarding_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff view own onboarding" ON public.onboarding_tasks
  FOR SELECT TO authenticated
  USING (staff_id = get_user_staff_id(auth.uid()));

CREATE POLICY "Staff update own onboarding" ON public.onboarding_tasks
  FOR UPDATE TO authenticated
  USING (staff_id = get_user_staff_id(auth.uid()));

-- 5. Immutability: prevent updates on case_notes after creation (except by admin)
CREATE OR REPLACE FUNCTION public.prevent_case_note_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admin edits
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Block if note is older than 1 hour
  IF OLD.created_at < (now() - interval '1 hour') THEN
    RAISE EXCEPTION 'Case notes cannot be modified after 1 hour. Contact an administrator.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER case_notes_immutability
  BEFORE UPDATE ON public.case_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_case_note_edit();

-- 6. Immutability: prevent updates on incidents after submission
CREATE OR REPLACE FUNCTION public.prevent_incident_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admin to update status/follow-up fields only
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Incident reports cannot be modified after submission. Contact an administrator.';
END;
$$;

CREATE TRIGGER incidents_immutability
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_incident_edit();

-- 7. Add created_by/updated_by to key tables
ALTER TABLE public.case_notes ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by UUID;

-- 8. Function to auto-populate onboarding tasks for new staff
CREATE OR REPLACE FUNCTION public.create_onboarding_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_names TEXT[] := ARRAY[
    'NDIS Worker Screening Check',
    'Working with Children Check',
    'National Police Check',
    'First Aid Certificate',
    'CPR Certificate',
    'Driver Licence',
    'Contractor Agreement Signed',
    'Code of Conduct Acknowledged',
    'Privacy Policy Acknowledged',
    'Safeguarding Policy Acknowledged'
  ];
  task_types TEXT[] := ARRAY[
    'document', 'document', 'document', 'document', 'document',
    'document', 'document', 'policy', 'policy', 'policy'
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(task_names, 1) LOOP
    INSERT INTO public.onboarding_tasks (staff_id, task_name, task_type)
    VALUES (NEW.id, task_names[i], task_types[i]);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_onboarding
  AFTER INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.create_onboarding_tasks();

-- 9. Add injury/medical fields to incidents
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS injury_occurred BOOLEAN DEFAULT false;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS medical_attention_required BOOLEAN DEFAULT false;

-- 10. Seed default policies
INSERT INTO public.policies (title, policy_category, status, content, requires_acknowledgement) VALUES
  ('Code of Conduct', 'code_of_conduct', 'published', 'All staff must act with integrity, maintain professional boundaries, and report concerns about client safety immediately. Staff must not accept gifts or share client information outside of work.', true),
  ('Incident Reporting Policy', 'incident_reporting', 'published', 'All incidents must be reported within 24 hours using the Incidents module. This includes injuries, medication errors, behavioural incidents, and safeguarding concerns. Serious incidents must be escalated to coordinators immediately.', true),
  ('Privacy & Confidentiality Policy', 'privacy', 'published', 'Client information is confidential under Australian Privacy Principles. Staff must not discuss clients outside work or on social media. Only access information needed for your role. Breaches may result in disciplinary action.', true),
  ('Safeguarding Policy', 'safeguarding', 'published', 'Staff have a duty to protect clients from abuse, neglect, and exploitation. Report any safeguarding concerns immediately. Do not investigate concerns yourself — escalate to management.', true),
  ('Workplace Health & Safety Policy', 'whs', 'published', 'Follow safe work practices at all times. Report hazards and near-misses. Use personal protective equipment as required. Complete manual handling training before assisting clients.', true)
ON CONFLICT DO NOTHING;
