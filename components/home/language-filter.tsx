"use client"

import { motion } from 'framer-motion'
import { NeonButton } from '@/components/ui/neon-button'
import { LANGUAGES } from '@/lib/supabase'

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

interface LanguageFilterProps {
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  filteredRooms: Room[]
}

export function LanguageFilter({ selectedLanguage, onLanguageChange, filteredRooms }: LanguageFilterProps) {
  return (
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
              onClick={() => onLanguageChange(language.code)}
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
  )
}