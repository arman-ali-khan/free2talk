import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          creator_id: string
          created_at: string
          is_active: boolean
          participant_count: number
          language: string
          max_participants: number
          description: string
          auto_delete_at: string
          language_level: string
        }
        Insert: {
          id?: string
          name: string
          creator_id: string
          created_at?: string
          is_active?: boolean
          participant_count?: number
          language?: string
          max_participants?: number
          description?: string
          auto_delete_at?: string
          language_level?: string
        }
        Update: {
          id?: string
          name?: string
          creator_id?: string
          created_at?: string
          is_active?: boolean
          participant_count?: number
          language?: string
          max_participants?: number
          description?: string
          auto_delete_at?: string
          language_level?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          username: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          username: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          username?: string
          message?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          last_seen: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          last_seen?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          last_seen?: string
        }
      }
    }
  }
}

// Language options for rooms
export const LANGUAGES = [
  { code: 'all', name: 'All Languages', flag: '🌍' },
  { code: 'english', name: 'English', flag: '🇺🇸' },
  { code: 'spanish', name: 'Español', flag: '🇪🇸' },
  { code: 'french', name: 'Français', flag: '🇫🇷' },
  { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'italian', name: 'Italiano', flag: '🇮🇹' },
  { code: 'portuguese', name: 'Português', flag: '🇵🇹' },
  { code: 'russian', name: 'Русский', flag: '🇷🇺' },
  { code: 'chinese', name: '中文', flag: '🇨🇳' },
  { code: 'japanese', name: '日本語', flag: '🇯🇵' },
  { code: 'korean', name: '한국어', flag: '🇰🇷' },
  { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
  { code: 'hindi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'dutch', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'swedish', name: 'Svenska', flag: '🇸🇪' },
  { code: 'norwegian', name: 'Norsk', flag: '🇳🇴' },
  { code: 'danish', name: 'Dansk', flag: '🇩🇰' },
  { code: 'finnish', name: 'Suomi', flag: '🇫🇮' },
  { code: 'polish', name: 'Polski', flag: '🇵🇱' },
  { code: 'turkish', name: 'Türkçe', flag: '🇹🇷' },
]

// Language proficiency levels
export const LANGUAGE_LEVELS = [
  { code: 'any', name: 'Any Level', color: 'bg-gray-500/20 text-gray-300', icon: '🌟' },
  { code: 'beginner', name: 'Beginner', color: 'bg-green-500/20 text-green-300', icon: '🌱' },
  { code: 'upper-beginner', name: 'Upper Beginner', color: 'bg-green-600/20 text-green-400', icon: '🌿' },
  { code: 'intermediate', name: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-300', icon: '⭐' },
  { code: 'upper-intermediate', name: 'Upper Intermediate', color: 'bg-orange-500/20 text-orange-300', icon: '🔥' },
  { code: 'advanced', name: 'Advanced', color: 'bg-red-500/20 text-red-300', icon: '💎' },
  { code: 'upper-advanced', name: 'Upper Advanced', color: 'bg-purple-500/20 text-purple-300', icon: '👑' },
]

// Generate avatar URL based on username
export const generateAvatarUrl = (username: string, size: number = 40): string => {
  const seed = username.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=transparent`
}

// Get random avatar style for guests
export const getGuestAvatarUrl = (guestId: string, size: number = 40): string => {
  const styles = ['avataaars', 'bottts', 'identicon', 'initials', 'personas']
  const style = styles[Math.abs(guestId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % styles.length]
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${guestId}&size=${size}&backgroundColor=transparent`
}