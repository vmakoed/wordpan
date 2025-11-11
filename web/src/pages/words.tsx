import { useState } from 'react'
import { useWords } from '@/hooks/use-words'
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
import { Trash2 } from 'lucide-react'

export default function WordsPage() {
  const {
    words,
    loading,
    mutating,
    currentPage,
    totalPages,
    totalCount,
    goToNextPage,
    goToPreviousPage,
    addWord,
    deleteWord,
  } = useWords()

  const [newWord, setNewWord] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWord.trim()) return

    try {
      await addWord(newWord.trim())
      setNewWord('')
    } catch (error) {
      console.error('Failed to add word:', error)
    }
  }

  const handleDeleteWord = async (id: string) => {
    try {
      await deleteWord(id)
    } catch (error) {
      console.error('Failed to delete word:', error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Words</CardTitle>
          <CardDescription>
            All words from the database (showing {words.length} of {totalCount} words)
          </CardDescription>

          {/* Add Word Form */}
          <form onSubmit={handleAddWord} className="flex gap-2 pt-4">
            <Input
              type="text"
              placeholder="Enter a new word..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              disabled={mutating}
              className="flex-1"
            />
            <Button type="submit" disabled={mutating || !newWord.trim()}>
              {mutating ? 'Adding...' : 'Add Word'}
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading words...</p>
            </div>
          ) : words.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No words found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Word</TableHead>
                      <TableHead className="text-right">Created At</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {words.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-mono text-xs">
                          {word.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">{word.word}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(word.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWord(word.id)}
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
