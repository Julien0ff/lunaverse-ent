'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

interface NotificationToastProps {
  senderName: string
  message: string
  avatarUrl?: string
  onClose: () => void
}

export default function NotificationToast({ senderName, message, avatarUrl, onClose }: NotificationToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    const autoClose = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 500)
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoClose)
    }
  }, [onClose])

  return (
    <div className={clsx(
      "fixed top-4 right-4 z-[9999] w-80 bg-[#1e1f22] border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 transform",
      visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    )}>
      <div className="p-4 flex gap-3">
        <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0 ring-2 ring-discord-blurple/20">
          <Image 
            src={avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
            alt="" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="font-black text-sm text-white truncate">Nouveau Message</p>
            <button onClick={() => { setVisible(false); setTimeout(onClose, 500) }} className="text-discord-muted hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs font-bold text-discord-blurple mb-1">{senderName}</p>
          <p className="text-xs text-discord-muted truncate line-clamp-1">{message}</p>
        </div>
      </div>
      <div className="h-1 bg-discord-blurple/20 w-full overflow-hidden rounded-b-2xl">
        <div className="h-full bg-discord-blurple animate-progress" style={{ animationDuration: '5s' }} />
      </div>
    </div>
  )
}
