# Decks Feature

## Overview

Full CRUD operations for decks: organize flashcards into collections for targeted learning. Users can create decks, manage flashcard assignments, and navigate between deck list and detail views. User-specific data with Row-Level Security (RLS).

## Architecture Decision: Many-to-Many Relationship

**Why a junction table?**
- Flashcards can belong to multiple decks (e.g., "Spanish Verbs" and "Advanced Spanish")
- Decks can contain many flashcards
- Enables flexible organization without data duplication
- `deck_flashcards` junction table with `position` field for custom ordering

**Why user-specific with RLS?**
- Decks are personal organizational structures
- RLS policies ensure users only access their own decks
- Junction table RLS checks deck ownership (not flashcard ownership)
- Follows same pattern as `flashcards` table

**Why frontend-only?**
- Supabase client handles CRUD + RLS automatically
- No custom business logic required for basic deck management
- Reduced latency (no proxy through Flask backend)

## Key Implementation Details

### Database: Two Tables with RLS

New `decks` and `deck_flashcards` tables ([supabase/migrations/20251111215818_create_decks.sql](../supabase/migrations/20251111215818_create_decks.sql)):

**Decks table:**
```sql
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Junction table with position:**
```sql
create table public.deck_flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.decks(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  position integer default 0 not null,
  added_at timestamptz default now() not null,
  unique(deck_id, flashcard_id)
);
```

**Trigger for user_id auto-population:**
```sql
create or replace function public.handle_deck_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;
```

**RLS on junction table:** Checks deck ownership via subquery:
```sql
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
```

### Hook Pattern: `useDecks` + `useDeckFlashcards`

**useDecks** ([web/src/hooks/use-decks.ts](../web/src/hooks/use-decks.ts)):
- Follows `useFlashcards` pattern
- CRUD operations: `addDeck`, `updateDeck`, `deleteDeck`
- Pagination (20 items per page)
- Sorting by name or created_at

**useDeckFlashcards** ([web/src/hooks/use-deck-flashcards.ts](../web/src/hooks/use-deck-flashcards.ts)):
- Manages flashcards within a specific deck
- JOIN query to fetch flashcard details with position
- `addFlashcardToDeck(flashcardId)` - auto-increments position
- `removeFlashcardFromDeck(deckFlashcardId)` - removes junction entry
- `getAvailableFlashcards()` - returns flashcards NOT in current deck

**Key detail:** Position auto-increment:
```typescript
const { data: maxPositionData } = await supabase
  .from('deck_flashcards')
  .select('position')
  .eq('deck_id', deckId)
  .order('position', { ascending: false })
  .limit(1)

const maxPosition = maxPositionData?.[0]?.position ?? -1
const newPosition = maxPosition + 1
```

### UI: List + Detail Pages

**Decks List Page** ([web/src/pages/decks.tsx](../web/src/pages/decks.tsx)):
- Add form in header (name input + button)
- Table with sortable columns (Name, Created)
- Inline editing: double-click name to edit, blur/Enter to save
- Single-click name navigates to detail page
- Delete button per row
- Pagination controls

**Deck Detail Page** ([web/src/pages/deck-detail.tsx](../web/src/pages/deck-detail.tsx)):
- URL: `/decks/:id`
- Inline editable deck name at top (click to edit)
- Dropdown to add flashcards:
  - Search input filters by front text
  - Shows available flashcards (not already in deck)
  - Displays front text + language in dropdown
- Table showing flashcards in deck:
  - Columns: Front, Back, Language
  - Remove button (deletes junction entry, not flashcard)
- Back button to return to decks list

**Search + Filter in Dropdown:**
```typescript
const filteredFlashcards = availableFlashcards.filter((fc) =>
  fc.front.toLowerCase().includes(searchQuery.toLowerCase())
)
```

## Files Created/Modified

**Created:**
1. [supabase/migrations/20251111215818_create_decks.sql](../supabase/migrations/20251111215818_create_decks.sql) - Tables + RLS + trigger
2. [web/src/hooks/use-decks.ts](../web/src/hooks/use-decks.ts) - Deck CRUD hook
3. [web/src/hooks/use-deck-flashcards.ts](../web/src/hooks/use-deck-flashcards.ts) - Deck-flashcard management hook
4. [web/src/pages/decks.tsx](../web/src/pages/decks.tsx) - List page with inline editing
5. [web/src/pages/deck-detail.tsx](../web/src/pages/deck-detail.tsx) - Detail page with flashcard management

**Modified:**
6. [web/src/lib/database.types.ts](../web/src/lib/database.types.ts) - Added `decks` and `deck_flashcards` types
7. [web/src/App.tsx](../web/src/App.tsx) - Added `/decks` and `/decks/:id` routes
8. [web/src/components/app-sidebar.tsx](../web/src/components/app-sidebar.tsx) - Added Decks nav item

## Validation & Constraints

**Current:**
- Empty/whitespace-only deck name rejected (frontend only)
- Unique constraint prevents duplicate flashcard in same deck
- Cascade delete: Deleting deck removes all junction entries
- Cascade delete: Deleting flashcard removes from all decks
- No deck name length limit
- No limit on flashcards per deck

**Intentional simplicity:** Users organize as they see fit.

## User Experience Flow

1. **Create Deck:** Type name → Click "Add Deck" → Appears in list
2. **Edit Deck Name:**
   - List page: Double-click name → Edit inline → Blur/Enter to save
   - Detail page: Click name at top → Edit inline → Blur/Enter to save
3. **Open Deck:** Click deck name in list → Navigate to detail page
4. **Add Flashcards:**
   - Select from dropdown (search by front text)
   - Click "Add Flashcard" button
   - Flashcard appears in table
5. **Remove Flashcards:** Click trash icon → Removes from deck (flashcard still exists)
6. **Delete Deck:** Click trash icon in list → Deletes deck and all associations

## Future Enhancements

- Drag-and-drop reordering of flashcards in deck
- Deck descriptions/notes field
- Deck sharing between users
- Practice mode per deck with progress tracking
- Export deck as CSV or PDF
- Deck statistics (flashcard count, last studied, etc.)
- Bulk add flashcards to deck
- Nested decks (sub-decks)
- Deck templates for common use cases
