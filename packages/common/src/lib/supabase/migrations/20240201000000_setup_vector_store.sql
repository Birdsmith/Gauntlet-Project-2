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

-- RLS Policies
alter table document_embeddings enable row level security;

create policy "Enable read access for authenticated users"
    on document_embeddings for select
    using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users"
    on document_embeddings for insert
    with check (auth.role() = 'authenticated');

-- Function to search similar documents
create or replace function match_documents(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
language sql stable
as $$
    select
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from document_embeddings
    where 1 - (embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
$$; 