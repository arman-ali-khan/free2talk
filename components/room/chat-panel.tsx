"use client"

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { GlassCard } from '@/components/ui/glass-card'
import { NeonButton } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Send, X, Smile } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatMessage {
  id: string
  username: string
  message: string
  created_at: string
  user_id: string | null
  isCurrentUser: boolean
}

interface ChatPanelProps {
  roomId: string
  currentUser: string
  onClose: () => void
}

export function ChatPanel({ roomId, currentUser, onClose }: ChatPanelProps) {
  const { user } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadMessages()
    
    // Set up real-time subscription for messages
    const messageSubscription = supabase
      .channel(`room-${roomId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as any
          setMessages(prev => [...prev, {
            ...newMessage,
            isCurrentUser: newMessage.username === currentUser
          }])
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [roomId, currentUser])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      const messagesWithCurrentUser = (data || []).map(msg => ({
        ...msg,
        isCurrentUser: msg.username === currentUser
      }))

      setMessages(messagesWithCurrentUser)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || loading) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: roomId,
            user_id: user?.id || null,
            username: currentUser,
            message: newMessage.trim(),
          },
        ])

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const quickEmojis = ['😊', '😂', '👍', '❤️', '🔥', '👏', '🎉', '😮']

  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Live Chat</h3>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.isCurrentUser ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-lg p-3 ${
                  message.isCurrentUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  {!message.isCurrentUser && (
                    <p className="text-xs font-semibold mb-1 text-blue-300">
                      {message.username}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed break-words">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.isCurrentUser ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      <div className="px-4 py-2 border-t border-gray-700">
        <div className="flex gap-2 overflow-x-auto">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg hover:bg-gray-700 rounded p-1 transition-colors flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-black/20 border-gray-600 text-white placeholder-gray-400 pr-10"
              maxLength={500}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              onClick={() => addEmoji('😊')}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <NeonButton
            type="submit"
            size="sm"
            className="w-10 h-10 p-0"
            disabled={!newMessage.trim() || loading}
            isLoading={loading}
          >
            <Send className="w-4 h-4" />
          </NeonButton>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send • {newMessage.length}/500
        </p>
      </div>
    </div>
  )
}