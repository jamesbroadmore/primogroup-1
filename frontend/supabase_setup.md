# Supabase Setup Instructions

This guide provides the SQL and steps needed to configure your Supabase project for full functionality.

## Required Setup

### 1. Create the `notifications` table

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('timesheet_approved', 'timesheet_rejected', 'timesheet_submitted', 'document_expiring', 'incident_reported', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon;
```

### 2. Create the `hr-documents` Storage Bucket

Go to your Supabase Dashboard → Storage → Create a new bucket:

1. Click "New bucket"
2. Name: `hr-documents`
3. Public bucket: **No** (keep private for security)
4. Click "Create bucket"

Then set up storage policies in the SQL Editor:

```sql
-- Storage policies for hr-documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload HR documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hr-documents');

-- Allow authenticated users to view their uploads
CREATE POLICY "Authenticated users can view HR documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'hr-documents');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update HR documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hr-documents');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete HR documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'hr-documents');
```

### 3. Update compliance_records table (if needed)

The `StaffHR.tsx` component uses additional fields. Run this to ensure they exist:

```sql
-- Add missing columns to compliance_records if they don't exist
DO $$ 
BEGIN
  -- Add document_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'compliance_records' AND column_name = 'document_type') THEN
    ALTER TABLE public.compliance_records ADD COLUMN document_type TEXT;
  END IF;
  
  -- Add document_name column  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'compliance_records' AND column_name = 'document_name') THEN
    ALTER TABLE public.compliance_records ADD COLUMN document_name TEXT;
  END IF;
  
  -- Add document_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'compliance_records' AND column_name = 'document_number') THEN
    ALTER TABLE public.compliance_records ADD COLUMN document_number TEXT;
  END IF;
  
  -- Add uploaded_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'compliance_records' AND column_name = 'uploaded_at') THEN
    ALTER TABLE public.compliance_records ADD COLUMN uploaded_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
```

## Verification

After running the SQL scripts:

1. **Notifications table**: Go to Table Editor → you should see `notifications` table
2. **HR Documents bucket**: Go to Storage → you should see `hr-documents` bucket
3. **Test**: Login to the app and verify:
   - Notification bell in header fetches without errors
   - HR document uploads work in Staff → HR & Docs page

## Troubleshooting

If you see errors in the browser console:
- `relation "notifications" does not exist` → Run the notifications SQL
- `Bucket not found` → Create the hr-documents bucket
- `new row violates row-level security policy` → Check RLS policies are created
