"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={cn(
        "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6",
        "shadow-xl shadow-black/20 relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100",
        "before:transition-opacity before:duration-300",
        className
      )}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}