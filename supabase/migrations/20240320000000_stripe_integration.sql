-- Enable the Stripe extension
create extension if not exists "stripe" schema extensions;

-- Create customers table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  stripe_customer_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  stripe_subscription_id text unique,
  stripe_customer_id text references public.customers(stripe_customer_id),
  plan_id text not null,
  status text not null,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payment methods table
create table public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  stripe_payment_method_id text unique,
  type text not null,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create billing history table
create table public.billing_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  stripe_invoice_id text unique,
  amount integer not null,
  currency text not null,
  status text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create foreign table for Stripe customers
create foreign table if not exists extensions.stripe_customers (
  id text,
  email text,
  name text,
  description text,
  created integer,
  metadata jsonb
) server stripe options (
  api_key 'stripe_secret_key',
  schema 'public'
);

-- Set up Row Level Security (RLS)
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.billing_history enable row level security;

-- Customers policies
create policy "Users can view their own customer data"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own customer data"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own customer data"
  on public.customers for update
  using (auth.uid() = user_id);

-- Subscriptions policies
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Payment methods policies
create policy "Users can view their own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payment methods"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payment methods"
  on public.payment_methods for update
  using (auth.uid() = user_id);

create policy "Users can delete their own payment methods"
  on public.payment_methods for delete
  using (auth.uid() = user_id);

-- Billing history policies
create policy "Users can view their own billing history"
  on public.billing_history for select
  using (auth.uid() = user_id);

-- Create indexes
create index customers_user_id_idx on public.customers(user_id);
create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index payment_methods_user_id_idx on public.payment_methods(user_id);
create index billing_history_user_id_idx on public.billing_history(user_id);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customers (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 