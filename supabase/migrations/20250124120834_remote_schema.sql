

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."interactionType" AS ENUM (
    'email',
    'phone',
    'chat',
    'sms'
);


ALTER TYPE "public"."interactionType" OWNER TO "postgres";


CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."ticket_priority" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'agent',
    'customer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return (
    select json_build_object(
      'role', role,
      'email', email
    )
    from "user"
    where id = user_id
  );
end;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  _name text;
  _role text;
BEGIN
  -- Log the start of the function with user details
  RAISE LOG 'handle_new_user() started for user ID: %, email: %', NEW.id, NEW.email;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;

  -- Extract name and role from metadata with detailed logging
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  RAISE LOG 'Extracted name: %, role: %', _name, _role;

  -- Insert into public.user table with explicit column names
  INSERT INTO public."user" (
    id,
    email,
    name,
    role,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    _name,
    _role,
    NOW()
  );
  
  RAISE LOG 'Successfully created user profile for ID: % with name: % and role: %', NEW.id, _name, _role;
  RETURN NEW;

EXCEPTION
  WHEN others THEN
    -- Log the full error details
    RAISE LOG 'Error in handle_new_user() for user ID %: % (SQLSTATE: %)', 
      NEW.id,
      SQLERRM,
      SQLSTATE;
    RETURN NEW; -- Still return NEW so the auth user is created even if profile fails
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_ticket_history"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_ticket_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ticket_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- No need to explicitly set updated_at as it's handled by Supabase
    -- But we'll do it anyway to ensure consistency
    UPDATE ticket
    SET updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ticket_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."comment" (
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "message_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."comment" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment" IS 'Comments made by agents about a ticket that customers cannot see';



CREATE TABLE IF NOT EXISTS "public"."interaction" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "interaction_type" "public"."interactionType" NOT NULL
);

ALTER TABLE ONLY "public"."interaction" REPLICA IDENTITY FULL;


ALTER TABLE "public"."interaction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_name" "text",
    "industry_type" "text"
);


ALTER TABLE "public"."organization" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."ticket_status" DEFAULT 'open'::"public"."ticket_status",
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority",
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."ticket" REPLICA IDENTITY FULL;


ALTER TABLE "public"."ticket" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_assignment" (
    "assignment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unassigned_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL,
    "ticket_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ticket_assignment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_history" (
    "history_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "status_changed_to" "public"."ticket_status" NOT NULL,
    "prio_changed_to" "public"."ticket_priority" NOT NULL
);


ALTER TABLE "public"."ticket_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "organization" "uuid" DEFAULT "gen_random_uuid"(),
    "role" "public"."user_role"
);


ALTER TABLE "public"."user" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user"."organization" IS 'To what organization a user belongs to';



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."interaction"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_assignment"
    ADD CONSTRAINT "ticket_assignment_pkey" PRIMARY KEY ("assignment_id");



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_pkey" PRIMARY KEY ("history_id");



ALTER TABLE ONLY "public"."ticket"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "handle_ticket_history_on_delete" BEFORE DELETE ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "handle_ticket_history_on_insert" AFTER INSERT ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "handle_ticket_history_on_update" AFTER UPDATE ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "on_ticket_created" AFTER INSERT ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "on_ticket_deleted" AFTER DELETE ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "on_ticket_updated" AFTER UPDATE ON "public"."ticket" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ticket_history"();



CREATE OR REPLACE TRIGGER "update_ticket_timestamp_on_history" AFTER INSERT ON "public"."ticket_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_timestamp"();



CREATE OR REPLACE TRIGGER "update_ticket_timestamp_on_interaction" AFTER INSERT ON "public"."interaction" FOR EACH ROW EXECUTE FUNCTION "public"."update_ticket_timestamp"();



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."interaction"
    ADD CONSTRAINT "messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_assignment"
    ADD CONSTRAINT "ticket_assignment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id");



ALTER TABLE ONLY "public"."ticket_assignment"
    ADD CONSTRAINT "ticket_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."user"("id");



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."ticket"("id");



