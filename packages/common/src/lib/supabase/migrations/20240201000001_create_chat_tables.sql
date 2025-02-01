-- Create enum types for chat message types and statuses
create type chat_message_type as enum (
  'user_input',
  'system_response',
  'action_plan',
  'execution_result'
);

create type chat_session_status as enum (
  'active',
  'completed',
  'error'
);

create type crm_action_type as enum (
  'update',
  'create',
  'delete'
);

create type crm_action_status as enum (
  'planned',
  'executed',
  'reverted'
);

-- Create chat sessions table
create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  status chat_session_status not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat messages table
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references chat_sessions(id) not null,
  content text not null,
  type chat_message_type not null,
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
  status crm_action_status not null default 'planned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  executed_at timestamp with time zone,
  reverted_at timestamp with time zone
);

-- Add indexes for better query performance
create index chat_sessions_user_id_idx on chat_sessions(user_id);
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
  using (auth.uid() = user_id);

create policy "Users can create their own chat sessions"
  on chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
  on chat_sessions for update
  using (auth.uid() = user_id);

-- Chat messages policies
create policy "Users can view messages from their sessions"
  on chat_messages for select
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their sessions"
  on chat_messages for insert
  with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

-- CRM actions policies
create policy "Users can view actions from their sessions"
  on crm_actions for select
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create actions in their sessions"
  on crm_actions for insert
  with check (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update actions in their sessions"
  on crm_actions for update
  using (
    exists (
      select 1 from chat_sessions
      where chat_sessions.id = crm_actions.session_id
      and chat_sessions.user_id = auth.uid()
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