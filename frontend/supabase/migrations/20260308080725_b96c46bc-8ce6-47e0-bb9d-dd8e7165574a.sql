
CREATE TABLE public.organisation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organisation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage org settings"
  ON public.organisation_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow all authenticated users to read org settings
CREATE POLICY "Authenticated can read org settings"
  ON public.organisation_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.organisation_settings (key, value) VALUES
  ('company_name', 'Carters Care Group'),
  ('abn', ''),
  ('phone', ''),
  ('email', ''),
  ('address', ''),
  ('website', ''),
  ('notif_email_alerts', 'true'),
  ('notif_compliance_reminders', 'true'),
  ('notif_shift_notifications', 'true'),
  ('notif_incident_alerts', 'true'),
  ('notif_timesheet_reminders', 'true'),
  ('notif_reminder_days_before', '14'),
  ('data_retention_months', '84'),
  ('data_auto_backup', 'true');
