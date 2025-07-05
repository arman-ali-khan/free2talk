"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, LANGUAGES } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { VideoCall } from '@/components/room/video-call'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { ArrowLeft, Users, Mic, LogIn, Clock, Timer } from 'lucide-react'

interface Room {
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

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user, setCurrentRoom } = useStore()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')

  const roomId = params.id as string

  useEffect(() => {
    loadRoom()
    setCurrentRoom(roomId)

    const interval = setInterval(() => {
      if (room) {
        updateTimeRemaining()
      }
    }, 1000)

    return () => {
      setCurrentRoom(null)
      clearInterval(interval)
    }
  }, [roomId, setCurrentRoom, room])

  const updateTimeRemaining = () => {
    if (!room) return
    
    const now = new Date()
    const deleteTime = new Date(room.auto_delete_at)
    const diff = deleteTime.getTime() - now.getTime()
    
    if (diff <= 0) {
      setTimeRemaining('Expired')
      router.push('/')
      return
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
  }

  const loadRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) throw error
      
      if (!data.is_active) {
        router.push('/')
        return
      }

      // Check if room has expired
      const now = new Date()
      const deleteTime = new Date(data.auto_delete_at)
      if (deleteTime <= now) {
        router.push('/')
        return
      }

      setRoom(data)
    } catch (error) {
      console.error('Error loading room:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!room) return

    // Check if room is full
    if (room.participant_count >= room.max_participants) {
      alert('Room is full!')
      return
    }

    try {
      setJoined(true)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleLeaveRoom = async () => {
    if (!room) return

    try {
      router.push('/')
    } catch (error) {
      console.error('Error leaving room:', error)
      router.push('/')
    }
  }

  const handleSignIn = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  if (joined) {
    return <VideoCall roomId={roomId} onLeave={handleLeaveRoom} />
  }

  const language = LANGUAGES.find(l => l.code === room.language)
  const isRoomFull = room.participant_count >= room.max_participants

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <GlassCard className="text-center">
            <div className="space-y-6">
              {/* Room Info */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl">{language?.flag}</span>
                  <h1 className="text-3xl font-bold text-white">{room.name}</h1>
                </div>
                <p className="text-gray-400">Real-time audio chat room</p>
                {room.description && (
                  <p className="text-gray-300 mt-2 text-sm">{room.description}</p>
                )}
              </div>

              {/* Time Remaining */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-semibold">Auto-delete in</span>
                </div>
                <p className="text-2xl font-bold text-yellow-300">{timeRemaining}</p>
              </div>

              {/* Room Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-white">{room.participant_count}/{room.max_participants}</p>
                  <p className="text-sm text-gray-400">Participants</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <Mic className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-white">✓</p>
                  <p className="text-sm text-gray-400">Audio Only</p>
                </div>
              </div>

              {/* Language Badge */}
              <div className="flex justify-center">
                <span className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                  {language?.name} Room
                </span>
              </div>

              {/* User Status */}
              {!user && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <LogIn className="w-5 h-5" />
                    <span className="font-semibold">Guest Mode</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    You're joining as a guest. Sign in to create rooms and access more features.
                  </p>
                </div>
              )}

              {/* Room Full Warning */}
              {isRoomFull && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300 font-semibold">Room is full!</p>
                  <p className="text-sm text-gray-300">
                    This room has reached its maximum capacity of {room.max_participants} participants.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <NeonButton
                  onClick={handleJoinRoom}
                  className="w-full"
                  size="lg"
                  disabled={isRoomFull || timeRemaining === 'Expired'}
                >
                  {timeRemaining === 'Expired' 
                    ? 'Room Expired' 
                    : isRoomFull 
                      ? 'Room Full' 
                      : 'Join Audio Chat'
                  }
                </NeonButton>
                
                {!user && !isRoomFull && timeRemaining !== 'Expired' && (
                  <NeonButton
                    variant="secondary"
                    onClick={handleSignIn}
                    className="w-full gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In for Full Features
                  </NeonButton>
                )}
                
                <NeonButton
                  variant="secondary"
                  onClick={() => router.push('/')}
                  className="w-full gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Rooms
                </NeonButton>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-400 bg-black/20 rounded-lg p-4">
                <p className="mb-2">
                  <strong>Room ID:</strong> {roomId.slice(0, 8)}...
                </p>
                <p className="mb-2">
                  <strong>Real-time:</strong> Live participant tracking
                </p>
                <p>
                  Make sure your microphone is ready before joining.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}