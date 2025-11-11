# Deck Learning Feature

## Overview

Interactive learning session for decks: users review flashcards one-by-one in a slideshow format, flip cards to see translations, mark their remembrance as correct/incorrect, and view session statistics. All state maintained in-memory (no database persistence).

## Architecture Decision: Dialog-Based Learning Session

**Why a dialog instead of a full page?**
- Learning session is a temporary activity, not a permanent view
- Dialog provides focus by dimming background and preventing navigation accidents
- Natural "close and return" UX pattern
- Maintains context of the deck page (user returns to same state)

**Why no database persistence?**
- Initial MVP focuses on immediate practice, not long-term progress tracking
- Simpler implementation without backend changes or migrations
- Faster iteration on UX patterns
- Future enhancement can add spaced repetition and progress tracking

**Why auto-advance on answer selection?**
- Reduces friction during learning sessions
- Encourages flow state (no manual navigation clicks)
- Mirrors physical flashcard study pattern (flip → judge → next)

**Why radio buttons for correct/incorrect?**
- Binary choice matches mental model of "Did I remember?"
- Simpler than multi-level difficulty ratings (e.g., 1-5 scale)
- Tactile interaction reinforces decision
- Visual state change (card highlights) provides immediate feedback

## Key Implementation Details

### UI Components: Radio Group + Dialog

**Radio Group Component** ([web/src/components/ui/radio-group.tsx](../web/src/components/ui/radio-group.tsx)):
- Wrapper around `@radix-ui/react-radio-group`
- Styled to match existing UI components (Button, Input, etc.)
- `RadioGroup` container with grid layout
- `RadioGroupItem` with Circle indicator

**Dialog Component** ([web/src/components/ui/dialog.tsx](../web/src/components/ui/dialog.tsx)):
- Wrapper around `@radix-ui/react-dialog`
- Full-screen overlay with centered content
- Escape key and close button to exit
- Follows existing Sheet component pattern

### Learning Dialog Component

**Component:** [web/src/components/learning-dialog.tsx](../web/src/components/learning-dialog.tsx)

**State Management:**
```typescript
const [currentIndex, setCurrentIndex] = useState(0)
const [isFlipped, setIsFlipped] = useState(false)
const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
const [showResults, setShowResults] = useState(false)
```

**Three Views:**

1. **Card Front View**
   - Language name (e.g., "SPANISH") in small uppercase text
   - Front text in large font (3xl)
   - "Flip Card" button with icon
   - Progress indicator: "Card 3 of 15"

2. **Card Back View** (after flip)
   - "Translation" label
   - Back text in large font
   - Radio group with two options:
     - ✓ Correct (green highlight when selected)
     - ✗ Incorrect (red highlight when selected)
   - Auto-advances on selection

3. **Statistics View** (after last card)
   - "Session Complete!" header
   - Two-column layout:
     - **Correct cards** (green border): List of flashcards marked correct
     - **Incorrect cards** (red border): List of flashcards marked incorrect
   - "Study Again" button (resets session)
   - "Close" button (exits dialog)

**Answer Flow Logic:**
```typescript
const handleAnswer = (answer: Answer) => {
  // Record answer in Map
  newAnswers.set(currentCard.id, answer)

  // Last card → Show results
  if (isLastCard) {
    setShowResults(true)
  } else {
    // Next card → Reset flip state
    setCurrentIndex(currentIndex + 1)
    setIsFlipped(false)
  }
}
```

**Reset Logic:**
```typescript
const handleReset = () => {
  setCurrentIndex(0)
  setIsFlipped(false)
  setAnswers(new Map())
  setShowResults(false)
}
```

**Statistics Calculation:**
```typescript
const correctCards = flashcards.filter((card) =>
  answers.get(card.id) === 'correct'
)
const incorrectCards = flashcards.filter((card) =>
  answers.get(card.id) === 'incorrect'
)
```

### Frontend Integration

**Deck Detail Page** ([web/src/pages/deck-detail.tsx](../web/src/pages/deck-detail.tsx)):

**Learn Button:**
- Positioned in header next to deck name (with `ml-auto` to right-align)
- Icon: `GraduationCap` from lucide-react
- Only visible when `flashcards.length > 0`
- Opens learning dialog on click

