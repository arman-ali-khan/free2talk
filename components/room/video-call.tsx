"use client"

import { useEffect, useRef, useState } from 'react'
import { WebRTCManager } from '@/lib/webrtc'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { UserList } from '@/components/room/user-list'
import { ChatPanel } from '@/components/room/chat-panel'
import { Mic, MicOff, PhoneOff, MessageSquare, Users, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const webrtcRef = useRef<WebRTCManager | null>(null)
  const localAudioRef = useRef<HTMLAudioElement>(null)

  const currentUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest'

  useEffect(() => {
    loadRoomInfo()
    initWebRTC()

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.cleanup()
      }
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

  const initWebRTC = async () => {
    try {
      webrtcRef.current = new WebRTCManager()
      webrtcRef.current.setRoomId(roomId)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false // Audio only
      })
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
      }
      
      setIsConnected(true)

      // Add current user to participants
      const currentUser: Participant = {
        id: user?.id || 'guest-' + Date.now(),
        username: currentUsername,
        isAudioEnabled: true,
        isVideoEnabled: false, // Always false for audio calls
        isCurrentUser: true
      }
      setParticipants([currentUser])

      // Simulate other participants for demo
      setTimeout(() => {
        const demoParticipants: Participant[] = [
          {
            id: 'demo-1',
            username: 'Alice',
            isAudioEnabled: true,
            isVideoEnabled: false,
            isCurrentUser: false
          },
          {
            id: 'demo-2',
            username: 'Bob',
            isAudioEnabled: false,
            isVideoEnabled: false,
            isCurrentUser: false
          }
        ]
        setParticipants(prev => [...prev, ...demoParticipants])
      }, 2000)

    } catch (error) {
      console.error('Error initializing WebRTC:', error)
    }
  }

  const toggleAudio = () => {
    if (localAudioRef.current?.srcObject) {
      const stream = localAudioRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
        
        // Update participant state
        setParticipants(prev => prev.map(p => 
          p.isCurrentUser ? { ...p, isAudioEnabled: audioTrack.enabled } : p
        ))
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    // In a real implementation, this would control the audio output
  }

  const handleLeave = () => {
    if (webrtcRef.current) {
      webrtcRef.current.cleanup()
    }
    onLeave()
  }

  const handleParticipantMute = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, isAudioEnabled: !p.isAudioEnabled } : p
    ))
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
              Users
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
          {participants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <GlassCard className="h-32 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Audio Visualization */}
                <div className={`absolute inset-0 ${
                  participant.isAudioEnabled 
                    ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 animate-pulse' 
                    : 'bg-gray-800/50'
                }`} />
                
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 z-10 ${
                  participant.isAudioEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-blue-600' 
                    : 'bg-gray-600'
                }`}>
                  <span className="text-xl font-bold text-white">
                    {participant.username.charAt(0).toUpperCase()}
                  </span>
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
                {participant.isAudioEnabled && (
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