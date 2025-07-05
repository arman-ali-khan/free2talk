"use client"

import { motion } from 'framer-motion'
import { Mic, Users, Clock, Zap } from 'lucide-react'

export function HeroSection() {
  return (
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
          Join audio-only chat rooms organized by language. Rooms auto-delete after 1 minute if no one joins.
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
            <span>Auto-Delete</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Real-time</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}