"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/neon-button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, User, Chrome, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Trim whitespace from all inputs
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedPassword = password.trim()
      const trimmedUsername = username.trim()

      // Basic validation
      if (!trimmedEmail || !trimmedPassword) {
        throw new Error('Email and password are required')
      }

      if (!isLogin && !trimmedUsername) {
        throw new Error('Username is required for registration')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address')
      }

      // Validate password length
      if (trimmedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        })
        
        if (error) throw error
        
        if (data.user) {
          setSuccess('Successfully signed in!')
        }
      } else {
        // For signup, try to create the user
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              username: trimmedUsername,
            },
          },
        })
        
        if (error) throw error
        
        if (data.user) {
          // Check if the user was immediately confirmed (email confirmation disabled)
          if (data.user.email_confirmed_at || data.session) {
            setSuccess('Account created successfully! You are now signed in.')
          } else {
            // Email confirmation is required
            setSuccess('Account created! Please check your email to confirm your account.')
            setIsLogin(true)
          }
        } else {
          throw new Error('Failed to create account. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      
      // Handle specific error messages
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error?.message) {
        const message = error.message.toLowerCase()
        
        if (message.includes('email address') && message.includes('invalid')) {
          errorMessage = 'This email address is not allowed. Please try a different email or contact support.'
        } else if (message.includes('email_address_invalid')) {
          errorMessage = 'This email address is not allowed. Please try a different email or contact support.'
        } else if (message.includes('invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (message.includes('user already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.'
          setIsLogin(true)
        } else if (message.includes('password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else if (message.includes('signup is disabled')) {
          errorMessage = 'Account registration is currently disabled. Please contact support.'
        } else if (message.includes('email and password are required')) {
          errorMessage = 'Please fill in all required fields.'
        } else if (message.includes('username is required')) {
          errorMessage = 'Please enter a username.'
        } else if (message.includes('please enter a valid email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (message.includes('password must be at least')) {
          errorMessage = 'Password must be at least 6 characters long.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/lobby`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Google auth error:', error)
      setError('Google authentication failed. Please try again or use email/password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Join NeonChat'}
          </h2>
          <p className="text-gray-400 mt-2">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start space-x-3"
          >
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-sm leading-relaxed">{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-black/20 border-gray-600 text-white placeholder-gray-400"
                  required
                  minLength={2}
                  maxLength={30}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-black/20 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/20 border-gray-600 text-white placeholder-gray-400"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-400">Password must be at least 6 characters long</p>
            )}
          </div>

          <NeonButton
            type="submit"
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </NeonButton>
        </form>

        <div className="relative">
          <Separator className="bg-gray-600" />
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2">
            <span className="text-gray-400 text-sm">or</span>
          </div>
        </div>

        <NeonButton
          variant="secondary"
          className="w-full"
          size="lg"
          onClick={handleGoogleAuth}
          isLoading={loading}
        >
          <Chrome className="w-5 h-5 mr-2" />
          Continue with Google
        </NeonButton>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
              setSuccess(null)
              setEmail('')
              setPassword('')
              setUsername('')
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
            disabled={loading}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </GlassCard>
  )
}