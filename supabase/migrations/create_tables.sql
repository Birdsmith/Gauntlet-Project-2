-- Create enum types for status and roles
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    priority ticket_priority NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    assigned_agent_id UUID REFERENCES users(id),
    tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- Create ticket_messages table
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tickets table
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
    ON users FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

CREATE POLICY "Agents and admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'agent')
        )
    );

-- Tickets policies
CREATE POLICY "Customers can view their own tickets"
    ON tickets FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create tickets"
    ON tickets FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Agents and admins can view all tickets"
    ON tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Agents and admins can update tickets"
    ON tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'agent')
        )
    );

-- Ticket messages policies
CREATE POLICY "Users can view messages of their tickets"
    ON ticket_messages FOR SELECT
    USING (
        auth.uid() IN (
            SELECT customer_id FROM tickets WHERE id = ticket_id
            UNION
            SELECT assigned_agent_id FROM tickets WHERE id = ticket_id
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Users can create messages for their tickets"
    ON ticket_messages FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT customer_id FROM tickets WHERE id = ticket_id
            UNION
            SELECT assigned_agent_id FROM tickets WHERE id = ticket_id
        )
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'agent')
        )
    ); 