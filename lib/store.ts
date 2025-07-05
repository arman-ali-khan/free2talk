import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface AppState {
  user: User | null
  isLoading: boolean
  currentRoom: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setCurrentRoom: (roomId: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isLoading: true,
  currentRoom: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
}))