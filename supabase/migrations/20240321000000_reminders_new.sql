-- Drop the reminders_new table if it exists
DROP TABLE IF EXISTS reminders_new CASCADE;

-- Create the new reminders_new table
CREATE TABLE reminders_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_id UUID REFERENCES invoices(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes
CREATE INDEX reminders_new_user_id_idx ON reminders_new(user_id);
CREATE INDEX reminders_new_invoice_id_idx ON reminders_new(invoice_id);
CREATE INDEX reminders_new_due_date_idx ON reminders_new(due_date);

-- Add RLS policies
ALTER TABLE reminders_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
    ON reminders_new FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
    ON reminders_new FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON reminders_new FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON reminders_new FOR DELETE
    USING (auth.uid() = user_id); 