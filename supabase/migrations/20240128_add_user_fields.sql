-- Add avatar_url and department fields to user table
ALTER TABLE "public"."user"
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS department text; 