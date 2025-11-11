-- Create decks table
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.decks enable row level security;

-- Create indexes
create index decks_user_id_idx on public.decks(user_id);
create index decks_created_at_idx on public.decks(created_at desc);

-- Create RLS policies for decks
create policy "Users can view their own decks"
  on public.decks
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own decks"
  on public.decks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own decks"
  on public.decks
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own decks"
  on public.decks
  for delete
  using (auth.uid() = user_id);

-- Create trigger function to auto-populate user_id
create or replace function public.handle_deck_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to set user_id on insert
create trigger set_deck_user_id
  before insert on public.decks
  for each row
  execute function public.handle_deck_user_id();

-- Create deck_flashcards junction table
create table public.deck_flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.decks(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamptz default now() not null,
  unique(deck_id, flashcard_id)
);

-- Enable RLS
alter table public.deck_flashcards enable row level security;

-- Create indexes
create index deck_flashcards_deck_id_idx on public.deck_flashcards(deck_id);
create index deck_flashcards_flashcard_id_idx on public.deck_flashcards(flashcard_id);

-- Create RLS policies for deck_flashcards (user must own the deck)
create policy "Users can view flashcards in their own decks"
  on public.deck_flashcards
  for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_flashcards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can add flashcards to their own decks"
  on public.deck_flashcards
  for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_flashcards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can update flashcards in their own decks"
  on public.deck_flashcards
  for update
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_flashcards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete flashcards from their own decks"
  on public.deck_flashcards
  for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_flashcards.deck_id
      and decks.user_id = auth.uid()
    )
  );
