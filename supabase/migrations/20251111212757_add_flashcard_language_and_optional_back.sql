-- Make back field optional (nullable)
alter table public.flashcards
  alter column back drop not null;

-- Add language field for translation target
alter table public.flashcards
  add column language varchar(10) not null default 'es';

-- Add comment for clarity
comment on column public.flashcards.language is 'Target language code for translation (e.g., es, fr, de, it, pt)';
comment on column public.flashcards.back is 'Back side of flashcard (translation). Can be null if not yet translated.';
