-- Create flashcards table
create table public.flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.flashcards enable row level security;

-- RLS Policies
create policy "Users can view their own flashcards"
  on public.flashcards
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
  on public.flashcards
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
  on public.flashcards
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
  on public.flashcards
  for delete
  using (auth.uid() = user_id);

-- Indexes for better query performance
create index flashcards_user_id_idx on public.flashcards(user_id);
create index flashcards_created_at_idx on public.flashcards(created_at desc);
