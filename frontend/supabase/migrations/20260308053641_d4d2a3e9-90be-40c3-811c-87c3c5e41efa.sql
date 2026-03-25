-- Fix 1: Profiles UPDATE policy - prevent users from changing staff_id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      staff_id IS NOT DISTINCT FROM (SELECT p.staff_id FROM public.profiles p WHERE p.user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Fix 2: Restrict profiles SELECT to own row or admin
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fix 3: Tighten shift_checkins INSERT - require staff_id match
DROP POLICY IF EXISTS "Shift checkins insert" ON public.shift_checkins;
CREATE POLICY "Shift checkins insert" ON public.shift_checkins
  FOR INSERT TO authenticated
  WITH CHECK (
    staff_id IS NOT NULL
    AND staff_id = public.get_user_staff_id(auth.uid())
  );

-- Fix 4: Tighten incidents INSERT - require reported_by match
DROP POLICY IF EXISTS "Incidents insert" ON public.incidents;
CREATE POLICY "Incidents insert" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    reported_by IS NOT NULL
    AND reported_by = public.get_user_staff_id(auth.uid())
  );