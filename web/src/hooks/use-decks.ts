import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Deck = Database['public']['Tables']['decks']['Row']
type DeckInsert = Database['public']['Tables']['decks']['Insert']
type DeckUpdate = Database['public']['Tables']['decks']['Update']

export type SortColumn = 'created_at' | 'name'
export type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 20

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [mutating, setMutating] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    fetchDecks()
  }, [currentPage, sortColumn, sortDirection])

  const fetchDecks = async () => {
    try {
      setLoading(true)

      // Get total count
      const { count } = await supabase
        .from('decks')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range(from, to)

      if (error) {
        console.error('Error fetching decks:', error)
        return
      }

      setDecks(data || [])
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
    fetchDecks()
  }

  const addDeck = async (name: string) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('decks')
        .insert({ name })

      if (error) {
        console.error('Error adding deck:', error)
        throw error
      }

      await fetchDecks()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const updateDeck = async (id: string, updates: DeckUpdate) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('decks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating deck:', error)
        throw error
      }

      await fetchDecks()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const deleteDeck = async (id: string) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting deck:', error)
        throw error
      }

      await fetchDecks()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  return {
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
    goToPage,
    setSort,
    refresh,
    addDeck,
    updateDeck,
    deleteDeck,
  }
}
