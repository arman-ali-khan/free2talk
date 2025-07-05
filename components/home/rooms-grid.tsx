"use client"

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { RoomCard } from '@/components/room/room-card'
import { CreateRoomDialog } from '@/components/room/create-room-dialog'
import { Mic, AlertTriangle } from 'lucide-react'
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

interface RoomsGridProps {
  filteredRooms: Room[]
  selectedLanguage: string
  loadingRooms: boolean
  onJoinRoom: (roomId: string) => void
  getTimeRemaining: (autoDeleteAt: string) => string
  getEmptyTimeRemaining: (emptySince: string | null) => string | null
}

export function RoomsGrid({ 
  filteredRooms, 
  selectedLanguage, 
  loadingRooms, 
  onJoinRoom, 
  getTimeRemaining,
  getEmptyTimeRemaining 
}: RoomsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-white">
          {selectedLanguage === 'all' 
            ? 'All Rooms' 
            : `${LANGUAGES.find(l => l.code === selectedLanguage)?.flag} ${LANGUAGES.find(l => l.code === selectedLanguage)?.name} Rooms`
          }
        </h2>
        <CreateRoomDialog />
      </div>
      
      {loadingRooms ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {selectedLanguage === 'all' ? 'No active rooms' : `No ${LANGUAGES.find(l => l.code === selectedLanguage)?.name} rooms`}
          </h3>
          <p className="text-gray-400 mb-6">
            Be the first to create a room and start talking!
          </p>
          <CreateRoomDialog />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <RoomCard 
                room={room} 
                onJoin={onJoinRoom}
                timeRemaining={getTimeRemaining(room.auto_delete_at)}
              />
              {/* Empty Room Warning */}
              {room.participant_count === 0 && room.empty_since && (
                <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{getEmptyTimeRemaining(room.empty_since)}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}