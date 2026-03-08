
-- Assign admin role to parker@cdxi.au (user_id: 07f0e7c1-ab42-4117-949b-0e3f0b723228)
INSERT INTO public.user_roles (user_id, role) VALUES ('07f0e7c1-ab42-4117-949b-0e3f0b723228', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Helper: get staff_id linked to a user via profiles
CREATE OR REPLACE FUNCTION public.get_user_staff_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT staff_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- ========== STAFF POLICIES ==========
DROP POLICY IF EXISTS "Staff readable by authenticated" ON public.staff;
DROP POLICY IF EXISTS "Staff insertable by authenticated" ON public.staff;
DROP POLICY IF EXISTS "Staff updatable by authenticated" ON public.staff;
DROP POLICY IF EXISTS "Staff deletable by authenticated" ON public.staff;

-- Admins see all staff, others see only themselves
CREATE POLICY "Staff select" ON public.staff FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Staff insert" ON public.staff FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff update" ON public.staff FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff delete" ON public.staff FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== CLIENTS POLICIES ==========
DROP POLICY IF EXISTS "Clients readable by authenticated" ON public.clients;
DROP POLICY IF EXISTS "Clients insertable by authenticated" ON public.clients;
DROP POLICY IF EXISTS "Clients updatable by authenticated" ON public.clients;
DROP POLICY IF EXISTS "Clients deletable by authenticated" ON public.clients;

-- Admins see all clients; workers see clients they have shifts with
CREATE POLICY "Clients select" ON public.clients FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR id IN (
      SELECT sc.client_id FROM public.timesheets sc WHERE sc.staff_id = public.get_user_staff_id(auth.uid())
    )
    OR id IN (
      SELECT cn.client_id FROM public.case_notes cn WHERE cn.staff_id = public.get_user_staff_id(auth.uid())
    )
  );
CREATE POLICY "Clients insert" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients update" ON public.clients FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients delete" ON public.clients FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== TIMESHEETS POLICIES ==========
DROP POLICY IF EXISTS "Timesheets readable by authenticated" ON public.timesheets;
DROP POLICY IF EXISTS "Timesheets insertable by authenticated" ON public.timesheets;
DROP POLICY IF EXISTS "Timesheets updatable by authenticated" ON public.timesheets;
DROP POLICY IF EXISTS "Timesheets deletable by authenticated" ON public.timesheets;

CREATE POLICY "Timesheets select" ON public.timesheets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Timesheets insert" ON public.timesheets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Timesheets update" ON public.timesheets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Timesheets delete" ON public.timesheets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== INCIDENTS POLICIES ==========
DROP POLICY IF EXISTS "Incidents readable by authenticated" ON public.incidents;
DROP POLICY IF EXISTS "Incidents insertable by authenticated" ON public.incidents;
DROP POLICY IF EXISTS "Incidents updatable by authenticated" ON public.incidents;
DROP POLICY IF EXISTS "Incidents deletable by authenticated" ON public.incidents;

CREATE POLICY "Incidents select" ON public.incidents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR reported_by = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Incidents insert" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Incidents update" ON public.incidents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Incidents delete" ON public.incidents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== COMPLIANCE POLICIES ==========
DROP POLICY IF EXISTS "Compliance readable by authenticated" ON public.compliance_records;
DROP POLICY IF EXISTS "Compliance insertable by authenticated" ON public.compliance_records;
DROP POLICY IF EXISTS "Compliance updatable by authenticated" ON public.compliance_records;
DROP POLICY IF EXISTS "Compliance deletable by authenticated" ON public.compliance_records;

CREATE POLICY "Compliance select" ON public.compliance_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Compliance insert" ON public.compliance_records FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Compliance update" ON public.compliance_records FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Compliance delete" ON public.compliance_records FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== CASE NOTES POLICIES ==========
DROP POLICY IF EXISTS "Case notes readable by authenticated" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes insertable by authenticated" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes updatable by authenticated" ON public.case_notes;
DROP POLICY IF EXISTS "Case notes deletable by authenticated" ON public.case_notes;

CREATE POLICY "Case notes select" ON public.case_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Case notes insert" ON public.case_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Case notes update" ON public.case_notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()));
CREATE POLICY "Case notes delete" ON public.case_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== SHIFT CHECKINS POLICIES ==========
DROP POLICY IF EXISTS "Allow all read access" ON public.shift_checkins;
DROP POLICY IF EXISTS "Allow all insert access" ON public.shift_checkins;
DROP POLICY IF EXISTS "Allow all update access" ON public.shift_checkins;

CREATE POLICY "Shift checkins select" ON public.shift_checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()) OR staff_name = (SELECT display_name FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Shift checkins insert" ON public.shift_checkins FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Shift checkins update" ON public.shift_checkins FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR staff_id = public.get_user_staff_id(auth.uid()) OR staff_name = (SELECT display_name FROM public.profiles WHERE user_id = auth.uid()));
