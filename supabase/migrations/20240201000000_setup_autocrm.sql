-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing document embeddings
create table if not exists document_embeddings (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    metadata jsonb,
    embedding vector(1536), -- OpenAI's text-embedding-ada-002 uses 1536 dimensions
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a hypertable for better performance with time-series data
create index on document_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- RLS Policies for document_embeddings
alter table document_embeddings enable row level security;

create policy "Enable read access for authenticated users"
    on document_embeddings for select
    using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users"
    on document_embeddings for insert
    with check (auth.role() = 'authenticated');

-- Function to search similar documents (updated to match LangChain's expectations)
create or replace function match_documents(
    query_embedding vector(1536),
    filter jsonb default '{}',
    match_count int default 10
)
returns table (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql stable
as $$
begin
    return query
    select
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from document_embeddings
    where case
        when filter->>'ids' is not null then
            id = any(array(select jsonb_array_elements_text(filter->'ids')::uuid))
        else true
    end
    order by embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Create enum types for chat message types and statuses
create type chat_message_type as enum (
  'user',
  'assistant',
  'system',
  'function',
  'tool'
);

create type chat_session_status as enum (
  'active',
  'archived',
  'deleted'
);

create type crm_action_type as enum (
  'email',
  'call',
  'meeting',
  'note',
  'task'
);

create type crm_action_status as enum (
  'pending',
  'completed',
  'cancelled'
);

-- Create chat sessions table
create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  created_by uuid references auth.users(id) not null,
  status chat_session_status not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb,
  ticket_id uuid references ticket(id)
);

-- Create chat messages table
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references chat_sessions(id) not null,
  content text not null,
  message_type chat_message_type not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create CRM actions table
create table if not exists crm_actions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references chat_sessions(id) not null,
  action_type crm_action_type not null,
  target_table text not null,
  target_id uuid not null,
  changes jsonb not null,
  status crm_action_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone
);

-- Add indexes for better query performance
create index chat_sessions_created_by_idx on chat_sessions(created_by);
create index chat_sessions_ticket_id_idx on chat_sessions(ticket_id);
create index chat_messages_session_id_idx on chat_messages(session_id);
create index crm_actions_session_id_idx on crm_actions(session_id);
create index crm_actions_target_id_idx on crm_actions(target_id);

-- Add RLS policies
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table crm_actions enable row level security;

-- Chat sessions policies
create policy "Users can view their own chat sessions"
  on chat_sessions for select
  using (auth.uid() = created_by);

create policy "Users can create their own chat sessions"
  on chat_sessions for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own chat sessions"
  on chat_sessions for update
  using (auth.uid() = created_by);

-- Chat messages policies
create policy "Users can view messages from their sessions"
  on chat_messages for select
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.created_by = auth.uid()
    )
  );

create policy "Users can create messages in their sessions"
  on chat_messages for insert
  with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.created_by = auth.uid()
    )
  );

-- CRM actions policies
create policy "Users can view actions from their sessions"
  on crm_actions for select
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.created_by = auth.uid()
    )
  );

create policy "Users can create actions in their sessions"
  on crm_actions for insert
  with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.created_by = auth.uid()
    )
  );

create policy "Users can update actions in their sessions"
  on crm_actions for update
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.created_by = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for chat_sessions
create trigger update_chat_sessions_updated_at
  before update on chat_sessions
  for each row
  execute function update_updated_at_column(); 