ALTER TABLE ONLY "public"."ticket"
    ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket"
    ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Agents and admins can create comments" ON "public"."comment" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user"."id"
   FROM "public"."user"
  WHERE ("user"."role" = ANY (ARRAY['agent'::"public"."user_role", 'admin'::"public"."user_role"])))));



CREATE POLICY "Agents and admins can read comments" ON "public"."comment" FOR SELECT USING (("auth"."uid"() IN ( SELECT "user"."id"
   FROM "public"."user"
  WHERE ("user"."role" = ANY (ARRAY['agent'::"public"."user_role", 'admin'::"public"."user_role"])))));



CREATE POLICY "Allow trigger function to insert users" ON "public"."user" FOR INSERT TO "postgres" WITH CHECK (true);



CREATE POLICY "Comments must be associated with existing tickets" ON "public"."comment" FOR INSERT WITH CHECK (("ticket_id" IN ( SELECT "ticket"."id"
   FROM "public"."ticket")));



CREATE POLICY "Enable insert for service role" ON "public"."user" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Users can read their own records" ON "public"."user" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."user" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."user" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "admins can create ticket history entries" ON "public"."ticket_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "admins can view all ticket history" ON "public"."ticket_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "agents can create interactions on any ticket" ON "public"."interaction" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "agents can create ticket assignments" ON "public"."ticket_assignment" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "agents can update any ticket" ON "public"."ticket" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "agents can view all tickets" ON "public"."ticket" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "agents can view interactions on any ticket" ON "public"."interaction" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "agents can view ticket assignments" ON "public"."ticket_assignment" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" = 'agent'::"public"."user_role")))));



CREATE POLICY "authenticated users can create tickets" ON "public"."ticket" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "authenticated users can view user names" ON "public"."user" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_assignment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can create interactions on own tickets" ON "public"."interaction" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."ticket"
  WHERE (("ticket"."id" = "interaction"."ticket_id") AND ("ticket"."created_by" = "auth"."uid"())))));



CREATE POLICY "users can update own tickets" ON "public"."ticket" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "users can view assignments for their tickets" ON "public"."ticket_assignment" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ticket"
  WHERE (("ticket"."id" = "ticket_assignment"."ticket_id") AND ("ticket"."created_by" = "auth"."uid"())))));



CREATE POLICY "users can view history of tickets assigned to them" ON "public"."ticket_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ticket"
  WHERE (("ticket"."id" = "ticket_history"."ticket_id") AND ("ticket"."assigned_to" = "auth"."uid"())))));



CREATE POLICY "users can view history of tickets they created" ON "public"."ticket_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ticket"
  WHERE (("ticket"."id" = "ticket_history"."ticket_id") AND ("ticket"."created_by" = "auth"."uid"())))));



CREATE POLICY "users can view interactions on own tickets" ON "public"."interaction" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ticket"
  WHERE (("ticket"."id" = "interaction"."ticket_id") AND ("ticket"."created_by" = "auth"."uid"())))));



CREATE POLICY "users can view tickets they created" ON "public"."ticket" FOR SELECT TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (("status" <> 'closed'::"public"."ticket_status") OR (EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."id" = "auth"."uid"()) AND ("user"."role" <> 'customer'::"public"."user_role")))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."comment";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."interaction";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ticket";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ticket_history";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_ticket_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_ticket_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_ticket_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticket_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."comment" TO "anon";
GRANT ALL ON TABLE "public"."comment" TO "authenticated";
GRANT ALL ON TABLE "public"."comment" TO "service_role";



GRANT ALL ON TABLE "public"."interaction" TO "anon";
GRANT ALL ON TABLE "public"."interaction" TO "authenticated";
GRANT ALL ON TABLE "public"."interaction" TO "service_role";



GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";



GRANT ALL ON TABLE "public"."ticket" TO "anon";
GRANT ALL ON TABLE "public"."ticket" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_assignment" TO "anon";
GRANT ALL ON TABLE "public"."ticket_assignment" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_assignment" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_history" TO "anon";
GRANT ALL ON TABLE "public"."ticket_history" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_history" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
