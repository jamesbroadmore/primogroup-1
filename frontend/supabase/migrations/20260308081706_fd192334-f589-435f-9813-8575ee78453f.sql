
-- Fix profiles INSERT policy: only allow setting staff_id if admin
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    staff_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
