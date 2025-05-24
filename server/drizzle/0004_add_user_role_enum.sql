-- Create the user_role enum type
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user');

-- Update users table to use the enum
ALTER TABLE public.users 
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ALTER COLUMN role SET DEFAULT 'user'::public.user_role;

-- Update team_members table to use the enum
ALTER TABLE public.team_members 
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ALTER COLUMN role SET DEFAULT 'user'::public.user_role;

-- Add RLS policies for the enum type
GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.user_role TO service_role; 