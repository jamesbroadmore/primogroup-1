
-- ========== STAFF TABLE ==========
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'support_worker' CHECK (role IN ('support_worker', 'team_leader', 'coordinator', 'admin')),
  employment_type TEXT NOT NULL DEFAULT 'casual' CHECK (employment_type IN ('full_time', 'part_time', 'casual', 'contractor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  start_date DATE,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  qualifications TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff readable by authenticated" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff insertable by authenticated" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff updatable by authenticated" ON public.staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Staff deletable by authenticated" ON public.staff FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CLIENTS TABLE ==========
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  ndis_number TEXT,
  ndis_plan_start DATE,
  ndis_plan_end DATE,
  funding_type TEXT CHECK (funding_type IN ('ndis', 'home_care', 'private', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'waitlist', 'discharged')),
  primary_disability TEXT,
  support_needs TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients readable by authenticated" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clients insertable by authenticated" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Clients updatable by authenticated" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Clients deletable by authenticated" ON public.clients FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== TIMESHEETS TABLE ==========
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  break_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(5,2),
  rate_per_hour NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timesheets readable by authenticated" ON public.timesheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Timesheets insertable by authenticated" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Timesheets updatable by authenticated" ON public.timesheets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Timesheets deletable by authenticated" ON public.timesheets FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== INCIDENTS TABLE ==========
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('injury', 'medication_error', 'behavior', 'safeguarding', 'property_damage', 'near_miss', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  description TEXT NOT NULL,
  immediate_action TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Incidents readable by authenticated" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Incidents insertable by authenticated" ON public.incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Incidents updatable by authenticated" ON public.incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Incidents deletable by authenticated" ON public.incidents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== COMPLIANCE RECORDS TABLE ==========
CREATE TABLE public.compliance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('police_check', 'wwcc', 'first_aid', 'cpr', 'manual_handling', 'medication_competency', 'ndis_orientation', 'drivers_license', 'vaccination', 'other')),
  record_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'expiring_soon', 'expired', 'pending', 'not_required')),
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Compliance readable by authenticated" ON public.compliance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Compliance insertable by authenticated" ON public.compliance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Compliance updatable by authenticated" ON public.compliance_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Compliance deletable by authenticated" ON public.compliance_records FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON public.compliance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CASE NOTES TABLE ==========
CREATE TABLE public.case_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  note_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT CHECK (category IN ('general', 'health', 'behavior', 'progress', 'medication', 'incident', 'communication', 'other')),
  content TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Case notes readable by authenticated" ON public.case_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Case notes insertable by authenticated" ON public.case_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Case notes updatable by authenticated" ON public.case_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Case notes deletable by authenticated" ON public.case_notes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON public.case_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ADD user_id to shift_checkins for auth linking ==========
ALTER TABLE public.shift_checkins ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- ========== USER ROLES TABLE ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== PROFILES TABLE ==========
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
