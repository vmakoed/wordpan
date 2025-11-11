import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { FlipVertical, CheckCircle2, XCircle } from 'lucide-react'
import type { FlashcardWithDetails } from '@/hooks/use-deck-flashcards'

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
}

interface LearningDialogProps {
  isOpen: boolean
  onClose: () => void
  flashcards: FlashcardWithDetails[]
  deckName: string
}

type Answer = 'correct' | 'incorrect'

export function LearningDialog({
  isOpen,
  onClose,
  flashcards,
  deckName,
}: LearningDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map())
  const [showResults, setShowResults] = useState(false)

  const currentCard = flashcards[currentIndex]
  const totalCards = flashcards.length
  const isLastCard = currentIndex === totalCards - 1

  const handleFlip = () => {
    setIsFlipped(true)
  }

  const handleAnswer = (answer: Answer) => {
    if (!currentCard) return

    // Record the answer
    const newAnswers = new Map(answers)
    newAnswers.set(currentCard.id, answer)
    setAnswers(newAnswers)

    // Move to next card or show results
    if (isLastCard) {
      setShowResults(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setAnswers(new Map())
    setShowResults(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const correctCards = flashcards.filter((card) => answers.get(card.id) === 'correct')
  const incorrectCards = flashcards.filter((card) => answers.get(card.id) === 'incorrect')

  if (totalCards === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deckName}</DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="text-sm text-muted-foreground text-center">
              Card {currentIndex + 1} of {totalCards}
            </div>

            {/* Card display */}
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="min-h-[200px] flex flex-col items-center justify-center gap-6">
                  {!isFlipped ? (
                    <>
                      {/* Front side */}
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">
                          {LANGUAGE_NAMES[currentCard.language] || currentCard.language}
                        </p>
                        <p className="text-3xl font-semibold">{currentCard.front}</p>
                      </div>

                      {/* Flip button */}
                      <Button onClick={handleFlip} size="lg" className="gap-2">
                        <FlipVertical className="size-4" />
                        Flip Card
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Back side */}
                      <div className="text-center space-y-2 w-full">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">
                          Translation
                        </p>
                        <p className="text-3xl font-semibold">
                          {currentCard.back || '—'}
                        </p>
                      </div>

                      {/* Answer selection */}
                      <div className="w-full max-w-md space-y-4">
                        <p className="text-sm font-medium text-center">
                          Did you remember it correctly?
                        </p>
                        <RadioGroup
                          onValueChange={(value) => handleAnswer(value as Answer)}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <Label
                              htmlFor="correct"
                              className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-primary transition-all [&:has([data-state=checked])]:border-green-500 [&:has([data-state=checked])]:bg-green-50 dark:[&:has([data-state=checked])]:bg-green-950"
                            >
                              <RadioGroupItem value="correct" id="correct" />
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                                <span className="font-medium">Correct</span>
                              </div>
                            </Label>
                          </div>
                          <div>
                            <Label
                              htmlFor="incorrect"
                              className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-primary transition-all [&:has([data-state=checked])]:border-red-500 [&:has([data-state=checked])]:bg-red-50 dark:[&:has([data-state=checked])]:bg-red-950"
                            >
                              <RadioGroupItem value="incorrect" id="incorrect" />
                              <div className="flex items-center gap-2">
                                <XCircle className="size-5 text-red-600 dark:text-red-400" />
                                <span className="font-medium">Incorrect</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results view */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Session Complete!</h3>
              <p className="text-muted-foreground">
                You reviewed {totalCards} {totalCards === 1 ? 'card' : 'cards'}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Correct cards */}
              <Card className="border-green-200 dark:border-green-900">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-lg">
                      Correct ({correctCards.length})
                    </h4>
                  </div>
                  {correctCards.length > 0 ? (
                    <ul className="space-y-2">
                      {correctCards.map((card) => (
                        <li
                          key={card.id}
                          className="text-sm p-2 rounded bg-green-50 dark:bg-green-950/50"
                        >
                          <span className="font-medium">{card.front}</span>
                          {card.back && (
                            <span className="text-muted-foreground"> • {card.back}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No cards marked as correct</p>
                  )}
                </CardContent>
              </Card>

              {/* Incorrect cards */}
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-5 text-red-600 dark:text-red-400" />
                    <h4 className="font-semibold text-lg">
                      Incorrect ({incorrectCards.length})
                    </h4>
                  </div>
                  {incorrectCards.length > 0 ? (
                    <ul className="space-y-2">
                      {incorrectCards.map((card) => (
                        <li
                          key={card.id}
                          className="text-sm p-2 rounded bg-red-50 dark:bg-red-950/50"
                        >
                          <span className="font-medium">{card.front}</span>
                          {card.back && (
                            <span className="text-muted-foreground"> • {card.back}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No cards marked as incorrect</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              <Button onClick={handleReset} variant="outline">
                Study Again
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
