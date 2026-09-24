'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Plus, BarChart3, Search, ChevronRight, FileText, CheckCircle2, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function SatisfactionListPage() {
  const { t } = useLanguage()
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'drafts' | 'completed' | 'stats'>('drafts')

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/admin/satisfaction')
      if (res.ok) {
        const data = await res.json()
        setForms(data.forms || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_discord_id: 'pending_selection'
        })
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = `/admin/satisfaction/${data.form.id}`
      } else {
        const errText = await res.text()
        console.error('[Satisfaction POST 500 Error]', errText)
        alert('Erreur: ' + errText)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const drafts = forms.filter(f => f.status === 'draft')
  const completed = forms.filter(f => f.status === 'completed')

  // Calculate simple stats
  const stats = useMemo(() => {
    if (completed.length === 0) return null
    const total = completed.length
    const avgRegSimp = completed.reduce((acc, f) => acc + (f.q_reg_simplicity || 0), 0) / total
    const avgRegSpeed = completed.reduce((acc, f) => acc + (f.q_reg_speed || 0), 0) / total
    const pcCount = completed.filter(f => f.q_pronote_device === 'PC').length
    const mobileCount = completed.filter(f => f.q_pronote_device === 'Mobile').length
    const pronoteWorked = completed.filter(f => f.q_pronote_worked === true).length
    
    return {
      total,
      avgRegSimp: avgRegSimp.toFixed(1),
      avgRegSpeed: avgRegSpeed.toFixed(1),
      pcPercent: Math.round((pcCount / total) * 100),
      mobilePercent: Math.round((mobileCount / total) * 100),
      pronoteWorkedPercent: Math.round((pronoteWorked / total) * 100)
    }
  }, [completed])

  const renderList = (list: any[]) => {
    if (loading) return <div className="p-8 text-center text-discord-muted animate-pulse font-bold">Chargement...</div>
    if (list.length === 0) {
      return (
        <div className="p-16 text-center">
          <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Aucun questionnaire</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-2">
        {list.map(f => (
          <Link 
            key={f.id} 
            href={`/admin/satisfaction/${f.id}`}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-discord-blurple/30 transition-all group"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                {f.profile?.avatar_url ? (
                  <img src={f.profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-xs font-bold text-white">
                    {f.target_username?.[0] || f.profile?.username?.[0] || '?'}
                  </div>
                )}
                <span className="text-lg font-black text-white">{f.profile?.nickname_rp || f.profile?.username || f.target_username || (f.target_discord_id === 'pending_selection' ? 'Cible à définir' : f.target_discord_id) || 'Nouveau Questionnaire'}</span>
              </div>
              <div className="text-xs text-discord-muted flex items-center gap-2">
                <span>Créé le {new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-discord-blurple group-hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="page-container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-slideIn">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-10 h-10 text-discord-blurple drop-shadow-md" />
            Questionnaires de Satisfaction
          </h1>
          <p className="text-discord-muted mt-2 font-medium">Recueillez et analysez les retours des utilisateurs.</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary px-6 shadow-lg shadow-discord-blurple/20 hover:-translate-y-1">
          <Plus className="w-5 h-5" />
          Nouveau Questionnaire
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('drafts')}
          className={clsx("px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2", 
            activeTab === 'drafts' ? "bg-discord-blurple text-white" : "bg-white/5 text-discord-muted hover:bg-white/10")}
        >
          <FileText className="w-4 h-4" /> Brouillons ({drafts.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={clsx("px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2", 
            activeTab === 'completed' ? "bg-discord-success text-white" : "bg-white/5 text-discord-muted hover:bg-white/10")}
        >
          <CheckCircle2 className="w-4 h-4" /> Terminés ({completed.length})
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={clsx("px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2", 
            activeTab === 'stats' ? "bg-discord-warning text-white" : "bg-white/5 text-discord-muted hover:bg-white/10")}
        >
          <BarChart3 className="w-4 h-4" /> Statistiques
        </button>
      </div>

      <div className="glass-card p-2 animate-fadeIn border border-white/5 shadow-2xl min-h-[400px]">
        {activeTab === 'drafts' && renderList(drafts)}
        {activeTab === 'completed' && renderList(completed)}
        
        {activeTab === 'stats' && (
          <div className="p-6">
            {!stats ? (
              <div className="text-center text-discord-muted">Pas assez de données pour les statistiques.</div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-black text-white mb-4">L'Inscription</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-discord-muted mb-1 uppercase tracking-widest">
                        <span>Simplicité</span>
                        <span>{stats.avgRegSimp}/10</span>
                      </div>
                      <div className="h-2 rounded-full bg-black/40 overflow-hidden"><div className="h-full bg-discord-blurple" style={{ width: `${(parseFloat(stats.avgRegSimp)/10)*100}%`}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-discord-muted mb-1 uppercase tracking-widest">
                        <span>Rapidité</span>
                        <span>{stats.avgRegSpeed}/10</span>
                      </div>
                      <div className="h-2 rounded-full bg-black/40 overflow-hidden"><div className="h-full bg-discord-success" style={{ width: `${(parseFloat(stats.avgRegSpeed)/10)*100}%`}}></div></div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-black text-white mb-4">Pronote & Support</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-discord-muted mb-2 uppercase tracking-widest">Appareil utilisé</div>
                      <div className="flex h-6 rounded-md overflow-hidden bg-black/40">
                        {stats.pcPercent > 0 && <div className="bg-discord-blurple flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${stats.pcPercent}%`}}>PC {stats.pcPercent}%</div>}
                        {stats.mobilePercent > 0 && <div className="bg-discord-warning flex items-center justify-center text-[10px] font-bold text-black" style={{ width: `${stats.mobilePercent}%`}}>Mobile {stats.mobilePercent}%</div>}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-discord-muted mb-1 uppercase tracking-widest">
                        <span>Taux de Réussite Pronote</span>
                        <span className="text-discord-success">{stats.pronoteWorkedPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-black/40 overflow-hidden"><div className="h-full bg-discord-success" style={{ width: `${stats.pronoteWorkedPercent}%`}}></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Derniers Retours Écrits */}
              <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-black text-white mb-4">Derniers retours écrits</h3>
                <div className="space-y-6">
                  {completed.filter(f => f.q_ent_likes || f.q_ent_improvements || f.q_pronote_exp).slice(0, 5).map(f => (
                    <div key={f.id} className="p-4 bg-black/20 rounded-lg border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        {f.profile?.avatar_url ? (
                          <img src={f.profile.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-discord-blurple flex items-center justify-center text-[10px] font-bold text-white">
                            {f.profile?.username?.[0] || f.target_username?.[0] || '?'}
                          </div>
                        )}
                        <span className="text-sm font-bold text-white">{f.profile?.nickname_rp || f.profile?.username || f.target_username || 'Anonyme'}</span>
                        <span className="text-xs text-discord-muted ml-auto">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {f.q_ent_likes && (
                        <div>
                          <div className="text-[10px] font-bold text-discord-success uppercase tracking-widest mb-1">Ce qui plaît</div>
                          <div className="text-sm text-gray-300 italic">"{f.q_ent_likes}"</div>
                        </div>
                      )}
                      {f.q_ent_improvements && (
                        <div>
                          <div className="text-[10px] font-bold text-discord-warning uppercase tracking-widest mb-1">Améliorations</div>
                          <div className="text-sm text-gray-300 italic">"{f.q_ent_improvements}"</div>
                        </div>
                      )}
                      {f.q_pronote_exp && (
                        <div>
                          <div className="text-[10px] font-bold text-discord-blurple uppercase tracking-widest mb-1">Expérience Pronote</div>
                          <div className="text-sm text-gray-300 italic">"{f.q_pronote_exp}"</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {completed.filter(f => f.q_ent_likes || f.q_ent_improvements || f.q_pronote_exp).length === 0 && (
                    <div className="text-center text-discord-muted text-sm">Aucun retour écrit pour le moment.</div>
                  )}
                </div>
              </div>
            </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
