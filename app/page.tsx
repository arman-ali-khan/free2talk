"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, LANGUAGES } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { AuthForm } from '@/components/auth/auth-form'
import { RoomCard } from '@/components/room/room-card'
import { CreateRoomDialog } from '@/components/room/create-room-dialog'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Mic, Users, Shield, Zap, RefreshCw, Clock } from 'lucide-react'

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

export default function Home() {
  const { user, setUser, setLoading } = useStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
      setLoading(false)
    }

    checkAuth()
    loadRooms()

    // Auto-refresh rooms every 30 seconds
    const interval = setInterval(loadRooms, 30000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    // Set up real-time subscription for rooms
    const roomSubscription = supabase
      .channel('public-rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          loadRooms()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      roomSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [setUser, setLoading])

  useEffect(() => {
    // Filter rooms by language
    if (selectedLanguage === 'all') {
      setFilteredRooms(rooms)
    } else {
      setFilteredRooms(rooms.filter(room => room.language === selectedLanguage))
    }
  }, [rooms, selectedLanguage])

  const loadRooms = async () => {
    try {
      // Clean up expired rooms first
      await supabase.rpc('auto_delete_expired_rooms')
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const getTimeRemaining = (autoDeleteAt: string) => {
    const now = new Date()
    const deleteTime = new Date(autoDeleteAt)
    const diff = deleteTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              NeonTalk
            </h1>
            <p className="text-gray-400 mt-1">
              Join audio chat rooms by language
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-300">
                  Welcome, {user.user_metadata?.username || user.email}
                </span>
                <CreateRoomDialog />
                <NeonButton
                  variant="secondary"
                  onClick={handleLogout}
                  size="sm"
                >
                  Logout
                </NeonButton>
              </>
            ) : (
              <NeonButton
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                size="sm"
              >
                Sign In
              </NeonButton>
            )}
          </div>
        </motion.div>

        {/* Language Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-8"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Language</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <NeonButton
                  key={language.code}
                  variant={selectedLanguage === language.code ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedLanguage(language.code)}
                  className="gap-2"
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                  {selectedLanguage !== 'all' && language.code !== 'all' && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {filteredRooms.filter(r => r.language === language.code).length}
                    </span>
                  )}
                </NeonButton>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Connect through voice conversations
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join audio-only chat rooms organized by language. Rooms auto-delete after 5 minutes of inactivity.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-gray-300">
                <Mic className="w-5 h-5 text-blue-400" />
                <span>Audio Only</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Group Calls</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-5 h-5 text-green-400" />
                <span>5min Auto-Delete</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>Real-time Chat</span>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
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
                    {selectedLanguage === 'all' ? 'Total Rooms' : `${LANGUAGES.find(l => l.code === selectedLanguage)?.name} Rooms`}
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
                  onClick={loadRooms}
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

          {/* Rooms */}
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
                  >
                    <RoomCard 
                      room={room} 
                      onJoin={handleJoinRoom}
                      timeRemaining={getTimeRemaining(room.auto_delete_at)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Auth Section */}
        {!user && (
          <div id="auth-section" className="px-6 py-12 bg-black/20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Join the Community</h2>
                <p className="text-gray-400">Create an account to start your own rooms and save preferences</p>
              </div>
              <AuthForm />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}