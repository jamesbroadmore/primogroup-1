-- Fix: Allow admins to also insert incidents
DROP POLICY IF EXISTS "Incidents insert" ON public.incidents;
CREATE POLICY "Incidents insert" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (reported_by IS NOT NULL AND reported_by = get_user_staff_id(auth.uid()))
  );