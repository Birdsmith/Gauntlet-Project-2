-- Enable RLS on the ticket table
ALTER TABLE ticket ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the user table
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the interaction table
ALTER TABLE interaction ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the ticket_assignment table
ALTER TABLE ticket_assignment ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the ticket_history table
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view user names and emails
CREATE POLICY "authenticated users can view user names"
ON "user" FOR SELECT
TO authenticated
USING (true);

-- Allow any authenticated user to create tickets
CREATE POLICY "authenticated users can create tickets"
ON ticket FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view tickets they created (except closed ones)
CREATE POLICY "users can view tickets they created"
ON ticket FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  AND (
    status != 'closed' 
    OR EXISTS (
      SELECT 1 FROM "user"
      WHERE id = auth.uid()
      AND role != 'customer'
    )
  )
);

-- Drop redundant policies
DROP POLICY IF EXISTS "users can view tickets assigned to them" ON ticket;
DROP POLICY IF EXISTS "users can view tickets they've interacted with" ON ticket;

-- Create new policy using public.user table
CREATE POLICY "agents can view all tickets"
ON ticket FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow users to update their own tickets
CREATE POLICY "users can update own tickets"
ON ticket FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Allow agents to update any ticket
CREATE POLICY "agents can update any ticket"
ON ticket FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow users to create interactions on their own tickets
CREATE POLICY "users can create interactions on own tickets"
ON interaction FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND created_by = auth.uid()
  )
);

-- Allow users to create interactions on tickets assigned to them
CREATE POLICY "users can create interactions on assigned tickets"
ON interaction FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND assigned_to = auth.uid()
  )
);

-- Allow users to create interactions on tickets they've participated in
CREATE POLICY "users can create interactions on participated tickets"
ON interaction FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM interaction
    WHERE ticket_id = ticket_id
    AND user_id = auth.uid()
  )
);

-- Allow agents to create interactions on any ticket
CREATE POLICY "agents can create interactions on any ticket"
ON interaction FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow users to view interactions on tickets they're involved with
CREATE POLICY "users can view interactions on involved tickets"
ON interaction FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM interaction
        WHERE interaction.ticket_id = ticket.id
        AND interaction.user_id = auth.uid()
      )
    )
  )
);

-- Allow agents to view interactions on any ticket
CREATE POLICY "agents can view interactions on any ticket"
ON interaction FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow agents to create ticket assignments
CREATE POLICY "agents can create ticket assignments"
ON ticket_assignment FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow agents to view all ticket assignments
CREATE POLICY "agents can view ticket assignments"
ON ticket_assignment FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'agent'
  )
);

-- Allow users to view assignments for their own tickets
CREATE POLICY "users can view assignments for their tickets"
ON ticket_assignment FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND created_by = auth.uid()
  )
);

-- Allow users to view history of tickets they created
CREATE POLICY "users can view history of tickets they created"
ON ticket_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND created_by = auth.uid()
  )
);

-- Allow users to view history of tickets assigned to them
CREATE POLICY "users can view history of tickets assigned to them"
ON ticket_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ticket
    WHERE id = ticket_id
    AND assigned_to = auth.uid()
  )
);

-- Allow admins to view all ticket history
CREATE POLICY "admins can view all ticket history"
ON ticket_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to create ticket history entries
CREATE POLICY "admins can create ticket history entries"
ON ticket_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "user"
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Note: We don't need explicit INSERT policies for regular users because
-- the ticket history entries are created by the trigger which runs with
-- elevated privileges (SECURITY DEFINER) 