# Word Management Feature

## Overview

Added basic CRUD operations for words: add, remove, and list with pagination on the `/words` page.

## Architecture Decision: Frontend-Only Implementation

**Why frontend-only?**
- Supabase client provides built-in CRUD operations
- No custom business logic required
- Reduced latency (no proxy through Flask backend)
- Consistent with Supabase best practices for simple CRUD

**Trade-off:** Backend would provide centralized validation and business logic, but not needed for this use case.

## Key Implementation Details

### Hook Pattern: `useWords`

Centralized all word operations in a custom hook ([web/src/hooks/use-words.ts](../web/src/hooks/use-words.ts)):

```typescript
export function useWords() {
  const [mutating, setMutating] = useState(false) // Locks UI during operations

  const addWord = async (word: string) => {
    setMutating(true)
    await supabase.from('words').insert({ word })
    await fetchWords() // Refresh after mutation
    setMutating(false)
  }

  const deleteWord = async (id: string) => {
    setMutating(true)
    await supabase.from('words').delete().eq('id', id)
    await fetchWords() // Refresh after mutation
    setMutating(false)
  }

  return { words, loading, mutating, addWord, deleteWord, /* ...pagination */ }
}
```

**Key patterns:**
- `mutating` state prevents concurrent operations and provides UI feedback
- Auto-refresh after mutations ensures consistency
- Error handling via try-catch with console logging

### UI Design

Enhanced existing [words.tsx](../web/src/pages/words.tsx) page:
- Add form in CardHeader (always visible above table)
- Delete button (trash icon) in each table row
- Direct deletion without confirmation (per requirements)
- All controls disabled during `mutating` state

## Data Model

Uses existing `words` table:
- **Global word pool** (shared across all users)
- No RLS policies applied
- No user ownership tracking

**Security note:** All authenticated users can add/delete any word. Future enhancement could add user-specific words with RLS policies.

## Files Modified

1. [web/src/hooks/use-words.ts](../web/src/hooks/use-words.ts) - Added `addWord()`, `deleteWord()`, `mutating` state
2. [web/src/pages/words.tsx](../web/src/pages/words.tsx) - Added form UI and delete buttons

No backend, database schema, or type definition changes required.

## Validation & Constraints

**Current:**
- Empty/whitespace-only input rejected (frontend only)
- No duplicate detection
- No length limits
- Accepts any text (Unicode, special characters, etc.)

**Intentional simplicity:** Per requirements, accepting any input without validation.

## Future Enhancements

- User-specific words with RLS policies
- Toast notifications for success/error feedback
- Duplicate detection
- Bulk import (CSV, multi-line input)
- Search/filter functionality
- Inline editing
