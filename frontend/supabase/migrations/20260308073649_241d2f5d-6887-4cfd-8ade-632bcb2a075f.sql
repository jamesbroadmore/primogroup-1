-- Remove spoofable staff_name fallback from shift_checkins SELECT and UPDATE policies
DROP POLICY IF EXISTS "Shift checkins select" ON public.shift_checkins;
CREATE POLICY "Shift checkins select" ON public.shift_checkins
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR staff_id = public.get_user_staff_id(auth.uid())
  );

DROP POLICY IF EXISTS "Shift checkins update" ON public.shift_checkins;
CREATE POLICY "Shift checkins update" ON public.shift_checkins
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR staff_id = public.get_user_staff_id(auth.uid())
  );