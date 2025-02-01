-- Create chat message type enum
CREATE TYPE public.chat_message_type AS ENUM (
  'user',
  'assistant',
  'system',
  'function',
  'tool'
);

-- Create chat session status enum
CREATE TYPE public.chat_session_status AS ENUM (
  'active',
  'archived',
  'deleted'
);

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  metadata jsonb,
  status public.chat_session_status DEFAULT 'active'::public.chat_session_status NOT NULL,
  ticket_id uuid REFERENCES public.ticket(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_type public.chat_message_type NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 