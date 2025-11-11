import { useState } from 'react'
import { useFlashcards } from '@/hooks/use-flashcards'
import type { SortColumn } from '@/hooks/use-flashcards'
import { supabase } from '@/lib/supabase'
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
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown, Languages, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

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

export default function FlashcardsPage() {
  const {
    flashcards,
    loading,
    mutating,
    currentPage,
    totalPages,
    totalCount,
    sortColumn,
    sortDirection,
    goToNextPage,
    goToPreviousPage,
    setSort,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    translateFlashcardAI,
  } = useFlashcards()

  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newLanguage, setNewLanguage] = useState('es')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'front' | 'back' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [translatingId, setTranslatingId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFront.trim()) return

    try {
      // Add the flashcard first
      await addFlashcard(
        newFront.trim(),
        newBack.trim() || null,
        newLanguage
      )

      // If back is empty, auto-translate
      if (!newBack.trim()) {
        toast.success('Flashcard added! Translating...')

        // Get the most recently added flashcard and translate it
        setTimeout(async () => {
          try {
            const { data } = await supabase
              .from('flashcards')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            if (data) {
              await translateFlashcardAI(data)
              toast.success('Translation complete!')
            }
          } catch (error) {
            console.error('Auto-translation failed:', error)
            toast.error('Translation failed. You can manually translate using the button.')
          }
        }, 500)
      } else {
        toast.success('Flashcard added successfully!')
      }

      setNewFront('')
      setNewBack('')
    } catch (error) {
      console.error('Failed to add flashcard:', error)
      toast.error('Failed to add flashcard. Please try again.')
    }
  }

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await deleteFlashcard(id)
    } catch (error) {
      console.error('Failed to delete flashcard:', error)
      toast.error('Failed to delete flashcard. Please try again.')
    }
  }

  const handleTranslateFlashcard = async (flashcard: typeof flashcards[0]) => {
    try {
      setTranslatingId(flashcard.id)
      await translateFlashcardAI(flashcard)
      toast.success('Flashcard translated successfully!')
    } catch (error) {
      console.error('Failed to translate flashcard:', error)
      const message = error instanceof Error ? error.message : 'Failed to translate flashcard. Please try again.'
      toast.error(message)
    } finally {
      setTranslatingId(null)
    }
  }

  const startEditing = (id: string, field: 'front' | 'back', currentValue: string | null) => {
    setEditingId(id)
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const getLanguageName = (code: string) => {
    return LANGUAGE_OPTIONS.find((lang) => lang.value === code)?.label || code
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingField(null)
    setEditValue('')
  }

  const saveEdit = async (id: string, field: 'front' | 'back') => {
    // Front field is required, back field can be empty
    if (field === 'front' && !editValue.trim()) {
      cancelEditing()
      return
    }

    try {
      await updateFlashcard(id, { [field]: editValue.trim() || null })
      cancelEditing()
    } catch (error) {
      console.error('Failed to update flashcard:', error)
      toast.error('Failed to update flashcard. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: 'front' | 'back') => {
    if (e.key === 'Enter') {
      saveEdit(id, field)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
          <CardDescription>
            Manage your flashcards (showing {flashcards.length} of {totalCount} flashcards)
          </CardDescription>

          {/* Add Flashcard Form */}
          <form onSubmit={handleAddFlashcard} className="flex gap-2 pt-4">
            <Input
              type="text"
              placeholder="Front side (English)..."
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Back side (optional)..."
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Select value={newLanguage} onValueChange={setNewLanguage} disabled={mutating}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={mutating || !newFront.trim()}>
              {mutating ? 'Adding...' : 'Add Flashcard'}
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading flashcards...</p>
            </div>
          ) : flashcards.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No flashcards found. Add your first one above!</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => setSort('front')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Front
                          {getSortIcon('front')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => setSort('back')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Back
                          {getSortIcon('back')}
                        </Button>
                      </TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => setSort('created_at')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Created
                          {getSortIcon('created_at')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-center w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flashcards.map((flashcard) => (
                      <TableRow key={flashcard.id}>
                        <TableCell>
                          {editingId === flashcard.id && editingField === 'front' ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(flashcard.id, 'front')}
                              onKeyDown={(e) => handleKeyDown(e, flashcard.id, 'front')}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                              onClick={() => startEditing(flashcard.id, 'front', flashcard.front)}
                            >
                              {flashcard.front}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === flashcard.id && editingField === 'back' ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(flashcard.id, 'back')}
                              onKeyDown={(e) => handleKeyDown(e, flashcard.id, 'back')}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                              onClick={() => startEditing(flashcard.id, 'back', flashcard.back)}
                            >
                              {flashcard.back || <span className="text-muted-foreground italic">—</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getLanguageName(flashcard.language)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(flashcard.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTranslateFlashcard(flashcard)}
                              disabled={mutating || translatingId === flashcard.id}
                              className="h-8 w-8"
                              title="Translate with AI"
                            >
                              {translatingId === flashcard.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Languages className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFlashcard(flashcard.id)}
                              disabled={mutating}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
