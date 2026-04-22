'use client'

import React, { useState } from 'react'
import { Bell, X, Trash2, Check, ExternalLink, Inbox } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
import clsx from 'clsx'

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-discord-muted hover:text-white hover:bg-white/10 transition-all group"
      >
        <Bell className={clsx("w-5 h-5", unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-discord-error text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-[#1e1f22]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="fixed inset-0 md:absolute md:top-12 md:left-0 w-full md:w-80 h-full md:h-auto max-h-screen md:max-h-[80vh] overflow-hidden glass-card md:rounded-2xl !p-0 z-[101] animate-scaleIn md:animate-fadeIn shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-discord-blurple" /> {t('nav.notifications_center') || 'Centre de Notifications'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-discord-muted hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-discord-muted">
                    <Inbox size={24} />
                  </div>
                  <p className="text-sm font-bold text-discord-muted">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={clsx(
                        "p-4 transition-colors relative group",
                        notif.read ? "opacity-60" : "bg-discord-blurple/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          notif.type === 'success' ? 'bg-discord-success' :
                          notif.type === 'error' ? 'bg-discord-error' :
                          notif.type === 'money' ? 'bg-amber-400' : 'bg-discord-blurple'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white mb-0.5">{notif.title}</p>
                          <p className="text-xs text-discord-muted leading-relaxed line-clamp-3">{notif.message}</p>
                          <p className="text-[10px] text-discord-muted/50 mt-2">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                          
                          {notif.link && (
                            <button 
                              onClick={() => window.location.href = notif.link!}
                              className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-discord-blurple hover:underline"
                            >
                              <ExternalLink size={10} /> Voir les détails
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                            className="p-1.5 rounded-lg bg-white/5 text-discord-success hover:bg-discord-success/20 transition-all"
                            title="Marquer comme lu"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                          className="p-1.5 rounded-lg bg-white/5 text-discord-error hover:bg-discord-error/20 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 bg-white/3 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-discord-muted hover:text-white uppercase tracking-widest"
              >
                Fermer le centre
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
