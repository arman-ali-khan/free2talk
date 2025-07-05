"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { AuthForm } from '@/components/auth/auth-form'
import { CreateRoomDialog } from '@/components/room/create-room-dialog'
import { NeonButton } from '@/components/ui/neon-button'
import { HeroSection } from '@/components/home/hero-section'
import { LanguageFilter } from '@/components/home/language-filter'
import { DeletionNotice } from '@/components/home/deletion-notice'
import { RoomStats } from '@/components/home/room-stats'
import { RoomsGrid } from '@/components/home/rooms-grid'

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

    // Auto-refresh rooms every 15 seconds
    const interval = setInterval(() => {
      loadRooms()
      cleanupEmptyRooms()
    }, 15000)

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
      await cleanupEmptyRooms()
      
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

  const cleanupEmptyRooms = async () => {
    try {
      // Call the database function to clean up empty rooms
      const { error } = await supabase.rpc('auto_delete_empty_rooms')
      if (error) {
        console.error('Error cleaning up rooms:', error)
      }
    } catch (error) {
      console.error('Error calling cleanup function:', error)
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

  const getEmptyTimeRemaining = (emptySince: string | null) => {
    if (!emptySince) return null
    
    const now = new Date()
    const emptyTime = new Date(emptySince)
    const diff = now.getTime() - emptyTime.getTime()
    const remainingMs = (60 * 1000) - diff // 1 minute in ms
    
    if (remainingMs <= 0) return 'Deleting...'
    
    const seconds = Math.floor(remainingMs / 1000)
    return `${seconds}s until deletion`
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
        <LanguageFilter 
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          filteredRooms={filteredRooms}
        />

        {/* Hero Section */}
        <HeroSection />

        {/* Auto-deletion Notice */}
        <DeletionNotice />

        {/* Stats */}
        <RoomStats 
          filteredRooms={filteredRooms}
          selectedLanguage={selectedLanguage}
          onRefresh={loadRooms}
        />

        {/* Rooms Grid */}
        <div className="px-6">
          <RoomsGrid 
            filteredRooms={filteredRooms}
            selectedLanguage={selectedLanguage}
            loadingRooms={loadingRooms}
            onJoinRoom={handleJoinRoom}
            getTimeRemaining={getTimeRemaining}
            getEmptyTimeRemaining={getEmptyTimeRemaining}
          />
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