"use client"

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/glass-card'
import { AlertTriangle } from 'lucide-react'

export function DeletionNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="max-w-4xl mx-auto mb-8"
    >
      <GlassCard className="bg-yellow-500/10 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-300 font-semibold mb-1">Auto-Deletion Policy</h3>
            <p className="text-yellow-200 text-sm">
              Rooms are automatically deleted after <strong>1 minute</strong> if no one joins. 
              This keeps the platform clean and active!
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}