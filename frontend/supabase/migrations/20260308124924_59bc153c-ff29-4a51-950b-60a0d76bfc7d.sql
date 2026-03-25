
-- Invoices table for subcontractors
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text NOT NULL UNIQUE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  abn text,
  status text NOT NULL DEFAULT 'draft',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoice line items linked to timesheets
CREATE TABLE public.invoice_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  timesheet_id uuid REFERENCES public.timesheets(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  description text NOT NULL,
  hours numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  service_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Auto-increment invoice numbers via a sequence
CREATE SEQUENCE public.invoice_number_seq START WITH 1001;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Invoices: contractors see own, admins see all
CREATE POLICY "Staff can view own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (staff_id = get_user_staff_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert own invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (staff_id = get_user_staff_id(auth.uid()));

CREATE POLICY "Staff can update own draft invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (
    (staff_id = get_user_staff_id(auth.uid()) AND status = 'draft')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Line items: follow parent invoice access
CREATE POLICY "View line items via invoice"
  ON public.invoice_line_items FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE staff_id = get_user_staff_id(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Insert line items for own invoices"
  ON public.invoice_line_items FOR INSERT TO authenticated
  WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE staff_id = get_user_staff_id(auth.uid()) AND status = 'draft'));

CREATE POLICY "Update line items for own draft invoices"
  ON public.invoice_line_items FOR UPDATE TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE (staff_id = get_user_staff_id(auth.uid()) AND status = 'draft') OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Delete line items for own draft invoices"
  ON public.invoice_line_items FOR DELETE TO authenticated
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE (staff_id = get_user_staff_id(auth.uid()) AND status = 'draft') OR has_role(auth.uid(), 'admin'::app_role)));

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')
$$;
