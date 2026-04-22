'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import {
  Globe, Send, MessageSquare, Heart, Bold, Italic,
  Underline, Strikethrough, Code, Quote, Paperclip,
  X, Film, Image as ImageIcon
} from 'lucide-react'
import clsx from 'clsx'

interface Post {
  id: string
  content: string
  created: string
  expand: {
    user: {
      username: string
      avatar_url: string | null
    }
  }
  likes_count: number
  is_liked: boolean
  image_url?: string | null
  comments_count?: number
}

interface Comment {
  id: string
  content: string
  created_at: string
  expand: {
    user: {
      username: string
      avatar_url: string | null
    }
  }
}

/* ─── Discord-style markdown renderer ─────────────────────── */
function renderMarkdown(text: string): string {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>')
    // Underline: __text__
    .replace(/__(.*?)__/g, '<u>$1</u>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="discord-code">$1</code>')
    // Blockquote: > text
    .replace(/^&gt;\s(.+)/gm, '<blockquote class="discord-quote">$1</blockquote>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

/* ─── Format toolbar button ────────────────────────────────── */
function ToolbarBtn({
  onClick, title, children, active = false
}: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm',
        active
          ? 'bg-discord-blurple/30 text-discord-blurple'
          : 'text-discord-muted hover:bg-white/8 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

export default function SocialPage() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [preview, setPreview] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Create supabase client for browser
  const { supabase } = useAuth()

  /* ─── Fetch posts ──────────────────────────────────────── */
  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/social/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [])

  /* ─── Insert markdown syntax into textarea ─────────────── */
  const insertMarkdown = (prefix: string, suffix = prefix) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}texte${suffix}`
    const newContent = content.slice(0, start) + replacement + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      const cursor = start + prefix.length + (selected ? selected.length : 5)
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const insertBlock = (prefix: string) => {
    const lines = content.split('\n')
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    let charCount = 0
    let lineIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= pos) { lineIndex = i; break }
      charCount += lines[i].length + 1
    }
    lines[lineIndex] = `${prefix} ${lines[lineIndex]}`
    setContent(lines.join('\n'))
  }

  /* ─── File attachments ─────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files].slice(0, 4)) // max 4
  }
  const removeAttachment = (i: number) =>
    setAttachments(prev => prev.filter((_, idx) => idx !== i))

  /* ─── Submit post ──────────────────────────────────────── */
  const handlePost = async () => {
    if (!content.trim() || posting || uploading) return
    setPosting(true)
    
    let image_url = null
    try {
      // 1. Upload first attachment if exists (simpler social version)
      if (attachments.length > 0) {
        setUploading(true)
        const file = attachments[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${profile?.id}/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, file)

        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)
          
        image_url = publicUrl
      }

      // 2. Submit post
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim(),
          image_url: image_url
        }),
      })
      if (res.ok) {
        setContent('')
        setAttachments([])
        setPreview(false)
        await fetchPosts()
      }
    } catch (err) {
      console.error('Error post creation:', err)
      alert('Erreur lors de la création du post.')
    } finally {
      setPosting(false)
      setUploading(false)
    }
  }

  /* ─── Like post ────────────────────────────────────────── */
  const handleLike = async (postId: string) => {
    // Find previous state
    const post = posts.find(p => p.id === postId)
    if (!post) return
    const action = post.is_liked ? 'unlike' : 'like'

    // Optimistic cache update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, is_liked: !p.is_liked, likes_count: p.likes_count + (p.is_liked ? -1 : 1) }
        : p
    ))
    
    // Call the API to persist
    try {
      const res = await fetch('/api/social/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, action }),
      })
      if (!res.ok) {
        // Revert on error
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, is_liked: !p.is_liked, likes_count: p.likes_count + (p.is_liked ? -1 : 1) }
            : p
        ))
      }
    } catch (err) {
      console.error('Erreur lors du like:', err)
      // Revert on error
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, is_liked: !p.is_liked, likes_count: p.likes_count + (p.is_liked ? -1 : 1) }
          : p
      ))
    }
  }

  /* ─── Comments ────────────────────────────────────────── */
  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/comments?post_id=${postId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(prev => ({ ...prev, [postId]: data.items }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleComments = (postId: string) => {
    if (commentingPostId === postId) {
      setCommentingPostId(null)
    } else {
      setCommentingPostId(postId)
      if (!comments[postId]) {
        fetchComments(postId)
      }
    }
  }

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return
    try {
      const res = await fetch('/api/social/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }))
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, comments_count: (p.comments_count || 0) + 1 } 
            : p
        ))
        setNewComment('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const charCount = content.length
  const maxChars = 2000

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-slideIn">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Globe className="w-10 h-10 text-discord-blurple" />
          Réseau Social
        </h1>
        <p className="text-discord-muted mt-1 font-medium">
          Exprimez-vous et connectez-vous avec la communauté.
        </p>
      </div>

      {/* ── Post editor ──────────────────────────────────────── */}
      <div className="glass-card animate-fadeIn space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative rounded-full overflow-hidden ring-2 ring-discord-blurple/25 flex-shrink-0">
            <Image
              src={profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={profile?.username || 'Moi'}
              fill className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{(profile as any)?.nickname_rp || profile?.username || 'Vous'}</p>
            <p className="text-[11px] text-discord-muted">Partager quelque chose…</p>
          </div>
          {/* Preview toggle */}
          <button
            onClick={() => setPreview(v => !v)}
            className={clsx(
              'ml-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-all',
              preview ? 'bg-discord-blurple/20 text-discord-blurple' : 'bg-white/5 text-discord-muted hover:text-white'
            )}
          >
            {preview ? 'Éditer' : 'Aperçu'}
          </button>
        </div>

        {/* Formatting toolbar */}
        {!preview && (
          <div className="flex items-center gap-1 px-1 py-1.5 bg-white/3 border border-white/6 rounded-xl flex-wrap">
            <ToolbarBtn onClick={() => insertMarkdown('**')} title="Gras (Ctrl+B)">
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertMarkdown('*')} title="Italique (Ctrl+I)">
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertMarkdown('__')} title="Souligné">
              <Underline className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertMarkdown('~~')} title="Barré">
              <Strikethrough className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <ToolbarBtn onClick={() => insertMarkdown('`', '`')} title="Code en ligne">
              <Code className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => insertBlock('>')} title="Citation (blockquote)">
              <Quote className="w-4 h-4" />
            </ToolbarBtn>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Pièce jointe">
              <Paperclip className="w-4 h-4" />
            </ToolbarBtn>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Editor / Preview */}
        {preview ? (
          <div
            className="min-h-[100px] p-3 rounded-xl bg-white/3 border border-white/6 text-white text-sm leading-relaxed discord-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '_Rien à prévisualiser_') }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value.slice(0, maxChars))}
            placeholder={`Quoi de neuf${(profile as any)?.nickname_rp || profile?.username ? ', ' + ((profile as any)?.nickname_rp || profile?.username) : ''} ?`}
            className="glass-input"
            rows={4}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handlePost()
              if (e.key === 'b' && e.ctrlKey) { e.preventDefault(); insertMarkdown('**') }
              if (e.key === 'i' && e.ctrlKey) { e.preventDefault(); insertMarkdown('*') }
            }}
          />
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <div key={i} className="relative flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/8 rounded-xl text-xs text-discord-muted">
                {file.type.startsWith('image') ? <ImageIcon className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-discord-error hover:text-red-400 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <span className={clsx('text-xs font-mono', charCount > maxChars * 0.9 ? 'text-discord-warning' : 'text-discord-muted')}>
            {charCount} / {maxChars}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-discord-muted hidden sm:block">Ctrl+Enter pour publier</span>
            <button
              onClick={handlePost}
              disabled={!content.trim() || posting}
              className="btn btn-primary px-5"
              id="post-submit-btn"
            >
              {posting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Publier</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Feed ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="post-card animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/8" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 bg-white/8 rounded" />
                    <div className="h-2.5 w-20 bg-white/8 rounded" />
                  </div>
                </div>
                <div className="h-4 bg-white/8 rounded w-full" />
                <div className="h-4 bg-white/8 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-white font-bold">Aucun post pour le moment</p>
            <p className="text-discord-muted text-sm mt-1">Soyez le premier à publier !</p>
          </div>
        )}

        {posts.map((post, i) => (
          <div
            key={post.id}
            className="post-card animate-fadeIn"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Post header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 relative rounded-full overflow-hidden ring-2 ring-discord-blurple/20 flex-shrink-0">
                <Image
                  src={post.expand.user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={post.expand.user.username}
                  fill className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{(post.expand.user as any).rp_name || post.expand.user.username}</p>
                <p className="text-[11px] text-discord-muted">
                  {new Date(post.created).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Post content — rendered markdown */}
            <div
              className="text-white text-sm leading-relaxed discord-content mb-4"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />

            {/* Post Image */}
            {post.image_url && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group-hover:border-discord-blurple/30 transition-colors">
                <Image
                  src={post.image_url}
                  alt="Post attachment"
                  fill
                  className="object-contain bg-black/20"
                  unoptimized // Storage URLs might need this or proper domains in next.config
                />
              </div>
            )}

            {/* Like / Comment */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/6">
              <button
                onClick={() => handleLike(post.id)}
                className={clsx(
                  'flex items-center gap-1.5 text-sm font-semibold transition-all',
                  post.is_liked ? 'text-pink-400' : 'text-discord-muted hover:text-pink-400'
                )}
              >
                <Heart className={clsx('w-4 h-4 transition-transform', post.is_liked && 'fill-current scale-110')} />
                {post.likes_count > 0 && <span>{post.likes_count}</span>}
                J&apos;aime
              </button>
              <button 
                onClick={() => toggleComments(post.id)}
                className={clsx(
                  "flex items-center gap-1.5 text-sm font-semibold transition-colors",
                  commentingPostId === post.id ? "text-white" : "text-discord-muted hover:text-white"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                {(post.comments_count ?? 0) > 0 && <span>{post.comments_count}</span>}
                Commenter
              </button>
            </div>

            {/* Comments Section */}
            {commentingPostId === post.id && (
              <div className="mt-4 pt-4 border-t border-white/6 animate-fadeIn space-y-4">
                {/* Comment list */}
                <div className="space-y-4">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={comment.expand.user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={comment.expand.user.username}
                          fill className="object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{comment.expand.user.username}</span>
                          <span className="text-[10px] text-discord-muted">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-discord-muted leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!comments[post.id] || comments[post.id].length === 0) && (
                    <p className="text-center text-xs text-discord-muted py-2 italic">Aucun commentaire pour le moment.</p>
                  )}
                </div>

                {/* Comment input */}
                <div className="flex gap-3 items-center pt-2">
                  <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt="Moi"
                      fill className="object-cover"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="glass-input !py-2 !text-sm pr-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleComment(post.id)
                      }}
                    />
                    <button 
                      onClick={() => handleComment(post.id)}
                      disabled={!newComment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-discord-blurple hover:text-white disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
