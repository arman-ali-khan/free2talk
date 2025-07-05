"use client"

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Users, RefreshCw } from 'lucide-react'
import { LANGUAGES } from '@/lib/supabase'

interface Room {
  id: string
  name: string
  creator_id: string
  created_at: string
  participant_count: number
  is_active: boolean
  language: string
  language_level: string
  max_participants: number
  description: string
  auto_delete_at: string
  last_activity_at: string
  empty_since: string | null
}

interface RoomStatsProps {
  filteredRooms: Room[]
  selectedLanguage: string
  onRefresh: () => void
}

export function RoomStats({ filteredRooms, selectedLanguage, onRefresh }: RoomStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
    >
      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{filteredRooms.length}</p>
            <p className="text-gray-400">
              {selectedLanguage === 'all' ? 'Active Rooms' : `${LANGUAGES.find(l => l.code === selectedLanguage)?.name} Rooms`}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {filteredRooms.reduce((acc, room) => acc + room.participant_count, 0)}
            </p>
            <p className="text-gray-400">Active Speakers</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Join Now</p>
            <p className="text-gray-400">No registration required</p>
          </div>
          <NeonButton
            onClick={onRefresh}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </NeonButton>
        </div>
      </GlassCard>
    </motion.div>
  )
}