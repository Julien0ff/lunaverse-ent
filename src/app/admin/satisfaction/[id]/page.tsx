'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Save, Search, User, Check, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function SatisfactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const id = params?.id as string

  useEffect(() => {
    fetch(`/api/admin/satisfaction/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.form) setForm(data.form)
      })
      .finally(() => setLoading(false))
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
    setForm((prev: any) => ({
      ...prev,
      target_discord_id: member.user.id
    }))
    setSearchQuery(username)
    setSearchResults([])
  }

  const handleSave = async (customUpdates?: any) => {
    setSaving(true)
    const payload = customUpdates || form
    try {
      const res = await fetch(`/api/admin/satisfaction/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        setForm(data.form)
        if (customUpdates?.status === 'completed') {
           router.push('/admin/satisfaction')
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse">Chargement...</div>
  if (!form) return <div className="p-20 text-center text-discord-error">Questionnaire introuvable</div>

  return (
    <div className="page-container max-w-4xl mx-auto pb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-slideIn">
        <div className="flex items-center gap-4">
          <Link href="/admin/satisfaction" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Questionnaire de Satisfaction
              <span className={clsx("text-sm px-3 py-1 rounded-full border uppercase tracking-widest", {
                'text-discord-success border-discord-success/30 bg-discord-success/10': form.status === 'completed',
                'text-discord-muted border-white/10 bg-white/5': form.status === 'draft'
              })}>
                {form.status === 'completed' ? 'Clôturé' : 'Brouillon'}
              </span>
            </h1>
          </div>
        </div>
        <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary px-6 shadow-lg shadow-discord-blurple/20">
          <Save className="w-5 h-5" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
        </button>
      </div>

      <div className="space-y-6">
        {/* User Selection */}
        <div className="glass-card">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-discord-blurple" /> Utilisateur Concerné
          </h3>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted" />
            <input 
              type="text" 
              value={searchQuery || form.target_discord_id}
              onChange={e => handleSearch(e.target.value)}
              className="glass-input pl-10"
              placeholder="Rechercher sur le Discord..."
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-2 p-2 bg-[#1E1F22] rounded-xl border border-white/10 shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((m: any) => (
                  <button
                    key={m.user.id}
                    onClick={() => selectCandidate(m)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors"
                  >
                    {m.user.avatar ? (
                      <img src={`https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`} className="w-8 h-8 rounded-full" />
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
        </div>

        {/* Section 1: Inscription */}
        <div className="glass-card">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/5 pb-4">1. L'Inscription</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-3 block">Simplicité de l'inscription (1 à 10)</label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n}
                    onClick={() => setForm({...form, q_reg_simplicity: n})}
                    className={clsx("w-10 h-10 rounded-lg font-black transition-all",
                      form.q_reg_simplicity === n ? "bg-discord-blurple text-white scale-110 shadow-lg shadow-discord-blurple/20" : "bg-white/5 text-discord-muted hover:bg-white/10"
                    )}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-3 block">Rapidité des réponses (1 à 10)</label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n}
                    onClick={() => setForm({...form, q_reg_speed: n})}
                    className={clsx("w-10 h-10 rounded-lg font-black transition-all",
                      form.q_reg_speed === n ? "bg-discord-success text-white scale-110 shadow-lg shadow-discord-success/20" : "bg-white/5 text-discord-muted hover:bg-white/10"
                    )}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pronote */}
        <div className="glass-card">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/5 pb-4">2. Expérience Pronote</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-3 block">Appareil Principal</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setForm({...form, q_pronote_device: 'PC'})}
                  className={clsx("flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all", 
                    form.q_pronote_device === 'PC' ? "border-discord-blurple bg-discord-blurple/10 text-white" : "border-transparent bg-white/5 text-discord-muted hover:bg-white/10"
                  )}
                >
                  <Monitor className="w-5 h-5" /> Ordinateur
                </button>
                <button 
                  onClick={() => setForm({...form, q_pronote_device: 'Mobile'})}
                  className={clsx("flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all", 
                    form.q_pronote_device === 'Mobile' ? "border-discord-warning bg-discord-warning/10 text-white" : "border-transparent bg-white/5 text-discord-muted hover:bg-white/10"
                  )}
                >
                  <Smartphone className="w-5 h-5" /> Téléphone
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-3 block">Connexion Réussie ?</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setForm({...form, q_pronote_worked: true})}
                  className={clsx("flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all", 
                    form.q_pronote_worked === true ? "border-discord-success bg-discord-success/10 text-white" : "border-transparent bg-white/5 text-discord-muted hover:bg-white/10"
                  )}
                >
                  Oui, ça marche
                </button>
                <button 
                  onClick={() => setForm({...form, q_pronote_worked: false})}
                  className={clsx("flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-bold transition-all", 
                    form.q_pronote_worked === false ? "border-discord-error bg-discord-error/10 text-white" : "border-transparent bg-white/5 text-discord-muted hover:bg-white/10"
                  )}
                >
                  Non, ça bloque
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Détails sur l'expérience Pronote</label>
            <textarea 
              value={form.q_pronote_exp || ''}
              onChange={e => setForm({...form, q_pronote_exp: e.target.value})}
              className="glass-input min-h-[80px]"
              placeholder="Des difficultés rencontrées ? Des bugs ?"
            />
          </div>
        </div>

        {/* Section 3: L'ENT */}
        <div className="glass-card">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/5 pb-4">3. L'ENT (Espace Numérique)</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Ce qu'il aime de manière générale</label>
              <textarea 
                value={form.q_ent_likes || ''}
                onChange={e => setForm({...form, q_ent_likes: e.target.value})}
                className="glass-input min-h-[100px]"
                placeholder="Ex: Le design, la loterie, le profil..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Les points à améliorer (Idées/Critiques)</label>
              <textarea 
                value={form.q_ent_improvements || ''}
                onChange={e => setForm({...form, q_ent_improvements: e.target.value})}
                className="glass-input min-h-[100px]"
                placeholder="Ex: Ajouter plus de rôles, un marché noir..."
              />
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-discord-muted text-sm">N'oubliez pas d'enregistrer vos modifications.</p>
          <button 
            onClick={() => handleSave({ status: 'completed' })}
            className="btn bg-discord-success/20 text-discord-success border border-discord-success/30 hover:bg-discord-success/30 px-8 w-full md:w-auto"
          >
            <Check className="w-5 h-5" />
            Clôturer et Archiver
          </button>
        </div>
      </div>
    </div>
  )
}
