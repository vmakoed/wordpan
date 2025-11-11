import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Flashcard = Database['public']['Tables']['flashcards']['Row']
type DeckFlashcard = Database['public']['Tables']['deck_flashcards']['Row']

export type FlashcardWithDetails = Flashcard & {
  deck_flashcard_id: string
  position: number
  added_at: string
}

export function useDeckFlashcards(deckId: string | undefined) {
  const [flashcards, setFlashcards] = useState<FlashcardWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  useEffect(() => {
    if (deckId) {
      fetchDeckFlashcards()
    }
  }, [deckId])

  const fetchDeckFlashcards = async () => {
    if (!deckId) return

    try {
      setLoading(true)

      // Query deck_flashcards with join to flashcards
      const { data, error } = await supabase
        .from('deck_flashcards')
        .select(`
          id,
          position,
          added_at,
          flashcards (
            id,
            front,
            back,
            language,
            created_at,
            updated_at,
            user_id
          )
        `)
        .eq('deck_id', deckId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching deck flashcards:', error)
        return
      }

      // Transform the joined data
      const transformedData = (data || []).map((item: any) => ({
        ...item.flashcards,
        deck_flashcard_id: item.id,
        position: item.position,
        added_at: item.added_at,
      }))

      setFlashcards(transformedData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addFlashcardToDeck = async (flashcardId: string) => {
    if (!deckId) return

    try {
      setMutating(true)

      // Get the maximum position
      const { data: maxPositionData } = await supabase
        .from('deck_flashcards')
        .select('position')
        .eq('deck_id', deckId)
        .order('position', { ascending: false })
        .limit(1)

      const maxPosition = maxPositionData?.[0]?.position ?? -1
      const newPosition = maxPosition + 1

      const { error } = await supabase
        .from('deck_flashcards')
        .insert({
          deck_id: deckId,
          flashcard_id: flashcardId,
          position: newPosition,
        })

      if (error) {
        console.error('Error adding flashcard to deck:', error)
        throw error
      }

      await fetchDeckFlashcards()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const removeFlashcardFromDeck = async (deckFlashcardId: string) => {
    try {
      setMutating(true)
      const { error } = await supabase
        .from('deck_flashcards')
        .delete()
        .eq('id', deckFlashcardId)

      if (error) {
        console.error('Error removing flashcard from deck:', error)
        throw error
      }

      await fetchDeckFlashcards()
    } catch (error) {
      console.error('Error:', error)
      throw error
    } finally {
      setMutating(false)
    }
  }

  const getAvailableFlashcards = async (): Promise<Flashcard[]> => {
    if (!deckId) return []

    try {
      // Get all flashcards that are NOT in this deck
      const { data: deckFlashcardIds } = await supabase
        .from('deck_flashcards')
        .select('flashcard_id')
        .eq('deck_id', deckId)

      const excludedIds = (deckFlashcardIds || []).map((df) => df.flashcard_id)

      const query = supabase
        .from('flashcards')
        .select('*')
        .order('front', { ascending: true })

      // Only add the filter if there are IDs to exclude
      const { data, error } = excludedIds.length > 0
        ? await query.not('id', 'in', `(${excludedIds.join(',')})`)
        : await query

      if (error) {
        console.error('Error fetching available flashcards:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  }

  const refresh = () => {
    fetchDeckFlashcards()
  }

  return {
    flashcards,
    loading,
    mutating,
    refresh,
    addFlashcardToDeck,
    removeFlashcardFromDeck,
    getAvailableFlashcards,
  }
}
