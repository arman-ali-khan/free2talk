"use client"

import { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Mic, MicOff, Video, VideoOff, Crown, X, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

interface Participant {
  id: string
  username: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isCurrentUser: boolean
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
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((participant, index) => (
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
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">
                        {participant.username}
                      </p>
                      {participant.isCurrentUser && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Audio Status */}
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {participant.isAudioEnabled ? (
                          <Mic className="w-2 h-2 text-white" />
                        ) : (
                          <MicOff className="w-2 h-2 text-white" />
                        )}
                      </div>
                      
                      {/* Video Status */}
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        participant.isVideoEnabled ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {participant.isVideoEnabled ? (
                          <Video className="w-2 h-2 text-white" />
                        ) : (
                          <VideoOff className="w-2 h-2 text-white" />
                        )}
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
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Click the volume icon to mute users locally
          </p>
        </div>
      </div>
    </div>
  )
}