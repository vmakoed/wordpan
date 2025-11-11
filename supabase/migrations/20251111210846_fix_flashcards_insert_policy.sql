-- Drop the old insert policy
drop policy if exists "Users can insert their own flashcards" on public.flashcards;

-- Create a new insert policy that allows any authenticated user to insert
-- The user_id will be automatically set via a trigger
create policy "Users can insert their own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (true);

-- Create a trigger function to automatically set user_id on insert
create or replace function public.handle_flashcard_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to run before insert
create trigger set_flashcard_user_id
  before insert on public.flashcards
  for each row
  execute function public.handle_flashcard_user_id();
