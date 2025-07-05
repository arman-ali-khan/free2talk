"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { NeonButton } from '@/components/ui/neon-button'
import { LANGUAGES } from '@/lib/supabase'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Get unique languages that have active rooms
  const activeLanguages = Array.from(new Set(filteredRooms.map(room => room.language)))
  
  // Filter LANGUAGES to only include those with active rooms, plus "all"
  const languagesWithRooms = LANGUAGES.filter(lang => 
    lang.code === 'all' || activeLanguages.includes(lang.code)
  )
  
  // Show first 8 languages by default, rest when expanded
  const visibleLanguages = isExpanded ? languagesWithRooms : languagesWithRooms.slice(0, 8)
  const hasMoreLanguages = languagesWithRooms.length > 8

  const getLanguageCount = (languageCode: string) => {
    if (languageCode === 'all') {
      return filteredRooms.length
    }
    return filteredRooms.filter(r => r.language === languageCode).length
  }

  // Don't show the filter if there are no rooms
  if (filteredRooms.length === 0) {
    return null
  }

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
          {visibleLanguages.map((language) => {
            const count = getLanguageCount(language.code)
            return (
              <NeonButton
                key={language.code}
                variant={selectedLanguage === language.code ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onLanguageChange(language.code)}
                className="gap-2"
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
                {count > 0 && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </NeonButton>
            )
          })}
          
          {hasMoreLanguages && (
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show More ({languagesWithRooms.length - 8} more)
                </>
              )}
            </NeonButton>
          )}
        </div>
      </div>
    </motion.div>
  )
}