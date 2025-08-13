'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiService } from '@/lib/api-service'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      // OAuth user from NextAuth
      setUser(session.user)
      setLoading(false)
    } else {
      // Check for JWT token user
      const token = apiService.getToken()
      const storedUser = apiService.getUser()
      
      if (token && storedUser) {
        setUser(storedUser)
      }
      setLoading(false)
    }
  }, [session, status])

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials)
      setUser(response.user)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user even if API call fails
      setUser(null)
    }
  }

  const register = async (userData) => {
    return await apiService.register(userData)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    if (!session) {
      // Only update localStorage if not OAuth user
      apiService.setUser(updatedUser)
    }
  }

  const isAuthenticated = () => {
    return !!user
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const isVerified = () => {
    return user?.verified === true
  }

  const isApproved = () => {
    return user?.approved === true
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated,
    hasRole,
    isVerified,
    isApproved,
    // OAuth specific
    session,
    isOAuthUser: !!session,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
