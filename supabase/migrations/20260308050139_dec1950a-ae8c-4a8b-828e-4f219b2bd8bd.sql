-- Create shift_checkins table for clock in/out with GPS
CREATE TABLE public.shift_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_name TEXT NOT NULL,
  client_name TEXT,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION,
  check_out_lat DOUBLE PRECISION,
  check_out_lng DOUBLE PRECISION,
  check_in_address TEXT,
  check_out_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_checkins ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (will tighten with auth later)
CREATE POLICY "Allow all read access" ON public.shift_checkins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert access" ON public.shift_checkins FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.shift_checkins FOR UPDATE TO anon, authenticated USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shift_checkins_updated_at
  BEFORE UPDATE ON public.shift_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();