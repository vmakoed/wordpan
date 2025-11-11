# Flashcard Translation Feature

## Overview

AI-powered translation for flashcards with per-card language selection. Users can create flashcards with English front side only, then use AI to generate translations on demand. Translations always overwrite existing back side without confirmation.

## User Flow

1. User selects target language from dropdown (Spanish, French, German, Dutch, etc.)
2. User adds flashcard with front side (English) - back side is optional
3. **Auto-translation**: If back side is empty, translation happens automatically on add
4. Toast notifications show "Flashcard added! Translating..." then "Translation complete!"
5. Alternatively, user can manually translate any card by clicking translate button (Languages icon)
6. Translation always overwrites existing back side without confirmation
7. Button shows spinner during translation, toast notification on success/error

## Architecture Decision: Per-Card Language

**Why language per flashcard instead of user profile?**
- Flexibility: Users can mix languages in one session
- Simplicity: No need to switch global settings
- Direct feedback: Language is visible in the table
- Future-proof: Enables multi-language study sets

**Why allow translation overwrite?**
- Quick iteration: Users can re-translate if unsatisfied
- Simplicity: No confirmation dialog interrupts flow
- Edit available: Users can manually edit if needed

**Why optional back side with auto-translation?**
- Instant workflow: Add card with front only, translation happens automatically
- Batch efficiency: Add multiple cards quickly, each auto-translates as added
- Manual override: Users can pre-fill back side to skip auto-translation
- Re-translation available: Users can manually re-translate anytime via button

## Key Implementation Details

### Database: Nullable Back + Language Field

Migration [supabase/migrations/20251111212757_add_flashcard_language_and_optional_back.sql](../supabase/migrations/20251111212757_add_flashcard_language_and_optional_back.sql):

```sql
-- Make back field optional (nullable)
alter table public.flashcards
  alter column back drop not null;

-- Add language field for translation target
alter table public.flashcards
  add column language varchar(10) not null default 'es';
```

**Non-trivial detail:** Language code stored as VARCHAR(10) instead of ENUM for flexibility. Common codes: `es` (Spanish), `fr` (French), `de` (German), `it` (Italian), `pt` (Portuguese), `ru` (Russian), `ja` (Japanese), `ko` (Korean), `zh` (Chinese), `ar` (Arabic).

### AI Backend: Translation Crew

New CrewAI crew for translation ([ai/src/crews/translate_flashcard/](../ai/src/crews/translate_flashcard/)):

**Agent:** Single translator agent
- Role: "Flashcard Translator"
- Goal: "Translate English text to target language accurately and concisely"
- Model: `groq/llama-3.3-70b-versatile` (same as phrase generation)
- Backstory: Expert in language learning materials, provides natural, practical translations

**Task:** Simple translation
- Input: `{text}` (front side), `{language}` (target language code)
- Output: Translated text only (no JSON, no wrapping)
- Expected output: Natural, concise translation appropriate for flashcard learning

**Crew:** Sequential process with single agent/task

### Backend Endpoint: `/api/translate-flashcard`

Added to [ai/run.py](../ai/run.py:156-198):

```python
@app.route("/api/translate-flashcard", methods=["POST"])
@require_auth
async def translate_flashcard_endpoint():
    """
    Request body: { "text": "English text", "language": "es" }
    Response: { "translation": "translated text" }
    """
```

**Pattern:** Follows same auth + tracing pattern as `/api/random-phrase`:
- `@require_auth` decorator validates JWT with Supabase
- `@traceable` decorator sends traces to Phoenix for observability
- Async/await for non-blocking I/O

**Note:** No user context needed for translation (unlike phrase generation which uses profile data)

### Frontend: AI Service Helper

Added to [web/src/lib/ai-service.ts](../web/src/lib/ai-service.ts:44-73):

```typescript
export async function translateFlashcard(
  text: string,
  language: string
): Promise<TranslationResponse>
```

**Pattern:** Same as `generateRandomPhrase`:
- Fetch JWT token from Supabase session
- POST to AI backend with `Authorization: Bearer <token>`
- Return typed response (`TranslationResponse`)

### Hook: `useFlashcards` Extensions

Updated [web/src/hooks/use-flashcards.ts](../web/src/hooks/use-flashcards.ts):

**Changed:**
- `addFlashcard()` signature: Added `language: string` parameter, `back` now `string | null`
- Database insert: `insert({ front, back, language })`

**Added:**
- `translateFlashcardAI(flashcard: Flashcard)`: Calls AI service, updates flashcard with translation
- Returns translated text (though caller typically ignores since DB is updated)