```typescript
{flashcards.length > 0 && (
  <Button
    onClick={() => setLearningDialogOpen(true)}
    className="ml-auto gap-2"
    size="sm"
  >
    <GraduationCap className="h-4 w-4" />
    Learn
  </Button>
)}
```

**Dialog Integration:**
```typescript
<LearningDialog
  isOpen={learningDialogOpen}
  onClose={() => setLearningDialogOpen(false)}
  flashcards={flashcards}
  deckName={deck.name}
/>
```

**Props Passed:**
- `flashcards`: Array of `FlashcardWithDetails` (from `useDeckFlashcards`)
- `deckName`: String for dialog title
- `isOpen`: Boolean state
- `onClose`: Callback to close dialog and reset state

### Language Display

**Language Name Mapping:**
```typescript
const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish', fr: 'French', de: 'German',
  nl: 'Dutch', it: 'Italian', pt: 'Portuguese',
  ru: 'Russian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', ar: 'Arabic',
}
```

Displayed in uppercase on card front for visual hierarchy.

## Files Created/Modified

**Created:**
1. [web/src/components/ui/radio-group.tsx](../web/src/components/ui/radio-group.tsx) - Radio button component wrapper
2. [web/src/components/ui/dialog.tsx](../web/src/components/ui/dialog.tsx) - Dialog component wrapper
3. [web/src/components/learning-dialog.tsx](../web/src/components/learning-dialog.tsx) - Learning session dialog
4. [docs/deck-learning.md](../docs/deck-learning.md) - This documentation

**Modified:**
5. [web/src/pages/deck-detail.tsx](../web/src/pages/deck-detail.tsx) - Added Learn button and dialog integration

## Validation & Constraints

**Current:**
- Empty decks (0 flashcards) hide Learn button
- No limit on session length (user can study all cards)
- Flashcards without back text show "—" placeholder
- All answers stored in Map (no validation required)
- Dialog closes on Escape key or close button
- Statistics show all cards (even if user exits mid-session, answers are preserved until close)

**Intentional simplicity:**
- No time tracking or speed metrics
- No shuffle/randomization (cards shown in deck order by position)
- No skip/previous navigation (encourages completing each card)
- No intermediate results (only at end)

## User Experience Flow

1. **Start Session:** Click "Learn" button on deck detail page → Dialog opens with first card
2. **Study Card Front:**
   - See language name and front text
   - See progress: "Card 3 of 15"
   - Click "Flip Card" button
3. **Judge Remembrance:**
   - See translation (back text)
   - Select "Correct" or "Incorrect" radio button
   - Card highlights green (correct) or red (incorrect)
   - Auto-advances to next card (unflipped)
4. **Repeat:** Steps 2-3 for each card
5. **View Results:**
   - After last card, see statistics screen
   - Review correct cards (green section)
   - Review incorrect cards (red section)
6. **Exit or Retry:**
   - Click "Study Again" → Reset session to first card
   - Click "Close" → Return to deck detail page

## Error Handling

**Edge Cases:**
- Empty deck: Learn button not rendered
- Missing back text: Shows "—" placeholder (non-breaking)
- Dialog close mid-session: State resets on next open (no persistence)
- Rapid clicks: Radio button onChange prevents double-selection

## Future Enhancements

- **Spaced Repetition:** Track review history, calculate next review date (SM-2 algorithm)
- **Progress Persistence:** Save answers to database with `deck_flashcard_reviews` table
- **Session Statistics:** Accuracy percentage, time per card, streak tracking
- **Card Shuffle:** Randomize order each session (with option to disable)
- **Navigation Controls:** Previous/Next buttons, skip card, restart mid-session
- **Difficulty Ratings:** Multi-level scale (Again, Hard, Good, Easy) for spaced repetition
- **Keyboard Shortcuts:** Space to flip, number keys for answers, arrow keys for navigation
- **Audio Pronunciation:** Play TTS audio for front/back text
- **Study Modes:** Multiple choice, typing practice, listening mode
- **Session History:** Calendar view of past sessions, progress graphs
- **Review Queue:** Only show cards due for review based on spaced repetition
- **Card Annotations:** Add notes or hints per card during study
- **Export Results:** Download session report as CSV or PDF
