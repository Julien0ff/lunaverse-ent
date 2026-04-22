'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'money'
  read: boolean
  link?: string
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
  addToast: (title: string, message: string, type?: Notification['type'], link?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Notification[]>([])
  const soundRef = useRef<HTMLAudioElement | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const playNotificationSound = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.volume = 0.4
      soundRef.current.play().catch(() => null)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotifications(data)
    }
  }, [])

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }
  }

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  const addToast = useCallback((title: string, message: string, type: Notification['type'] = 'info', link?: string) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Notification = {
      id, title, message, type, read: false, link, created_at: new Date().toISOString()
    }
    setToasts(prev => [...prev, newToast])
    playNotificationSound()
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [playNotificationSound])

  useEffect(() => {
    let channel: any

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await fetchNotifications()

      channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload: { new: Notification }) => {
          const newNotif = payload.new
          setNotifications(prev => [newNotif, ...prev])
          addToast(newNotif.title, newNotif.message, newNotif.type, newNotif.link)
        })
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchNotifications, addToast])

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      deleteNotification, 
      refresh: fetchNotifications,
      addToast 
    }}>
      <audio ref={soundRef} src="/sounds/notification.mp3" preload="auto" />
      {children}
      
      {/* Toast Overlay */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="w-80 glass-card !p-4 flex gap-3 animate-slideInRight pointer-events-auto cursor-pointer hover:scale-102 transition-transform"
            onClick={() => toast.link && (window.location.href = toast.link)}
          >
            <div className={`w-2 h-10 rounded-full flex-shrink-0 ${
              toast.type === 'success' ? 'bg-discord-success' :
              toast.type === 'error' ? 'bg-discord-error' :
              toast.type === 'money' ? 'bg-amber-400' : 'bg-discord-blurple'
            }`} />
            <div>
              <p className="font-black text-sm text-white">{toast.title}</p>
              <p className="text-xs text-discord-muted line-clamp-2">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
