# Flashcards Feature

## Overview

Full CRUD operations for flashcards: add, edit (inline), delete, and list with pagination and sorting on the `/flashcards` page. User-specific data with Row-Level Security (RLS).

## Architecture Decision: Generic Naming + User Isolation

**Why `front`/`back` instead of `word`/`translation`?**
- Supports multiple use cases: language learning, concept review, Q&A, etc.
- Future-proof for expansion beyond word pairs
- Maintains simplicity while preserving flexibility

**Why user-specific with RLS?**
- Unlike the shared `words` table, flashcards are personal study materials
- RLS policies ensure users only see their own flashcards
- Follows same pattern as `profiles` table

**Why frontend-only?**
- Supabase client handles CRUD + RLS automatically
- No custom business logic required
- Reduced latency (no proxy through Flask backend)

**Trade-off:** Backend would enable AI integration (auto-generating flashcards), but not needed for basic management.

## Key Implementation Details

### Database: Trigger-Based user_id Population

New `flashcards` table with RLS ([supabase/migrations/20251111205607_create_flashcards.sql](../supabase/migrations/20251111205607_create_flashcards.sql)):

```sql
create table public.flashcards (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.flashcards enable row level security;
```

**Non-trivial detail:** Initial INSERT policy failed with RLS violation. Fixed by using trigger to auto-populate `user_id` ([supabase/migrations/20251111210846_fix_flashcards_insert_policy.sql](../supabase/migrations/20251111210846_fix_flashcards_insert_policy.sql)):

```sql
create or replace function public.handle_flashcard_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_flashcard_user_id
  before insert on public.flashcards
  for each row
  execute function public.handle_flashcard_user_id();
```

This mirrors the pattern used in the `profiles` table.

### Hook Pattern: `useFlashcards`

Extends `useWords` pattern with sorting and update operations ([web/src/hooks/use-flashcards.ts](../web/src/hooks/use-flashcards.ts)):

**Key additions:**
- Multi-column sorting: `created_at` (desc default), `front` (asc), `back` (asc)
- `updateFlashcard()` for inline editing
- Sort state management with direction toggle

### UI: Inline Editing

Enhanced table UI ([web/src/pages/flashcards.tsx](../web/src/pages/flashcards.tsx)):
- Click any field to edit inline (becomes input field)
- Save on blur or Enter key, cancel on Escape
- Sortable column headers with visual indicators
- Two-field add form (front + back inputs)

## Files Modified

1. [supabase/migrations/20251111205607_create_flashcards.sql](../supabase/migrations/20251111205607_create_flashcards.sql) - Table + RLS
2. [supabase/migrations/20251111210846_fix_flashcards_insert_policy.sql](../supabase/migrations/20251111210846_fix_flashcards_insert_policy.sql) - Trigger for user_id
3. [web/src/lib/database.types.ts](../web/src/lib/database.types.ts) - Added `flashcards` types
4. [web/src/hooks/use-flashcards.ts](../web/src/hooks/use-flashcards.ts) - CRUD + sorting hook
5. [web/src/pages/flashcards.tsx](../web/src/pages/flashcards.tsx) - UI with inline editing
6. [web/src/App.tsx](../web/src/App.tsx) - Added `/flashcards` route
7. [web/src/components/app-sidebar.tsx](../web/src/components/app-sidebar.tsx) - Added nav item

## Validation & Constraints

**Current:**
- Empty/whitespace-only input rejected (frontend only)
- No duplicate detection
- No length limits
- Accepts any text (Unicode, special characters, emojis)

**Intentional simplicity:** Users may want duplicate cards for spaced repetition.

## Future Enhancements

- Notes/hints field for mnemonics
- Toast notifications for feedback
- Bulk import/export (CSV)
- Search/filter functionality
- Categories/tags for organization
- Practice mode with spaced repetition
- AI integration for auto-generation
