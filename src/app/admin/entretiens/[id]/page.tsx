'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Save, Search, User, Check, X, Clock, BrainCircuit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { useLanguage } from '@/context/LanguageContext'

export default function EntretienDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()

  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Channels for Phase 1 planning
  const [vocalChannels, setVocalChannels] = useState<any[]>([])

  const id = params?.id as string

  useEffect(() => {
    fetch(`/api/admin/interviews/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.interview) {
          setInterview(data.interview)
        }
      })
      .finally(() => setLoading(false))
      
    // Fetch voice channels for scheduling
    fetch('/api/discord/channels')
      .then(res => res.json())
      .then(data => {
        if (data.channels) {
          setVocalChannels(data.channels)
        }
      })
      .catch(console.error)
  }, [id])

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 3) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/discord/members?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.members || [])
    } catch (e) {
      console.error(e)
    } finally {
      setSearching(false)
    }
  }

  const selectCandidate = (member: any) => {
    const username = member.user?.global_name || member.user?.username
    setInterview((prev: any) => ({
      ...prev,
      candidate_discord_id: member.user.id,
      // Just a default split for RP name, can be edited manually
      rp_firstname: username.split(' ')[0] || username,
      rp_lastname: username.split(' ')[1] || ''
    }))
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSave = async (customUpdates?: any) => {
    setSaving(true)
    const payload = { ...interview, ...customUpdates }
    try {
      const res = await fetch(`/api/admin/interviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        setInterview(data.interview)
        if (customUpdates?.status && customUpdates.status !== 'draft') {
          router.push('/admin/entretiens')
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) return
    try {
      const res = await fetch(`/api/admin/interviews/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/admin/entretiens')
    } catch (e) {
      console.error(e)
    }
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQs = [...(interview.questions_data || [])]
    updatedQs[index] = { ...updatedQs[index], [field]: value }

    // Recalculate interview note
    let totalPoints = 0
    updatedQs.forEach(q => {
      if (q.isGraded && q.note !== null && !isNaN(q.note)) {
        totalPoints += parseFloat(q.note)
      }
    })

    setInterview((prev: any) => ({
      ...prev,
      questions_data: updatedQs,
      interview_note: totalPoints
    }))
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Chargement...</div>
  if (!interview) return <div className="p-20 text-center text-discord-error">Entretien introuvable</div>

  const roleHasQuestions = ['Professeur', 'AED', 'Surveillant'].includes(interview.target_role)

  return (
    <div className="page-container max-w-5xl mx-auto pb-32 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-slideIn">
        <div className="flex items-center gap-4">
          <Link href="/admin/entretiens" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Fiche d'Entretien
              <span className={clsx("text-sm px-3 py-1 rounded-full border uppercase tracking-widest", {
                'text-discord-success border-discord-success/30 bg-discord-success/10': interview.status === 'accepted',
                'text-discord-error border-discord-error/30 bg-discord-error/10': interview.status === 'refused',
                'text-discord-warning border-discord-warning/30 bg-discord-warning/10': interview.status === 'pending',
                'text-discord-muted border-white/10 bg-white/5': interview.status === 'draft'
              })}>
                {interview.status}
              </span>
            </h1>
            <p className="text-discord-muted mt-1 font-medium">Créé le {new Date(interview.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn bg-discord-error/10 text-discord-error hover:bg-discord-error/20 border border-discord-error/30 px-4">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary px-6 shadow-lg shadow-discord-blurple/20">
            <Save className="w-5 h-5" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-card">
            <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-discord-blurple" /> Informations
            </h3>

            {interview.profile && (
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                {interview.profile.avatar_url ? (
                  <img src={interview.profile.avatar_url} alt="" className="w-12 h-12 rounded-full shadow-lg" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-discord-blurple flex items-center justify-center text-xl font-bold shadow-lg">
                    {interview.profile.username?.[0] || '?'}
                  </div>
                )}
                <div>
                  <div className="font-black text-white text-lg">{interview.profile.nickname_rp || interview.profile.username}</div>
                  <div className="text-sm text-discord-muted">@{interview.profile.username}</div>
                </div>
              </div>
            )}

            {/* Candidate Search */}
            <div className="mb-4 relative">
              <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Modifier le membre Discord ciblé</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="glass-input pl-10"
                  placeholder="Rechercher par nom Discord..."
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 p-2 bg-[#1E1F22] rounded-xl border border-white/10 shadow-2xl max-h-60 overflow-y-auto">
                  {searchResults.map((m: any) => (
                    <button
                      key={m.user.id}
                      onClick={() => selectCandidate(m)}
                      className="w-full text-left p-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      {m.user.avatar ? (
                        <img src={`https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-xs font-bold">?</div>
                      )}
                      <div>
                        <div className="font-bold text-white text-sm">{m.user.global_name || m.user.username}</div>
                        <div className="text-xs text-discord-muted">{m.user.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Prénom RP</label>
                <input 
                  type="text" 
                  value={interview.rp_firstname}
                  onChange={e => setInterview({...interview, rp_firstname: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Nom RP</label>
                <input 
                  type="text" 
                  value={interview.rp_lastname}
                  onChange={e => setInterview({...interview, rp_lastname: e.target.value})}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Poste Visé</label>
              <select 
                value={interview.target_role}
                onChange={e => {
                  const newRole = e.target.value
                  setInterview({...interview, target_role: newRole})
                  // Auto-save triggers regeneration of questions if role changed
                  handleSave({ target_role: newRole })
                }}
                className="glass-input appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4RDkyOTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
              >
                <option value="Professeur">Professeur</option>
                <option value="AED">AED (Surveillant)</option>
                <option value="Infirmier">Infirmier</option>
                <option value="Psy">Psychologue</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Date prévue (Optionnel)</label>
                <input 
                  type="datetime-local" 
                  value={interview.scheduled_at ? new Date(new Date(interview.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => setInterview({...interview, scheduled_at: e.target.value})}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-discord-muted uppercase mb-1 block">Salon Vocal (Convocation)</label>
                <select
                  value={interview.vocal_channel_name || ''}
                  onChange={e => setInterview({...interview, vocal_channel_name: e.target.value})}
                  className="glass-input appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4RDkyOTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
                >
                  <option value="">-- Sélectionner un salon vocal --</option>
                  {vocalChannels.map(ch => (
                    <option key={ch.id} value={ch.name}>{ch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content depending on Phase */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* PHASE 1: Dossier (Affiché si Brouillon ou En Attente) */}
          {['draft', 'pending'].includes(interview.status) && (
            <>
              <div className="glass-card mb-6">
                <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-4">Analyse du Dossier (Phase 1)</h3>
                <div className="space-y-4">
                  {interview.questions_data?.filter((q: any) => !q.isOral).map((q: any) => (
                    <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-discord-blurple">{q.category}</span>
                      <div className="font-bold text-white mb-2">{q.question}</div>
                      <div className="text-discord-muted whitespace-pre-wrap text-sm bg-black/20 p-3 rounded-lg border border-white/5">{q.response || 'Non fourni'}</div>
                    </div>
                  ))}
                  {(!interview.questions_data || interview.questions_data.filter((q: any) => !q.isOral).length === 0) && (
                    <div className="text-discord-muted text-center py-4">Aucune donnée de dossier.</div>
                  )}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <label className="text-xs font-bold text-discord-muted uppercase tracking-widest block mb-2">Note de Dossier (/20)</label>
                  <input 
                    type="number"
                    min="0" max="20"
                    value={interview.dossier_note || ''}
                    onChange={e => {
                      const d = parseFloat(e.target.value) || 0
                      const o = parseFloat(interview.interview_note) || 0
                      const g = ((d + (o*2)) / 3).toFixed(2)
                      setInterview({...interview, dossier_note: e.target.value, global_note: g})
                    }}
                    className="glass-input text-lg font-black py-2 max-w-[150px]"
                    placeholder="Ex: 14"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleSave({ status: 'refused' })}
                  className="flex-1 btn bg-discord-error/20 text-discord-error hover:bg-discord-error/30 border border-discord-error/50"
                >
                  <X className="w-5 h-5" /> Refuser le dossier
                </button>
                <button 
                  onClick={() => {
                    if (!interview.scheduled_at || !interview.vocal_channel_name) {
                      alert("Veuillez définir une Date et un Salon Vocal avant de planifier.");
                      return;
                    }
                    handleSave({ status: 'scheduled' })
                  }}
                  className="flex-1 btn bg-discord-blurple/20 text-discord-blurple hover:bg-discord-blurple/30 border border-discord-blurple/50"
                >
                  <Clock className="w-5 h-5" /> Planifier l'entretien (Passer à l'oral)
                </button>
              </div>
            </>
          )}

          {/* PHASE 2: Entretien Oral (Affiché si Planifié, Accepté ou Refusé) */}
          {!['draft', 'pending'].includes(interview.status) && (
            <>
              {roleHasQuestions && (
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-discord-blurple" /> Questions Aléatoires
                </h3>
                <div className="px-3 py-1 rounded-lg bg-discord-blurple/20 text-discord-blurple font-bold text-sm">
                  Total Oral : {interview.interview_note || 0} / 20
                </div>
              </div>

              {interview.questions_data && interview.questions_data.filter((q: any) => q.isOral).length > 0 ? (
                <div className="space-y-6">
                  {interview.questions_data.map((q: any, i: number) => q.isOral && (
                    <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-discord-blurple">{q.category}</span>
                          <p className="text-white font-medium mt-1">{q.question}</p>
                        </div>
                        {q.isGraded && (
                          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center bg-black/20 p-1.5 rounded-lg border border-white/5">
                            <input
                              type="number"
                              min="0"
                              max={q.maxPoints}
                              step="0.5"
                              value={q.note || ''}
                              onChange={e => handleQuestionChange(i, 'note', e.target.value)}
                              className="glass-input w-20 text-center font-black text-lg py-1"
                              placeholder="-"
                            />
                            <span className="text-discord-muted font-bold text-sm whitespace-nowrap pr-2">/ {q.maxPoints}</span>
                          </div>
                        )}
                        {!q.isGraded && (
                          <div className="shrink-0 text-xs font-bold text-discord-muted px-2 py-1 bg-white/5 rounded-md">
                            Non Noté
                          </div>
                        )}
                      </div>
                      <textarea
                        placeholder="Notes sur la réponse du candidat (facultatif)..."
                        value={q.response || ''}
                        onChange={e => handleQuestionChange(i, 'response', e.target.value)}
                        className="glass-input text-sm py-2 min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-discord-muted">
                  Aucune question générée pour ce rôle. (Sauvegardez pour générer).
                </div>
              )}
            </div>
          )}

          {/* Bilan & Délibéré */}
          <div className="glass-card">
            <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6">Bilan et Délibéré Final</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center opacity-70 cursor-not-allowed">
                <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest block mb-2">Note Dossier (Coef 1)</label>
                <div className="text-2xl font-black text-white">{interview.dossier_note || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <label className="text-[10px] font-bold text-discord-muted uppercase tracking-widest block mb-2">Note Oral (Coef 2)</label>
                <input 
                  type="number"
                  min="0" max="20" step="0.5"
                  value={interview.interview_note || ''}
                  onChange={e => {
                    const o = parseFloat(e.target.value) || 0
                    const d = parseFloat(interview.dossier_note) || 0
                    const g = ((d + (o*2)) / 3).toFixed(2)
                    setInterview({...interview, interview_note: e.target.value, global_note: g})
                  }}
                  className="glass-input text-center text-xl font-black py-2 w-full max-w-[120px] mx-auto"
                />
              </div>
              <div className="p-4 rounded-xl bg-discord-blurple/10 border border-discord-blurple/30 text-center">
                <label className="text-[10px] font-bold text-discord-blurple uppercase tracking-widest block mb-2">Moyenne Finale</label>
                <div className="text-3xl font-black text-discord-blurple">{interview.global_note || '—'}<span className="text-lg text-discord-blurple/50">/20</span></div>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Observation Finale (Synthèse)</label>
              <textarea 
                value={interview.observation || ''}
                onChange={e => setInterview({...interview, observation: e.target.value})}
                className="glass-input min-h-[120px]"
                placeholder="Rédigez le bilan final de l'entretien..."
              />
            </div>

            {/* Actions pour Phase 2 */}
            {interview.status === 'scheduled' && (
              <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button 
                  onClick={() => handleSave({ status: 'refused' })}
                  className="flex-1 btn bg-discord-error/20 text-discord-error hover:bg-discord-error/30 border border-discord-error/50"
                >
                  <X className="w-5 h-5" /> Refuser
                </button>
                <button 
                  onClick={() => handleSave({ status: 'accepted' })}
                  className="flex-1 btn bg-discord-success/20 text-discord-success hover:bg-discord-success/30 border border-discord-success/50"
                >
                  <Check className="w-5 h-5" /> Accepter
                </button>
              </div>
            )}
          </div>
          
          </>
          )}
        </div>
      </div>
    </div>
  )
}
