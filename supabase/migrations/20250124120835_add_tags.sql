-- Create the tags table
CREATE TABLE IF NOT EXISTS "public"."tag" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "color" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tag_name_key" UNIQUE ("name")
);

-- Create the junction table for ticket tags
CREATE TABLE IF NOT EXISTS "public"."ticket_tag" (
    "ticket_id" uuid NOT NULL,
    "tag_id" uuid NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "ticket_tag_pkey" PRIMARY KEY ("ticket_id", "tag_id"),
    CONSTRAINT "ticket_tag_ticket_id_fkey" FOREIGN KEY ("ticket_id")
        REFERENCES "public"."ticket" ("id") ON DELETE CASCADE,
    CONSTRAINT "ticket_tag_tag_id_fkey" FOREIGN KEY ("tag_id")
        REFERENCES "public"."tag" ("id") ON DELETE CASCADE
);

-- Enable RLS on the new tables
ALTER TABLE "public"."tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ticket_tag" ENABLE ROW LEVEL SECURITY;

-- Create policies for tag table
CREATE POLICY "authenticated users can view tags"
ON "public"."tag"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can create/update/delete tags
CREATE POLICY "admins can manage tags"
ON "public"."tag"
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create policies for ticket_tag table
CREATE POLICY "users can view tags for tickets they can access"
ON "public"."ticket_tag"
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM ticket
        WHERE id = ticket_id
        AND (
            created_by = auth.uid()
            OR assigned_to = auth.uid()
            OR EXISTS (
                SELECT 1 FROM "user"
                WHERE id = auth.uid()
                AND role IN ('admin', 'agent')
            )
        )
    )
);

-- Agents and admins can manage ticket tags
CREATE POLICY "agents and admins can manage ticket tags"
ON "public"."ticket_tag"
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE id = auth.uid()
        AND role IN ('admin', 'agent')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "user"
        WHERE id = auth.uid()
        AND role IN ('admin', 'agent')
    )
);

-- Add updated_at trigger for tag table
CREATE TRIGGER "update_tag_updated_at"
    BEFORE UPDATE ON "public"."tag"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"(); 