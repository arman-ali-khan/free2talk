"use client"

import { useState } from 'react'
import { supabase, LANGUAGES } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NeonButton } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [language, setLanguage] = useState('english')
  const [maxParticipants, setMaxParticipants] = useState('10')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useStore()
  const router = useRouter()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return

    setLoading(true)
    try {
      const autoDeleteAt = new Date()
      autoDeleteAt.setMinutes(autoDeleteAt.getMinutes() + 5)

      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            name: roomName.trim(),
            creator_id: user?.id || 'anonymous',
            language: language,
            max_participants: parseInt(maxParticipants),
            description: description.trim(),
            is_active: true,
            participant_count: 0,
            auto_delete_at: autoDeleteAt.toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setOpen(false)
      setRoomName('')
      setLanguage('english')
      setMaxParticipants('10')
      setDescription('')
      router.push(`/room/${data.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <NeonButton size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Room
        </NeonButton>
      </DialogTrigger>
      <DialogContent className="bg-gray-900/95 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Create Audio Room
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="roomName" className="text-gray-300">Room Name</Label>
            <Input
              id="roomName"
              type="text"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-black/20 border-gray-600 text-white placeholder-gray-400"
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-gray-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-black/20 border-gray-600 text-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {LANGUAGES.filter(lang => lang.code !== 'all').map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-gray-700">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants" className="text-gray-300">Max Participants</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger className="bg-black/20 border-gray-600 text-white">
                <SelectValue placeholder="Select max participants" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="5" className="text-white hover:bg-gray-700">5 people</SelectItem>
                <SelectItem value="10" className="text-white hover:bg-gray-700">10 people</SelectItem>
                <SelectItem value="15" className="text-white hover:bg-gray-700">15 people</SelectItem>
                <SelectItem value="20" className="text-white hover:bg-gray-700">20 people</SelectItem>
                <SelectItem value="25" className="text-white hover:bg-gray-700">25 people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/20 border-gray-600 text-white placeholder-gray-400 resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-400">{description.length}/200 characters</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-300">
              ⏰ Room will auto-delete after 5 minutes of inactivity
            </p>
          </div>

          <NeonButton
            type="submit"
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            Create Audio Room
          </NeonButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}