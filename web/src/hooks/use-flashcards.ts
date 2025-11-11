import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Flashcard = Database['public']['Tables']['flashcards']['Row']
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert']
type FlashcardUpdate = Database['public']['Tables']['flashcards']['Update']

export type SortColumn = 'created_at' | 'front' | 'back'
export type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 20

export function useFlashcards() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [mutating, setMutating] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    fetchFlashcards()
  }, [currentPage, sortColumn, sortDirection])

  const fetchFlashcards = async () => {
    try {
      setLoading(true)

      // Get total count
      const { count } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range(from, to)

      if (error) {
        console.error('Error fetching flashcards:', error)
        return
      }

      setFlashcards(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const setSort = (column: SortColumn) => {
    if (column === sortColumn) {
      // Toggle direction if clicking same column
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // Set new column with appropriate default direction
      setSortColumn(column)
      setSortDirection(column === 'created_at' ? 'desc' : 'asc')
    }
    // Reset to first page when sorting changes
    setCurrentPage(1)
  }

  const refresh = () => {
    fetchFlashcards()
  }

  const addFlashcard = async (front: string, back: string) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('flashcards')
        .insert({ front, back })

      if (error) {
        console.error('Error adding flashcard:', error)
        throw error
      }

      await fetchFlashcards()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const updateFlashcard = async (id: string, updates: FlashcardUpdate) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('flashcards')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating flashcard:', error)
        throw error
      }

      await fetchFlashcards()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const deleteFlashcard = async (id: string) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting flashcard:', error)
        throw error
      }

      await fetchFlashcards()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  return {
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
    goToPage,
    setSort,
    refresh,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
  }
}
