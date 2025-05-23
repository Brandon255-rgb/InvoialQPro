-- Add RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own data" ON users;
  DROP POLICY IF EXISTS "Users can update their own data" ON users;
  DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
  DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
  DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
  DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
  DROP POLICY IF EXISTS "Users can view their own items" ON items;
  DROP POLICY IF EXISTS "Users can insert their own items" ON items;
  DROP POLICY IF EXISTS "Users can update their own items" ON items;
  DROP POLICY IF EXISTS "Users can delete their own items" ON items;
  DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
  DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
  DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
  DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
  DROP POLICY IF EXISTS "Users can view their own invoice items" ON invoice_items;
  DROP POLICY IF EXISTS "Users can insert their own invoice items" ON invoice_items;
  DROP POLICY IF EXISTS "Users can update their own invoice items" ON invoice_items;
  DROP POLICY IF EXISTS "Users can delete their own invoice items" ON invoice_items;
  DROP POLICY IF EXISTS "Users can view their own company settings" ON company_settings;
  DROP POLICY IF EXISTS "Users can update their own company settings" ON company_settings;
  DROP POLICY IF EXISTS "Users can insert their own company settings" ON company_settings;
  DROP POLICY IF EXISTS "Users can view their own team members" ON team_members;
  DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
  DROP POLICY IF EXISTS "Users can update their own team members" ON team_members;
  DROP POLICY IF EXISTS "Users can delete their own team members" ON team_members;
  DROP POLICY IF EXISTS "Users can view their own activity feed" ON activity_feed;
  DROP POLICY IF EXISTS "Users can insert their own activity feed entries" ON activity_feed;
  DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;

  -- Create new policies
  CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own items" ON items
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own items" ON items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own items" ON items
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own items" ON items
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own invoice items" ON invoice_items
    FOR DELETE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view their own company settings" ON company_settings
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own company settings" ON company_settings
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own company settings" ON company_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own team members" ON team_members
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);

  CREATE POLICY "Users can insert team members" ON team_members
    FOR INSERT WITH CHECK (auth.uid() = invited_by);

  CREATE POLICY "Users can update their own team members" ON team_members
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = invited_by);

  CREATE POLICY "Users can delete their own team members" ON team_members
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = invited_by);

  CREATE POLICY "Users can view their own activity feed" ON activity_feed
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own activity feed entries" ON activity_feed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$; 