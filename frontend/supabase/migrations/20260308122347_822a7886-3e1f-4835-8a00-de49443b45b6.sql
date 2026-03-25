
-- Junction table for client-staff assignments
CREATE TABLE public.client_staff_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, staff_id)
);

-- Enable RLS
ALTER TABLE public.client_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage assignments"
  ON public.client_staff_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can see their own assignments
CREATE POLICY "Staff can view own assignments"
  ON public.client_staff_assignments FOR SELECT
  USING (staff_id = get_user_staff_id(auth.uid()));

-- Update clients SELECT policy to include assigned staff
DROP POLICY IF EXISTS "Clients select " ON public.clients;
CREATE POLICY "Clients select "
  ON public.clients FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR id IN (SELECT csa.client_id FROM public.client_staff_assignments csa WHERE csa.staff_id = get_user_staff_id(auth.uid()))
    OR id IN (SELECT sc.client_id FROM timesheets sc WHERE sc.staff_id = get_user_staff_id(auth.uid()))
    OR id IN (SELECT cn.client_id FROM case_notes cn WHERE cn.staff_id = get_user_staff_id(auth.uid()))
  );
