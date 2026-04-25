'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import {
  MessageCircle, Users, Search, Send,
  UserPlus, Check, X, Clock, AlertCircle, ChevronLeft, ChevronRight, Paperclip
} from 'lucide-react'
import clsx from 'clsx'

// ── Types ───────────────────────────────────────────────────
interface Friend {
  id: string
  status: 'pending' | 'accepted'
  friend_id: string
  username: string
  avatar_url: string | null
  discord_status?: string
  is_initiator: boolean
  created_at: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: { username: string; avatar_url: string | null }
  receiver?: { username: string; avatar_url: string | null }
}

export default function MessagesPage() {
  const { profile, supabase, refreshProfile } = useAuth()
  const searchParams = useSearchParams()
  const chatWith = searchParams.get('chat')
  
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat')
  const [friends, setFriends] = useState<Friend[]>([])
  
  // Chats states
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Friends states
  const [addFriendInput, setAddFriendInput] = useState('')
  const [userSuggestions, setUserSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Initialization ─────────────────────────────────────────
  useEffect(() => {
    if (profile) loadFriends()
  }, [profile, refreshProfile])

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.friend_id)
      const interval = setInterval(() => loadMessages(selectedFriend.friend_id, true), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedFriend])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Autocomplete Search ─────────────────────────────────────
  useEffect(() => {
    if (!addFriendInput.trim() || addFriendInput.length < 2) {
      setUserSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bank/search-users?q=${encodeURIComponent(addFriendInput)}`)
        if (res.ok) {
          const data = await res.json()
          setUserSuggestions(data.users || [])
        }
      } catch (e) {}
    }, 300)
    return () => clearTimeout(timer)
  }, [addFriendInput])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-friend-search]')) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Friends API ────────────────────────────────────────────
  const loadFriends = async () => {
    const res = await fetch('/api/friends')
    if (res.ok) {
      const data = await res.json()
      setFriends(data.friends || [])
      
      // Handle auto-select from query param
      if (chatWith) {
        const friend = data.friends.find((f: any) => f.username === chatWith)
        if (friend) {
          setSelectedFriend(friend)
          setActiveTab('chat')
        }
      }
    }
  }

  const handleFriendAction = async (action: 'add' | 'accept' | 'reject' | 'remove', targetId?: string) => {
    const payload: any = { action }
    if (action === 'add') {
      if (targetId) {
        payload.target_id = targetId
      } else {
        if (!addFriendInput.trim()) return
        payload.target_username = addFriendInput.trim()
      }
      setAddFriendInput('')
      setShowSuggestions(false)
    } else {
      payload.target_id = targetId
    }

    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (res.ok) {
      showToast('success', action === 'add' ? 'Demande envoyée' : 'Action effectuée')
      setAddFriendInput('')
      loadFriends()
    } else {
      showToast('error', data.error || 'Erreur')
    }
  }

  // ── Messages API ───────────────────────────────────────────
  const loadMessages = async (friendId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true)
    const res = await fetch(`/api/messages?friend_id=${friendId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => {
        if (prev.length !== data.messages.length) return data.messages;
        if (prev.length > 0 && data.messages.length > 0 && prev[prev.length - 1].id !== data.messages[data.messages.length - 1].id) {
          return data.messages
        }
        return prev;
      })
    }
    if (!silent) setLoadingMsgs(false)
  }

  const sendMessage = async (e?: React.FormEvent, directContent?: string) => {
    if (e) e.preventDefault()
    const content = directContent || msgInput.trim()
    if (!content || !selectedFriend) return
    if (!directContent) setMsgInput('')

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: selectedFriend.friend_id, content })
    })
    
    if (res.ok) {
      loadMessages(selectedFriend.friend_id, true)
    } else {
      const data = await res.json()
      showToast('error', data.error || 'Erreur d\'envoi')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedFriend || !profile) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      const { data, error } = await (supabase as any).storage
        .from('chat-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = (supabase as any).storage
        .from('chat-images')
        .getPublicUrl(filePath)

      await sendMessage(undefined, publicUrl)
      showToast('success', 'Image envoyée')
    } catch (err: any) {
      showToast('error', 'Erreur d\'upload : ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Computed ───────────────────────────────────────────────
  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const pendingRequests = friends.filter(f => f.status === 'pending' && !f.is_initiator)
  const sentRequests = friends.filter(f => f.status === 'pending' && f.is_initiator)

  return (
    <div className="page-container h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] p-0 overflow-hidden shadow-2xl">
      <div className="h-full flex flex-col overflow-hidden bg-[#313338]">
        
        {/* ── Toasts ──────────────────────────────────────── */}
        {toast && (
          <div className={clsx(
            'fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold shadow-2xl border animate-scaleIn',
            toast.type === 'success' ? 'bg-discord-success/15 text-discord-success border-discord-success/25' : 'bg-discord-error/15 text-discord-error border-discord-error/25'
          )}>
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.text}
          </div>
        )}

        {/* ── App Layout ──────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden border-t border-white/5 relative">
          
          {/* Left Sidebar (Contacts / Friends) */}
          <div className={clsx(
            "w-full md:w-80 flex flex-col border-r border-white/5 bg-black/20 flex-shrink-0 transition-all duration-300",
            selectedFriend ? "hidden md:flex" : "flex"
          )}>
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-black/10">
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
                <MessageCircle className="w-6 h-6 text-discord-blurple" />
                Messagerie
              </h2>
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={clsx('flex-1 py-1.5 text-xs font-bold rounded-lg transition-all', activeTab === 'chat' ? 'bg-discord-blurple text-white shadow-md' : 'text-discord-muted hover:text-white')}
                >
                  Discussions
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={clsx('flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative', activeTab === 'friends' ? 'bg-discord-blurple text-white shadow-md' : 'text-discord-muted hover:text-white')}
                >
                  Amis
                  {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-discord-error rounded-full ring-2 ring-black" />}
                </button>
              </div>
            </div>

            {/* Conversations Tab */}
            {activeTab === 'chat' && (
              <div className="flex-1 overflow-y-auto outline-none p-2 space-y-1 custom-scrollbar">
                {acceptedFriends.length === 0 && (
                  <div className="text-center p-6 text-discord-muted">
                    <MessageCircle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    <p className="text-sm">Ajoutez des amis pour commencer à discuter.</p>
                  </div>
                )}
                {acceptedFriends.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFriend(f)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent text-left',
                      selectedFriend?.id === f.id ? 'bg-white/10 border-white/10 shadow-lg' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="w-10 h-10 relative rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0 bg-discord-dark">
                      <Image src={f.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={f.username} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{f.username}</p>
                      <p className="text-[10px] text-discord-muted truncate">Cliquer pour discuter</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                <div className="relative" data-friend-search>
                  <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 px-1">Ajouter un ami</h3>
                  <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                    <input
                      type="text"
                      placeholder="Pseudo ou identité RP..."
                      className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none min-w-0"
                      value={addFriendInput}
                      onChange={e => {
                        setAddFriendInput(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <button onClick={() => handleFriendAction('add')} className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-discord-blurple rounded-lg text-white hover:bg-discord-blurple-dark transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>

                  {showSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-discord-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto flex flex-col custom-scrollbar">
                      {userSuggestions.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleFriendAction('add', u.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
                        >
                          <Image src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} width={24} height={24} alt="" className="rounded-full flex-shrink-0" />
                          <span className="font-bold text-white truncate">{u.nickname_rp || u.username}</span>
                          <span className="text-xs text-discord-muted ml-auto font-mono">{u.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {pendingRequests.length > 0 && (
                  <div className="animate-scaleIn">
                    <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-discord-warning" /> En attente ({pendingRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingRequests.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-discord-warning/10 border border-discord-warning/20 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <Image src={r.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} width={24} height={24} alt="" className="rounded-full flex-shrink-0" />
                            <span className="text-xs font-bold text-white truncate">{r.username}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => handleFriendAction('accept', r.friend_id)} className="w-6 h-6 flex items-center justify-center bg-discord-success/20 text-discord-success rounded-md hover:bg-discord-success/40 transition-colors"><Check className="w-3 h-3" /></button>
                            <button onClick={() => handleFriendAction('reject', r.friend_id)} className="w-6 h-6 flex items-center justify-center bg-discord-error/20 text-discord-error rounded-md hover:bg-discord-error/40 transition-colors"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Mes Amis ({acceptedFriends.length})
                  </h3>
                  <div className="space-y-1 mt-2">
                    {acceptedFriends.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <Image src={f.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} width={28} height={28} alt="" className="rounded-full flex-shrink-0" />
                          <span className="text-sm font-bold text-white truncate">{f.username}</span>
                        </div>
                        <button onClick={() => handleFriendAction('remove', f.friend_id)} className="w-6 h-6 flex items-center justify-center md:opacity-0 group-hover:opacity-100 hover:bg-discord-error/20 text-discord-error rounded-md transition-colors" title="Retirer l'ami"><X className="w-3.5 h-3.5 flex-shrink-0" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane (Chat Area) */}
          <div className={clsx(
            "flex-1 flex flex-col relative bg-black/40 transition-all duration-300",
            !selectedFriend ? "hidden md:flex" : "flex"
          )}>
            {activeTab !== 'chat' || !selectedFriend ? (
              <div className="flex-1 flex flex-col items-center justify-center text-discord-muted animate-fadeIn p-6 text-center">
                <MessageCircle className="w-16 h-16 opacity-10 mb-4" />
                <p className="font-bold text-lg text-white">Vos messages</p>
                <p className="text-sm">Sélectionnez un ami pour commencer à parler.</p>
              </div>
            ) : (
              <>
                <div className="h-16 flex items-center gap-3 px-4 sm:px-6 bg-discord-darker/60 backdrop-blur-md border-b border-white/5 flex-shrink-0 z-10 shadow-lg">
                  <button 
                    onClick={() => setSelectedFriend(null)}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors mr-1"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="w-10 h-10 relative rounded-full overflow-hidden ring-2 ring-discord-blurple/30 flex-shrink-0 shadow-lg">
                    <Image src={selectedFriend.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={selectedFriend.username} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-white tracking-tight truncate leading-none mb-1">{selectedFriend.username}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-discord-success shadow-[0_0_8px_rgba(87,242,135,0.5)]" />
                      <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">En ligne</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 custom-scrollbar">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-discord-blurple border-t-white rounded-full animate-spin" /></div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-discord-muted font-black animate-scaleIn">
                      <span className="text-4xl block mb-2">👋</span>
                      Dites bonjour à {selectedFriend.username} !
                    </div>
                  ) : (
                    messages.map((m, i) => {
                      const isMe = m.sender_id === profile?.id;
                      const prevDiff = i > 0 && messages[i - 1].sender_id === m.sender_id;
                      
                      return (
                        <div key={m.id} className={clsx('flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[75%] animate-slideUp', isMe ? 'ml-auto flex-row-reverse' : '')} style={{ animationDelay: `${i * 10}ms` }}>
                          {!prevDiff ? (
                             <div className="w-8 h-8 sm:w-9 sm:h-9 relative rounded-full overflow-hidden flex-shrink-0 mt-auto ring-2 ring-white/5 shadow-xl transition-transform hover:scale-110">
                               <Image src={isMe ? profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png' : selectedFriend.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" fill className="object-cover" />
                             </div>
                          ) : <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />}

                          <div className={clsx('flex flex-col min-w-0 group', isMe ? 'items-end' : 'items-start')}>
                            {!prevDiff && <span className="text-[9px] font-black text-discord-muted uppercase tracking-[0.2em] mb-1.5 px-2">
                              {isMe ? 'Vous' : selectedFriend.username} • {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>}
                            <div className={clsx(
                              'px-4 py-2.5 rounded-2xl text-[13px] font-medium shadow-lg break-words max-w-full border transition-all hover:brightness-110',
                              isMe 
                                ? 'bg-gradient-to-br from-discord-blurple to-[#4752c4] text-white rounded-br-sm border-white/10 shadow-discord-blurple/20' 
                                : 'bg-white/10 text-white rounded-bl-sm border-white/5 backdrop-blur-sm'
                            )}>
                              {m.content.startsWith('http') && m.content.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                                 <img 
                                   src={m.content} 
                                   alt="Image" 
                                   className="max-w-full rounded-xl object-contain bg-black/20 cursor-zoom-in hover:scale-[1.01] transition-transform shadow-2xl" 
                                   onClick={() => window.open(m.content, '_blank')}
                                 />
                              ) : (
                                 m.content
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 sm:p-4 bg-black/60 border-t border-white/5 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <form onSubmit={sendMessage} className="flex items-center gap-2 sm:gap-3 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:border-discord-blurple/50 focus-within:bg-white/10 transition-all relative">
                    <button 
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-discord-muted hover:text-white transition-colors"
                    >
                      {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      placeholder={window.innerWidth < 640 ? "Message..." : `Envoyer un message à @${selectedFriend.username}...`}
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-discord-muted text-sm px-1 py-1 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!msgInput.trim() || uploading}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-discord-blurple hover:bg-discord-blurple-dark text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
