import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useDeckFlashcards } from '@/hooks/use-deck-flashcards'
import type { Database } from '@/lib/database.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Deck = Database['public']['Tables']['decks']['Row']
type Flashcard = Database['public']['Tables']['flashcards']['Row']

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'nl', label: 'Dutch' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
]

export default function DeckDetailPage() {
  const { id: deckId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [loadingDeck, setLoadingDeck] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [updatingName, setUpdatingName] = useState(false)

  const [availableFlashcards, setAvailableFlashcards] = useState<Flashcard[]>([])
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    flashcards,
    loading: loadingFlashcards,
    mutating,
    addFlashcardToDeck,
    removeFlashcardFromDeck,
    getAvailableFlashcards,
  } = useDeckFlashcards(deckId)

  useEffect(() => {
    if (deckId) {
      fetchDeck()
      loadAvailableFlashcards()
    }
  }, [deckId])

  const fetchDeck = async () => {
    if (!deckId) return

    try {
      setLoadingDeck(true)
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single()

      if (error) {
        console.error('Error fetching deck:', error)
        toast.error('Failed to load deck')
        navigate('/decks')
        return
      }

      setDeck(data)
      setEditValue(data.name)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load deck')
      navigate('/decks')
    } finally {
      setLoadingDeck(false)
    }
  }

  const loadAvailableFlashcards = async () => {
    const available = await getAvailableFlashcards()
    setAvailableFlashcards(available)
  }

  const handleUpdateDeckName = async () => {
    if (!deckId || !editValue.trim() || !deck) return

    try {
      setUpdatingName(true)
      const { error } = await supabase
        .from('decks')
        .update({
          name: editValue.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', deckId)

      if (error) {
        console.error('Error updating deck name:', error)
        toast.error('Failed to update deck name')
        return
      }

      setDeck({ ...deck, name: editValue.trim() })
      setEditingName(false)
      toast.success('Deck name updated successfully!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update deck name')
    } finally {
      setUpdatingName(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateDeckName()
    } else if (e.key === 'Escape') {
      setEditingName(false)
      setEditValue(deck?.name || '')
    }
  }

  const handleAddFlashcard = async () => {
    if (!selectedFlashcardId) return

    try {
      await addFlashcardToDeck(selectedFlashcardId)
      toast.success('Flashcard added to deck!')
      setSelectedFlashcardId('')
      setSearchQuery('')
      await loadAvailableFlashcards()
    } catch (error) {
      console.error('Failed to add flashcard:', error)
      toast.error('Failed to add flashcard. It may already be in this deck.')
    }
  }

  const handleRemoveFlashcard = async (deckFlashcardId: string) => {
    try {
      await removeFlashcardFromDeck(deckFlashcardId)
      toast.success('Flashcard removed from deck!')
      await loadAvailableFlashcards()
    } catch (error) {
      console.error('Failed to remove flashcard:', error)
      toast.error('Failed to remove flashcard. Please try again.')
    }
  }

  const getLanguageName = (code: string) => {
    return LANGUAGE_OPTIONS.find((lang) => lang.value === code)?.label || code
  }

  const filteredFlashcards = availableFlashcards.filter((fc) =>
    fc.front.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loadingDeck) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading deck...</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/decks')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {editingName ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleUpdateDeckName}
                onKeyDown={handleKeyDown}
                disabled={updatingName}
                autoFocus
                className="text-2xl font-bold h-10"
              />
            ) : (
              <CardTitle
                className="cursor-pointer hover:bg-muted rounded px-2 py-1"
                onClick={() => setEditingName(true)}
              >
                {deck.name}
              </CardTitle>
            )}
          </div>
          <CardDescription>
            Manage flashcards in this deck ({flashcards.length} flashcards)
          </CardDescription>

          {/* Add Flashcard to Deck */}
          <div className="flex gap-2 pt-4">
            <div className="flex-1">
              <Select
                value={selectedFlashcardId}
                onValueChange={setSelectedFlashcardId}
                disabled={mutating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a flashcard to add..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      type="text"
                      placeholder="Search flashcards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredFlashcards.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {availableFlashcards.length === 0
                        ? 'All flashcards are already in this deck'
                        : 'No flashcards match your search'}
                    </div>
                  ) : (
                    filteredFlashcards.map((flashcard) => (
                      <SelectItem key={flashcard.id} value={flashcard.id}>
                        {flashcard.front} ({getLanguageName(flashcard.language)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddFlashcard}
              disabled={mutating || !selectedFlashcardId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingFlashcards ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading flashcards...</p>
            </div>
          ) : flashcards.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                No flashcards in this deck yet. Add some using the dropdown above!
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Front</TableHead>
                    <TableHead>Back</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashcards.map((flashcard) => (
                    <TableRow key={flashcard.deck_flashcard_id}>
                      <TableCell>{flashcard.front}</TableCell>
                      <TableCell>
                        {flashcard.back || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getLanguageName(flashcard.language)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFlashcard(flashcard.deck_flashcard_id)}
                          disabled={mutating}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Remove from deck"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
