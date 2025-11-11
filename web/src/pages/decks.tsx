import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDecks } from '@/hooks/use-decks'
import type { SortColumn } from '@/hooks/use-decks'
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
import { toast } from 'sonner'

export default function DecksPage() {
  const navigate = useNavigate()
  const {
    decks,
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
    addDeck,
    updateDeck,
    deleteDeck,
  } = useDecks()

  const [newDeckName, setNewDeckName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleAddDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeckName.trim()) return

    try {
      await addDeck(newDeckName.trim())
      toast.success('Deck added successfully!')
      setNewDeckName('')
    } catch (error) {
      console.error('Failed to add deck:', error)
      toast.error('Failed to add deck. Please try again.')
    }
  }

  const handleDeleteDeck = async (id: string) => {
    try {
      await deleteDeck(id)
      toast.success('Deck deleted successfully!')
    } catch (error) {
      console.error('Failed to delete deck:', error)
      toast.error('Failed to delete deck. Please try again.')
    }
  }

  const startEditing = (id: string, currentValue: string) => {
    setEditingId(id)
    setEditValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) {
      cancelEditing()
      return
    }

    try {
      await updateDeck(id, { name: editValue.trim() })
      cancelEditing()
      toast.success('Deck name updated successfully!')
    } catch (error) {
      console.error('Failed to update deck:', error)
      toast.error('Failed to update deck. Please try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const handleDeckClick = (deckId: string) => {
    if (!editingId) {
      navigate(`/decks/${deckId}`)
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
          <CardTitle>Decks</CardTitle>
          <CardDescription>
            Organize your flashcards into decks (showing {decks.length} of {totalCount} decks)
          </CardDescription>

          {/* Add Deck Form */}
          <form onSubmit={handleAddDeck} className="flex gap-2 pt-4">
            <Input
              type="text"
              placeholder="Deck name..."
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Button type="submit" disabled={mutating || !newDeckName.trim()}>
              {mutating ? 'Adding...' : 'Add Deck'}
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading decks...</p>
            </div>
          ) : decks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No decks found. Add your first one above!</p>
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
                          onClick={() => setSort('name')}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Name
                          {getSortIcon('name')}
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
                      <TableHead className="text-center w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decks.map((deck) => (
                      <TableRow key={deck.id}>
                        <TableCell>
                          {editingId === deck.id ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(deck.id)}
                              onKeyDown={(e) => handleKeyDown(e, deck.id)}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <div
                              className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                              onClick={() => handleDeckClick(deck.id)}
                              onDoubleClick={() => startEditing(deck.id, deck.name)}
                            >
                              {deck.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(deck.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDeck(deck.id)}
                            disabled={mutating}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
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
