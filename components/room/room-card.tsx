"use client"

import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Users, Clock, User, Mic, Timer, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { LANGUAGES } from '@/lib/supabase'

interface RoomCardProps {
  room: {
    id: string
    name: string
    creator_id: string
    created_at: string
    participant_count: number
    is_active: boolean
    language: string
    max_participants: number
    description: string
    auto_delete_at: string
  }
  onJoin: (roomId: string) => void
  timeRemaining: string
}

export function RoomCard({ room, onJoin, timeRemaining }: RoomCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const language = LANGUAGES.find(l => l.code === room.language)
  const isRoomFull = room.participant_count >= room.max_participants

  return (
    <GlassCard hover className="relative group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Room Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{language?.flag}</span>
              <h3 className="text-xl font-semibold text-white truncate">
                {room.name}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{room.participant_count}/{room.max_participants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(room.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              timeRemaining === 'Expired' 
                ? 'bg-red-500/20 text-red-300' 
                : 'bg-green-500/20 text-green-300'
            }`}>
              <Timer className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${room.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          </div>
        </div>

        {/* Language & Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
              {language?.name}
            </span>
            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
              Audio Only
            </span>
          </div>
          
          {room.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {room.description}
            </p>
          )}
        </div>

        {/* Participant Preview */}
        {room.participant_count > 0 && (
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Active speakers</span>
            </div>
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(room.participant_count, 5) }).map((_, index) => (
                <div
                  key={index}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full border-2 border-gray-900 flex items-center justify-center"
                >
                  <Mic className="w-3 h-3 text-white" />
                </div>
              ))}
              {room.participant_count > 5 && (
                <div className="w-8 h-8 bg-gray-600 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <span className="text-xs text-white">+{room.participant_count - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room Features */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              <span>Audio</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>Chat</span>
            </div>
          </div>
          <span>Room ID: {room.id.slice(0, 8)}...</span>
        </div>

        {/* Join Button */}
        <NeonButton
          onClick={() => onJoin(room.id)}
          className="w-full"
          size="md"
          disabled={isRoomFull || timeRemaining === 'Expired'}
          variant={isRoomFull ? 'secondary' : 'primary'}
        >
          {timeRemaining === 'Expired' 
            ? 'Room Expired' 
            : isRoomFull 
              ? 'Room Full' 
              : room.participant_count === 0 
                ? 'Start Talking' 
                : 'Join Conversation'
          }
        </NeonButton>
      </motion.div>
    </GlassCard>
  )
}