### UI: Language Dropdown + Translate Button

Enhanced [web/src/pages/flashcards.tsx](../web/src/pages/flashcards.tsx):

**Add Form Changes:**
- Added language dropdown (Select component) with 11 languages including Dutch
- Updated placeholders: "Front side (English)...", "Back side (optional)..."
- Removed `!newBack.trim()` validation (back now optional)
- Button enabled when `newFront.trim()` only
- **Auto-translation logic**: If back is empty on submit, automatically translates after adding card

**Table Changes:**
- Added "Language" column showing human-readable name (e.g., "Spanish")
- Changed last column to "Actions" (was empty header)
- Added translate button (Languages icon) next to delete button
- Translate button shows spinner (`Loader2` icon) during translation
- Empty back side displays as "—" (em dash) in italic gray

**State Management:**
- `translatingId: string | null` tracks which card is being translated
- Translate button disabled while `translatingId === flashcard.id` or `mutating`
- Toast notifications for success/error
- **Auto-translation flow**: After adding card with empty back, uses 500ms timeout to fetch newly created card and translate it

**Inline Editing:**
- Updated `startEditing()` to accept `string | null` for back field
- Updated `saveEdit()` to allow empty back field (only front is required)
- Empty back saved as `null` in database

## Files Modified

1. [supabase/migrations/20251111212757_add_flashcard_language_and_optional_back.sql](../supabase/migrations/20251111212757_add_flashcard_language_and_optional_back.sql) - Nullable back + language field
2. [web/src/lib/database.types.ts](../web/src/lib/database.types.ts) - Updated `flashcards` types
3. [ai/src/crews/translate_flashcard/config/agents.yaml](../ai/src/crews/translate_flashcard/config/agents.yaml) - Translator agent config
4. [ai/src/crews/translate_flashcard/config/tasks.yaml](../ai/src/crews/translate_flashcard/config/tasks.yaml) - Translation task config
5. [ai/src/crews/translate_flashcard/crew.py](../ai/src/crews/translate_flashcard/crew.py) - Crew implementation
6. [ai/src/crews/translate_flashcard/schemas.py](../ai/src/crews/translate_flashcard/schemas.py) - Pydantic output schema
7. [ai/src/crews/translate_flashcard/__init__.py](../ai/src/crews/translate_flashcard/__init__.py) - Module exports
8. [ai/run.py](../ai/run.py) - Added `/api/translate-flashcard` endpoint
9. [web/src/lib/ai-service.ts](../web/src/lib/ai-service.ts) - Added `translateFlashcard()` function
10. [web/src/hooks/use-flashcards.ts](../web/src/hooks/use-flashcards.ts) - Added `translateFlashcardAI()` function
11. [web/src/pages/flashcards.tsx](../web/src/pages/flashcards.tsx) - Language dropdown + translate button + auto-translation
12. [web/src/App.tsx](../web/src/App.tsx) - Added Toaster component for toast notifications
13. [web/src/components/ui/sonner.tsx](../web/src/components/ui/sonner.tsx) - Fixed Toaster component types

## Validation & Constraints

**Current:**
- Front side required (non-empty after trim)
- Back side optional (can be empty/null)
- **Auto-translation triggers** when back is empty on card creation
- Language required (defaults to 'es', selected from dropdown)
- Translation overwrites existing back without confirmation
- Language cannot be changed after card creation (edit not implemented)
- If back is pre-filled, auto-translation is skipped

**Intentional simplicity:** No language auto-detection, no translation history, no undo.

## Error Handling

**Frontend:**
- Toast notification on translation error with error message
- Translate button shows spinner during operation
- Button disabled during translation (per-card locking)

**Backend:**
- Standard error response: `{ "error": "message" }`
- HTTP 400 for missing/empty parameters
- HTTP 401 for auth failures
- HTTP 500 for unexpected errors

## Observability

All translation operations traced via OpenTelemetry to Arize Phoenix:
- `@traceable` decorator on `translate_flashcard()` function
- Traces include: LLM model, input text, output translation, latency, token usage
- View traces at http://localhost:6006

## Future Enhancements

- Language edit: Allow changing target language after card creation
- Bulk translate: Button to translate all cards with empty back
- Translation history: Store previous translations for comparison
- Auto-translate on add: Option to translate immediately when adding card
- Custom prompts: Allow users to customize translation style (formal/informal, etc.)
- Multi-language support: Add more languages beyond the current 10
- Translation quality feedback: Thumbs up/down for training data
- Alternative translations: Show multiple translation options to choose from
