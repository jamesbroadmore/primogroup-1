
-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-docs', 'compliance-docs', false);

-- RLS: staff can upload to their own folder (staff_id as folder name)
CREATE POLICY "Staff can upload own compliance docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'compliance-docs'
  AND (
    (storage.foldername(name))[1] = get_user_staff_id(auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS: staff can view own docs, admins can view all
CREATE POLICY "Staff can view own compliance docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'compliance-docs'
  AND (
    (storage.foldername(name))[1] = get_user_staff_id(auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS: admins can delete compliance docs
CREATE POLICY "Admins can delete compliance docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'compliance-docs'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow staff to insert their own compliance records
DROP POLICY IF EXISTS "Compliance insert" ON public.compliance_records;
CREATE POLICY "Compliance insert"
ON public.compliance_records FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR staff_id = get_user_staff_id(auth.uid())
);
