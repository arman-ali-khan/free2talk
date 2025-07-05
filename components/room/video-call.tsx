"use client"

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { UserList } from '@/components/room/user-list'
import { ChatPanel } from '@/components/room/chat-panel'
import { Mic, MicOff, PhoneOff, MessageSquare, Users, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateAvatarUrl, getGuestAvatarUrl } from '@/lib/supabase'

interface VideoCallProps {
  roomId: string
  onLeave: () => void
}

interface Participant {
  id: string
  username: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isCurrentUser: boolean
  joinedAt: string
}

interface RoomPresence {
  user_id: string
  username: string
  is_audio_enabled: boolean
  joined_at: string
}

export function VideoCall({ roomId, onLeave }: VideoCallProps) {
  const { user } = useStore()
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roomInfo, setRoomInfo] = useState<any>(null)
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const presenceChannelRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || `Guest-${Date.now()}`
  const currentUserId = user?.id || `guest-${Date.now()}`

  useEffect(() => {
    loadRoomInfo()
    initAudio()
    setupPresence()

    return () => {
      cleanup()
    }
  }, [roomId, user, currentUsername])

  const loadRoomInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) throw error
      setRoomInfo(data)
    } catch (error) {
      console.error('Error loading room info:', error)
    }
  }

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      })
      
      localStreamRef.current = stream
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
      }

      // Set up audio analysis for speaking detection
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start speaking detection
      detectSpeaking()
      
      setIsConnected(true)
    } catch (error) {
      console.error('Error initializing audio:', error)
      setIsConnected(false)
    }
  }

  const detectSpeaking = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      
      const speaking = average > 20 && isAudioEnabled // Threshold for speaking detection
      if (speaking !== isSpeaking) {
        setIsSpeaking(speaking)
      }
      
      requestAnimationFrame(checkAudioLevel)
    }
    
    checkAudioLevel()
  }

  const setupPresence = async () => {
    try {
      // Create a presence channel for this room
      presenceChannelRef.current = supabase.channel(`room-${roomId}-presence`, {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      })

      // Track presence state
      presenceChannelRef.current
        .on('presence', { event: 'sync' }, () => {
          const presenceState = presenceChannelRef.current.presenceState()
          updateParticipants(presenceState)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          console.log('User left:', key, leftPresences)
        })

      // Subscribe to the channel
      await presenceChannelRef.current.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await presenceChannelRef.current.track({
            user_id: currentUserId,
            username: currentUsername,
            is_audio_enabled: isAudioEnabled,
            joined_at: new Date().toISOString(),
          })
        }
      })

      // Listen for audio state changes from other users
      presenceChannelRef.current.on('broadcast', { event: 'audio-toggle' }, ({ payload }: any) => {
        setParticipants(prev => prev.map(p => 
          p.id === payload.user_id 
            ? { ...p, isAudioEnabled: payload.is_audio_enabled }
            : p
        ))
      })

    } catch (error) {
      console.error('Error setting up presence:', error)
    }
  }

  const updateParticipants = (presenceState: Record<string, RoomPresence[]>) => {
    const allParticipants: Participant[] = []
    
    Object.entries(presenceState).forEach(([key, presences]) => {
      presences.forEach((presence) => {
        allParticipants.push({
          id: presence.user_id,
          username: presence.username,
          isAudioEnabled: presence.is_audio_enabled,
          isVideoEnabled: false, // Always false for audio calls
          isCurrentUser: presence.user_id === currentUserId,
          joinedAt: presence.joined_at,
        })
      })
    })

    // Sort by join time, current user first
    allParticipants.sort((a, b) => {
      if (a.isCurrentUser) return -1
      if (b.isCurrentUser) return 1
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    })

    setParticipants(allParticipants)
    
    // Update room participant count
    updateRoomParticipantCount(allParticipants.length)
  }

  const updateRoomParticipantCount = async (count: number) => {
    try {
      await supabase
        .from('rooms')
        .update({ 
          participant_count: count,
          last_activity_at: new Date().toISOString(),
          empty_since: count === 0 ? new Date().toISOString() : null
        })
        .eq('id', roomId)
    } catch (error) {
      console.error('Error updating participant count:', error)
    }
  }

  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        const newAudioState = audioTrack.enabled
        setIsAudioEnabled(newAudioState)
        
        // Update presence with new audio state
        if (presenceChannelRef.current) {
          await presenceChannelRef.current.track({
            user_id: currentUserId,
            username: currentUsername,
            is_audio_enabled: newAudioState,
            joined_at: new Date().toISOString(),
          })

          // Broadcast audio state change to other users
          await presenceChannelRef.current.send({
            type: 'broadcast',
            event: 'audio-toggle',
            payload: {
              user_id: currentUserId,
              is_audio_enabled: newAudioState,
            },
          })
        }
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    // In a real implementation, this would control the audio output
  }

  const handleLeave = async () => {
    await cleanup()
    onLeave()
  }

  const cleanup = async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Untrack presence
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.untrack()
        await presenceChannelRef.current.unsubscribe()
        presenceChannelRef.current = null
      }

      // Update room participant count
      const remainingCount = Math.max(0, participants.length - 1)
      await updateRoomParticipantCount(remainingCount)
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  const handleParticipantMute = (participantId: string) => {
    if (participantId === currentUserId) {
      toggleAudio()
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      {/* Main Audio Area */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">{roomInfo?.name || 'Audio Room'}</h1>
            <div className="flex items-center gap-4 text-gray-400">
              <span>{participants.length} participants</span>
              {roomInfo?.language && (
                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-sm">
                  {roomInfo.language}
                </span>
              )}
              <span className="text-green-400">● Live</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NeonButton
              variant={showUsers ? 'primary' : 'secondary'}
              onClick={() => setShowUsers(!showUsers)}
              size="sm"
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Users ({participants.length})
            </NeonButton>
            <NeonButton
              variant={showChat ? 'primary' : 'secondary'}
              onClick={() => setShowChat(!showChat)}
              size="sm"
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </NeonButton>
          </div>
        </motion.div>

        {/* Audio Participants Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <GlassCard className="h-32 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Audio Visualization */}
                <div className={`absolute inset-0 transition-all duration-300 ${
                  participant.isAudioEnabled && (participant.isCurrentUser ? isSpeaking : true)
                    ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 animate-pulse' 
                    : 'bg-gray-800/50'
                }`} />
                
                {/* Avatar */}
                <div className="relative z-10 mb-2">
                  <img
                    src={participant.id.startsWith('guest-') 
                      ? getGuestAvatarUrl(participant.id, 64)
                      : generateAvatarUrl(participant.username, 64)
                    }
                    alt={participant.username}
                    className={`w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                      participant.isAudioEnabled && (participant.isCurrentUser ? isSpeaking : true)
                        ? 'border-green-500 shadow-lg shadow-green-500/50' 
                        : 'border-gray-600'
                    } bg-gray-800`}
                  />
                  {participant.isCurrentUser && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs text-black">★</span>
                    </div>
                  )}
                </div>
                
                {/* Name and Status */}
                <div className="text-center z-10">
                  <p className="text-white font-medium text-sm truncate max-w-full px-2">
                    {participant.username}
                    {participant.isCurrentUser && ' (You)'}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {participant.isAudioEnabled ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Mic className="w-2 h-2 text-white" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Speaking Indicator */}
                {participant.isAudioEnabled && (participant.isCurrentUser ? isSpeaking : true) && (
                  <div className="absolute bottom-2 right-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, (roomInfo?.max_participants || 10) - participants.length) }).map((_, index) => (
            <GlassCard key={`empty-${index}`} className="h-32 flex items-center justify-center opacity-30">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Waiting...</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg">
              <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin" />
              Connecting to audio...
            </div>
          </div>
        )}

        {/* Audio Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4"
        >
          <NeonButton
            variant={isAudioEnabled ? 'secondary' : 'danger'}
            onClick={toggleAudio}
            className="w-14 h-14 rounded-full p-0"
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </NeonButton>

          <NeonButton
            variant={isSpeakerEnabled ? 'secondary' : 'danger'}
            onClick={toggleSpeaker}
            className="w-14 h-14 rounded-full p-0"
            title={isSpeakerEnabled ? 'Mute speakers' : 'Unmute speakers'}
          >
            {isSpeakerEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </NeonButton>

          <NeonButton
            variant="danger"
            onClick={handleLeave}
            className="w-14 h-14 rounded-full p-0"
            title="Leave room"
          >
            <PhoneOff className="w-6 h-6" />
          </NeonButton>
        </motion.div>

        {/* Hidden audio element for local stream */}
        <audio ref={localAudioRef} autoPlay muted />
      </div>

      {/* Side Panels */}
      {showUsers && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="w-80 border-l border-gray-700"
        >
          <UserList 
            participants={participants} 
            onMuteParticipant={handleParticipantMute}
            onClose={() => setShowUsers(false)}
          />
        </motion.div>
      )}

      {showChat && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="w-80 border-l border-gray-700"
        >
          <ChatPanel 
            roomId={roomId}
            currentUser={currentUsername}
            onClose={() => setShowChat(false)}
          />
        </motion.div>
      )}
    </div>
  )
}