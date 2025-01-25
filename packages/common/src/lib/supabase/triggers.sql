-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS handle_ticket_history_on_insert ON ticket;
DROP TRIGGER IF EXISTS handle_ticket_history_on_update ON ticket;
DROP TRIGGER IF EXISTS handle_ticket_history_on_delete ON ticket;
DROP TRIGGER IF EXISTS update_ticket_timestamp_on_interaction ON interaction;
DROP TRIGGER IF EXISTS update_ticket_timestamp_on_history ON ticket_history;

-- Function to handle ticket history
CREATE OR REPLACE FUNCTION handle_ticket_history()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO ticket_history (
            ticket_id,
            changed_by,
            status_changed_to,
            prio_changed_to
        ) VALUES (
            NEW.id,
            NEW.created_by,
            COALESCE(NEW.status, 'open'::ticket_status),  -- Cast to enum type
            COALESCE(NEW.priority, 'low'::ticket_priority)  -- Cast to enum type
        );
        RETURN NEW;
    END IF;

    -- For UPDATE operations (only when status or priority changes)
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.priority IS DISTINCT FROM OLD.priority) THEN
            INSERT INTO ticket_history (
                ticket_id,
                changed_by,
                status_changed_to,
                prio_changed_to
            ) VALUES (
                NEW.id,
                auth.uid(),
                COALESCE(NEW.status, OLD.status),
                COALESCE(NEW.priority, OLD.priority)
            );
        END IF;
        RETURN NEW;
    END IF;

    -- For DELETE operations
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO ticket_history (
            ticket_id,
            changed_by,
            status_changed_to,
            prio_changed_to
        ) VALUES (
            OLD.id,
            auth.uid(),
            'closed'::ticket_status,  -- Cast to enum type
            OLD.priority
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update ticket timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- No need to explicitly set updated_at as it's handled by Supabase
    -- But we'll do it anyway to ensure consistency
    UPDATE ticket
    SET updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for ticket history
CREATE TRIGGER handle_ticket_history_on_insert
    AFTER INSERT ON ticket
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_history();

CREATE TRIGGER handle_ticket_history_on_update
    AFTER UPDATE ON ticket
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_history();

CREATE TRIGGER handle_ticket_history_on_delete
    BEFORE DELETE ON ticket
    FOR EACH ROW
    EXECUTE FUNCTION handle_ticket_history();

-- Create triggers for updating ticket timestamp
CREATE TRIGGER update_ticket_timestamp_on_interaction
    AFTER INSERT ON interaction
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

CREATE TRIGGER update_ticket_timestamp_on_history
    AFTER INSERT ON ticket_history
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp(); 