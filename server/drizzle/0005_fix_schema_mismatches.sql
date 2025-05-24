-- Create missing enum types
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');

-- Fix users table
ALTER TABLE public.users
  -- Add missing status column
  ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'active',
  -- Fix timestamps to use timezone
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- Fix clients table
ALTER TABLE public.clients
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS clients_user_id_fkey,
  ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix items table
ALTER TABLE public.items
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS items_user_id_fkey,
  ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix invoices table
ALTER TABLE public.invoices
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix client_id reference
  DROP CONSTRAINT IF EXISTS invoices_client_id_fkey,
  ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Fix invoice_items table
ALTER TABLE public.invoice_items
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix invoice_id and item_id to UUID
  ALTER COLUMN invoice_id TYPE uuid USING invoice_id::uuid,
  ALTER COLUMN item_id TYPE uuid USING item_id::uuid,
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS invoice_items_user_id_fkey,
  ADD CONSTRAINT invoice_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix company_settings table
ALTER TABLE public.company_settings
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS company_settings_user_id_fkey,
  ADD CONSTRAINT company_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix reminders table
ALTER TABLE public.reminders
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix invoice_id to UUID
  ALTER COLUMN invoice_id TYPE uuid USING invoice_id::uuid,
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS reminders_user_id_fkey,
  ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix attachments table
ALTER TABLE public.attachments
  -- Change id to UUID
  ALTER COLUMN id TYPE uuid USING gen_random_uuid(),
  -- Fix reminder_id to UUID
  ALTER COLUMN reminder_id TYPE uuid USING reminder_id::uuid,
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS attachments_user_id_fkey,
  ADD CONSTRAINT attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix team_members table
ALTER TABLE public.team_members
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  -- Fix role to use enum
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS team_members_user_id_fkey,
  ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_settings table
ALTER TABLE public.user_settings
  -- Fix timestamps
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey,
  ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix activity_feed table
ALTER TABLE public.activity_feed
  -- Fix timestamps
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey,
  ADD CONSTRAINT activity_feed_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix subscriptions table
ALTER TABLE public.subscriptions
  -- Fix timestamps
  ALTER COLUMN current_period_start TYPE timestamptz USING current_period_start AT TIME ZONE 'UTC',
  ALTER COLUMN current_period_end TYPE timestamptz USING current_period_end AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  -- Fix user_id reference
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
  ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Grant permissions for the new enum type
GRANT USAGE ON TYPE public.user_status TO authenticated;
GRANT USAGE ON TYPE public.user_status TO service_role;

-- Update RLS policies to use auth.users instead of users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id); 