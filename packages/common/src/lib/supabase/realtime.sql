-- Enable realtime for ticket table
ALTER PUBLICATION supabase_realtime ADD TABLE ticket;

-- Enable realtime for interaction table
ALTER PUBLICATION supabase_realtime ADD TABLE interaction;

-- Enable realtime for specific columns in ticket
ALTER TABLE ticket REPLICA IDENTITY FULL;

-- Enable realtime for specific columns in interaction
ALTER TABLE interaction REPLICA IDENTITY FULL; 