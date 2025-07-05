"use client"

import { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Mic, MicOff, Crown, X, Volume2, VolumeX, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateAvatarUrl, getGuestAvatarUrl } from '@/lib/supabase'

interface Participant {
  id: string
  username: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isCurrentUser: boolean
  joinedAt: string
}

interface UserListProps {
  participants: Participant[]
  onMuteParticipant: (participantId: string) => void
  onClose: () => void
}

export function UserList({ participants, onMuteParticipant, onClose }: UserListProps) {
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set())

  const toggleUserMute = (userId: string) => {
    setMutedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const formatJoinTime = (joinedAt: string) => {
    const joinTime = new Date(joinedAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - joinTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just joined'
    if (diffInMinutes === 1) return '1 minute ago'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 hour ago'
    return `${diffInHours} hours ago`
  }

  // Sort participants: current user first, then by join time
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isCurrentUser) return -1
    if (b.isCurrentUser) return 1
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Participants ({participants.length})
          </h3>
          <NeonButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </NeonButton>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Real-time participant list
        </p>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedParticipants.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No participants yet</p>
            <p className="text-sm text-gray-500 mt-1">Waiting for others to join...</p>
          </div>
        ) : (
          sortedParticipants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={participant.id.startsWith('guest-') 
                          ? getGuestAvatarUrl(participant.id, 40)
                          : generateAvatarUrl(participant.username, 40)
                        }
                        alt={participant.username}
                        className={`w-10 h-10 rounded-full border-2 ${
                          participant.isAudioEnabled 
                            ? 'border-green-500' 
                            : 'border-gray-600'
                        } bg-gray-800`}
                      />
                      {participant.isCurrentUser && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Crown className="w-2 h-2 text-black" />
                        </div>
                      )}
                      {participant.isAudioEnabled && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border border-gray-900 flex items-center justify-center">
                          <Mic className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {participant.username}
                        </p>
                        {participant.isCurrentUser && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Audio Status */}
                        <div className={`flex items-center gap-1 text-xs ${
                          participant.isAudioEnabled ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {participant.isAudioEnabled ? (
                            <Mic className="w-3 h-3" />
                          ) : (
                            <MicOff className="w-3 h-3" />
                          )}
                          <span>{participant.isAudioEnabled ? 'Speaking' : 'Muted'}</span>
                        </div>
                        
                        {/* Join Time */}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatJoinTime(participant.joinedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Local Mute Control */}
                    {!participant.isCurrentUser && (
                      <NeonButton
                        variant={mutedUsers.has(participant.id) ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => toggleUserMute(participant.id)}
                        className="w-8 h-8 p-0"
                        title={mutedUsers.has(participant.id) ? 'Unmute for you' : 'Mute for you'}
                      >
                        {mutedUsers.has(participant.id) ? (
                          <VolumeX className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </NeonButton>
                    )}
                    
                    {/* Participant Mute Control (for current user only) */}
                    {participant.isCurrentUser && (
                      <NeonButton
                        variant={participant.isAudioEnabled ? 'secondary' : 'danger'}
                        size="sm"
                        onClick={() => onMuteParticipant(participant.id)}
                        className="w-8 h-8 p-0"
                        title={participant.isAudioEnabled ? 'Mute yourself' : 'Unmute yourself'}
                      >
                        {participant.isAudioEnabled ? (
                          <Mic className="w-3 h-3" />
                        ) : (
                          <MicOff className="w-3 h-3" />
                        )}
                      </NeonButton>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {participants.filter(p => p.isAudioEnabled).length} speaking • {participants.length} total
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click volume icons to mute users locally
          </p>
        </div>
      </div>
    </div>
  )
}