import { useState } from 'react'
import { useFlashcards } from '@/hooks/use-flashcards'
import type { SortColumn } from '@/hooks/use-flashcards'
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
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

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
  } = useFlashcards()

  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'front' | 'back' | null>(null)
  const [editValue, setEditValue] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFront.trim() || !newBack.trim()) return

    try {
      await addFlashcard(newFront.trim(), newBack.trim())
      setNewFront('')
      setNewBack('')
    } catch (error) {
      console.error('Failed to add flashcard:', error)
    }
  }

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await deleteFlashcard(id)
    } catch (error) {
      console.error('Failed to delete flashcard:', error)
    }
  }

  const startEditing = (id: string, field: 'front' | 'back', currentValue: string) => {
    setEditingId(id)
    setEditingField(field)
    setEditValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingField(null)
    setEditValue('')
  }

  const saveEdit = async (id: string, field: 'front' | 'back') => {
    if (!editValue.trim()) {
      cancelEditing()
      return
    }

    try {
      await updateFlashcard(id, { [field]: editValue.trim() })
      cancelEditing()
    } catch (error) {
      console.error('Failed to update flashcard:', error)
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
              placeholder="Front side..."
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Back side..."
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Button type="submit" disabled={mutating || !newFront.trim() || !newBack.trim()}>
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
                      <TableHead className="w-[80px]"></TableHead>
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
                              {flashcard.back}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(flashcard.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFlashcard(flashcard.id)}
                            disabled={mutating}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
