"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { apiClient, type User, type LoginRequest } from "@/lib/api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token')
    if (token) {
      // In a real app, you'd validate the token with the backend
      // For now, we'll assume it's valid
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await apiClient.login(credentials.username, credentials.password)
      if (!response.access_token) {
        throw new Error("Login failed: No access token returned")
      }
      localStorage.setItem('auth_token', response.access_token)
      setUser(response.user)
      console.log("setUser called with:", response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    try {
      const user = await apiClient.register(userData)
      // Auto-login after registration
      await login({ username: userData.email, password: userData.password })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  // Only check localStorage on the client side to avoid hydration mismatch
  const getAuthToken = () => {
    if (!isClient) return null
    return localStorage.getItem('auth_token')
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user || !!getAuthToken(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
