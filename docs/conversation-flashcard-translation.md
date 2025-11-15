# Conversation: AI Flashcard Translation Feature

## Date
2025-11-15

## Summary
Implementation of AI-powered flashcard translation with automatic translation on card creation.

---

## Todo Plan

1. ✅ Checkout new branch mvp/flashcard-translation
2. ✅ Create database migration for nullable back and language field
3. ✅ Update TypeScript database types
4. ✅ Create translation crew (agents.yaml, tasks.yaml, crew.py)
5. ✅ Add backend /api/translate-flashcard endpoint
6. ✅ Update AI service helper for translation
7. ✅ Update flashcard hook with translate function
8. ✅ Update flashcard component UI (language dropdown, translate button)
9. ✅ Create documentation file
10. ✅ Test end-to-end translation flow

---

## Conversation

### User
> As a user, I want to use AI translations for my flashcards. First of all, the backside field can be optional, so I should be able to create a card with front side only. Secondly, in the table, next to the delete button, I want to see another button. When I press this button, the translation for the back side of the flashcard is generated.

### Assistant
I'll analyze the codebase to understand the current flashcard implementation and plan the necessary changes for AI-powered translations.

*[Explored flashcard implementation]*

Based on my exploration, I have a good understanding of the current implementation. Let me ask a few clarifying questions before presenting the final plan:

1. **Translation Direction & Language**: Should the translation be:
   - Always from the front side to the back side (e.g., English word → Spanish translation)?
   - Configurable per card or user preference?
   - Should the system auto-detect the source language or use a user profile setting?

2. **Translation Button Behavior**:
   - Should the translate button appear **only when back is empty**, or **always** (allowing re-translation/overwriting)?
   - If a back side already exists, should translation overwrite it or should there be a confirmation?

3. **User Context for Translation**:
   - Should translations use the existing user profile data (native language, target language, proficiency level) from the `profiles` table?
   - Or should translation be more generic without user context?

4. **AI Model Choice**:
   - Should we use the same model as the phrase generation (Groq/Llama 3.3 70B)?
   - Or would a different model be better for translations?

5. **Translation Crew Design**:
   - Simple one-agent translation task?
   - Or more complex (e.g., translator + reviewer for quality)?

6. **Loading/Error States**:
   - While translation is in progress, should the translate button show a spinner and be disabled?
   - How should translation errors be displayed (toast notification, inline error)?

### User
> Let's have... Okay, first of all, we always translate from front side to back side, so front side will be in English. Secondly, let's allow to generate, to set a language per flashcard. So when I add a flashcard next to front and back side, allow me to specify a language in a drop-down. And the flow would be I select a language from the drop-down, then I add several flashcards in a row just by setting front side and leaving back side blank. And then in the table, I can press the button to AI translate. For the button behavior, it should always be there, and if back side exists, when I press it, then you just overwrite the translation, no confirmation. I don't think that we need anything from the profiles data. Yeah, I don't think so. Yes, use the same model as for the phrase generation. And let's keep it simple, just one agent translation task. And indeed, show spinner and disable the translation button. If there is an error, show a toast notification. Don't forget to check out to a new branch with an MVP prefix, you can check existing branches for reference. Also create a documentation file, you can use the existing documentation files for reference to get the idea about the amount of detail expected and the structure.

### Assistant
Perfect! Thank you for the detailed clarification. Let me create a comprehensive plan based on your requirements.

## Plan: AI Flashcard Translation Feature

### Overview
Add AI-powered translation to flashcards with per-card language selection, allowing users to create cards with front side only and translate on demand.

### Changes Required

#### 1. Database Migration
- Make `back` field nullable
- Add `language` field (e.g., `language VARCHAR(10)`, storing ISO codes like 'es', 'fr', 'de')
- Add default value for `language` (e.g., 'es' for Spanish)

#### 2. TypeScript Types Update
- Update `flashcards.Row`: `back: string | null`, add `language: string`
- Update `flashcards.Insert`: `back?: string | null`, add `language?: string`
- Update `flashcards.Update`: `back?: string | null`, add `language?: string`

#### 3-7. Backend Implementation
- Create translation crew (agents.yaml, tasks.yaml, crew.py)
- Add `/api/translate-flashcard` endpoint
- Update AI service helper

#### 8. Frontend Updates
- Add language dropdown to the add form
- Remove validation requiring `back` field
- Add translate button column (between back and delete columns)
- Show spinner in translate button when translating
- Add toast for translation errors

#### 9-10. Documentation and Testing
- Create documentation file
- Test end-to-end flow

*[Implementation proceeded with all tasks completed]*

### User
> console error
> ```
> Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/sonner.js?v=b820d12f' does not provide an export named 'ToasterProps' (at sonner.tsx:2:29
> ```

### Assistant
I see the issue! The Sonner component is trying to import `ToasterProps` which doesn't exist in the sonner package. Let me fix this by using `ComponentProps<typeof Sonner>` instead.

*[Fixed the Toaster component types]*

### User
> Can we add Dutch to the list of languages?

### Assistant
Done! I've added Dutch (`nl`) to the language options list. It's now positioned between German and Italian in the dropdown. 🇳🇱

### User
> When a user adds a flashcard with an empty front side, automatically translate the back side.

### Assistant
I understand! You want to reverse the flow - when the user adds a flashcard with an empty front side but has a back side filled in, automatically translate the back side to English and put it in the front.

### User
> No, I mean when a user adds a card with an empty backside that is optional, then automatically translate it at the point when I add the flashcard.

### Assistant
Ah, I understand now! When a user adds a flashcard with only the front side filled (and back side empty), automatically translate it right away.

*[Implemented auto-translation on add]*

Now the feature works as follows:

1. **User adds flashcard with front side only** (back side empty)
2. **Flashcard is created immediately** in the database
3. **Auto-translation triggers** - fetches the just-created flashcard and translates it
4. **Toast notifications** show "Flashcard added! Translating..." then "Translation complete!"
5. **User can manually translate** using the Languages button if auto-translation fails or if they want to re-translate

The implementation uses a 500ms timeout to ensure the database has time to update before fetching the newly created flashcard for translation.
