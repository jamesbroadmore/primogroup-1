
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  resource text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, resource)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage permissions
CREATE POLICY "Admins can select permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert permissions"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update permissions"
  ON public.role_permissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permissions"
  ON public.role_permissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default permissions
INSERT INTO public.role_permissions (role, resource, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'staff', true, true, true, true),
  ('admin', 'clients', true, true, true, true),
  ('admin', 'timesheets', true, true, true, true),
  ('admin', 'case_notes', true, true, true, true),
  ('admin', 'incidents', true, true, true, true),
  ('admin', 'compliance', true, true, true, true),
  ('admin', 'financials', true, true, true, true),
  ('admin', 'reports', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  ('moderator', 'staff', true, true, true, false),
  ('moderator', 'clients', true, true, true, false),
  ('moderator', 'timesheets', true, true, true, false),
  ('moderator', 'case_notes', true, true, true, false),
  ('moderator', 'incidents', true, true, true, false),
  ('moderator', 'compliance', true, false, false, false),
  ('moderator', 'financials', true, false, false, false),
  ('moderator', 'reports', true, false, false, false),
  ('moderator', 'settings', false, false, false, false),
  ('user', 'staff', false, false, false, false),
  ('user', 'clients', true, false, false, false),
  ('user', 'timesheets', true, true, false, false),
  ('user', 'case_notes', true, true, false, false),
  ('user', 'incidents', true, true, false, false),
  ('user', 'compliance', false, false, false, false),
  ('user', 'financials', false, false, false, false),
  ('user', 'reports', false, false, false, false),
  ('user', 'settings', false, false, false, false);
