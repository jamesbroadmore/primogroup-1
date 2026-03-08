
-- 1. Fix organisation_settings: restrict SELECT to admin-only
DROP POLICY IF EXISTS "Authenticated can read org settings" ON public.organisation_settings;
CREATE POLICY "Admins can read org settings"
  ON public.organisation_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix client_staff_assignments: change from public to authenticated role
DROP POLICY IF EXISTS "Admins manage assignments" ON public.client_staff_assignments;
DROP POLICY IF EXISTS "Staff can view own assignments" ON public.client_staff_assignments;

CREATE POLICY "Admins manage assignments"
  ON public.client_staff_assignments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own assignments"
  ON public.client_staff_assignments
  FOR SELECT
  TO authenticated
  USING (staff_id = public.get_user_staff_id(auth.uid()));

-- 3. Fix confidential case notes: restrict confidential notes to admin only, staff see their own non-confidential
DROP POLICY IF EXISTS "Case notes select" ON public.case_notes;
CREATE POLICY "Case notes select"
  ON public.case_notes
  FOR SELECT
  TO authenticated
  USING (
    (public.has_role(auth.uid(), 'admin'::app_role))
    OR
    (staff_id = public.get_user_staff_id(auth.uid()) AND (is_confidential IS NOT TRUE))
  );

-- 4. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Any authenticated user can insert audit entries (for their own actions)
CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
