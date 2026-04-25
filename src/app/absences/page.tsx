'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Calendar, Clock, FileText, Send, AlertCircle, CheckCircle2, XCircle, Plus, Paperclip, Shield } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

export default function AbsencesPage() {
  const { profile, roles } = useAuth()
  const isAdmin = roles.some(r => r.name === 'admin')
  const [activeTab, setActiveTab] = useState<'declare' | 'history' | 'admin'>('declare')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('')
  const [attachments, setAttachments] = useState('')
  const [absences, setAbsences] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (profile) loadAbsences()
  }, [profile])

  const loadAbsences = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/absences')
      const data = await res.json()
      if (data.items) setAbsences(data.items)
    } catch (e) {}
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !duration) return
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, duration, attachments })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Demande d\'absence envoyée avec succès.' })
        setReason('')
        setDuration('')
        setAttachments('')
        loadAbsences()
        setActiveTab('history')
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    }
    setSubmitting(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-5 h-5 text-discord-success" />
      case 'refused': return <XCircle className="w-5 h-5 text-discord-error" />
      default: return <Clock className="w-5 h-5 text-discord-warning" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Validée'
      case 'refused': return 'Refusée'
      default: return 'En attente'
    }
  }

  return (
    <div className="page-container">
      <div className="animate-slideIn mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
          <Calendar className="text-discord-blurple w-10 h-10" />
          Absences
        </h1>
        <p className="text-discord-muted mt-2">Déclarez vos absences et suivez leur statut.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-2 space-y-1">
            <button
              onClick={() => setActiveTab('declare')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                activeTab === 'declare' ? "bg-discord-blurple text-white shadow-lg" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Plus className="w-5 h-5" />
              Déclarer une absence
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                activeTab === 'history' ? "bg-white/10 text-white" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Clock className="w-5 h-5" />
              Mes Absences ({absences.filter(a => a.user_id === profile?.id).length})
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'admin' ? "bg-discord-error/20 text-white border border-discord-error/30 shadow-lg" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Shield className="w-5 h-5 text-discord-error" />
                Dossiers ENT ({absences.length})
              </button>
            )}
          </div>

          <div className="glass-card p-6 bg-discord-blurple/5 border-discord-blurple/20">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-discord-blurple" />
              Rappel Important
            </h3>
            <p className="text-xs text-discord-muted leading-relaxed">
              Toute absence doit être justifiée dans les 48h. Les pièces jointes (certificats médicaux, etc.) peuvent être ajoutées via un lien URL ou une description.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          {activeTab === 'declare' ? (
            <div className="glass-card animate-fadeIn">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-discord-blurple" />
                Nouveau dossier d&apos;absence
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em] mb-2 block">Motif de l&apos;absence *</label>
                    <textarea
                      placeholder="Ex: Rendez-vous médical, raison familiale, maladie..."
                      className="glass-input w-full min-h-[100px] py-4"
                      required
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em] mb-2 block">Durée prévue *</label>
                    <input
                      type="text"
                      placeholder="Ex: 1 jour, Matinée, du 12 au 14 oct..."
                      className="glass-input"
                      required
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em] mb-2 block">Pièces jointes / Justificatif (Optionnel)</label>
                    <div className="relative">
                      <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
                      <input
                        type="text"
                        placeholder="Lien vers le document ou description..."
                        className="glass-input !pl-10"
                        value={attachments}
                        onChange={e => setAttachments(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={clsx(
                    "p-4 rounded-xl text-sm font-bold animate-fadeIn flex items-center gap-3",
                    message.type === 'success' ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-discord-blurple/20 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  {submitting ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-fadeIn space-y-4">
              {loading ? (
                <div className="text-center p-12"><div className="w-8 h-8 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : absences.length === 0 ? (
                <div className="glass-card text-center p-12 opacity-50">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-discord-muted" />
                  <p className="font-bold text-discord-muted">Aucune absence enregistrée.</p>
                </div>
              ) : (
                absences
                  .filter(abs => activeTab === 'admin' || abs.user_id === profile?.id)
                  .map((abs) => (
                  <div key={abs.id} className="glass-card group hover:border-white/10 transition-colors p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                          abs.status === 'accepted' ? "bg-discord-success/20 text-discord-success" :
                          abs.status === 'refused' ? "bg-discord-error/20 text-discord-error" :
                          "bg-discord-warning/20 text-discord-warning"
                        )}>
                          {getStatusIcon(abs.status)}
                        </div>
                        <div>
                          {activeTab === 'admin' && abs.profile && (
                            <div className="flex items-center gap-2 mb-2 bg-white/5 px-2 py-1 rounded-lg w-fit border border-white/5">
                               <div className="w-4 h-4 rounded-full overflow-hidden relative">
                                  <Image src={abs.profile.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" />
                               </div>
                               <span className="text-[10px] font-black text-discord-blurple uppercase tracking-widest">{abs.profile.nickname_rp || abs.profile.username}</span>
                            </div>
                          )}
                          <p className="text-white font-bold text-lg mb-1">{abs.reason}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black text-discord-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {abs.duration}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(abs.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={clsx(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          abs.status === 'accepted' ? "bg-discord-success/10 text-discord-success border-discord-success/20" :
                          abs.status === 'refused' ? "bg-discord-error/10 text-discord-error border-discord-error/20" :
                          "bg-discord-warning/10 text-discord-warning border-discord-warning/20"
                        )}>
                          {getStatusText(abs.status)}
                        </span>
                      </div>
                    </div>
                    {abs.attachments && (
                      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-discord-muted" />
                        <p className="text-xs text-discord-muted truncate">PJ : {abs.attachments}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
