'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Send, Loader2, X, AlertCircle, Save } from 'lucide-react'
import clsx from 'clsx'

interface Announcement {
  id: string
  type: string
  target_class: string
  subject: string
  teacher_id: string
  replacement_teacher_id: string
  info_status: string
  info_text: string
  status: string
  created_at: string
  start_time?: string
  teacher?: { username: string, nickname_rp: string }
  replacement?: { username: string, nickname_rp: string }
}

interface User {
  id: string
  username: string
  nickname_rp: string
}

interface RpClass {
  name: string
  roleId: string
  channelId: string
}



export default function AdminAnnoncesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<RpClass[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [salonDiscord, setSalonDiscord] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Announcement>>({
    type: 'info',
    target_class: 'all',
    subject: 'MATHÉMATIQUES',
    info_status: 'information',
    teacher_id: '',
    replacement_teacher_id: '',
    info_text: ''
  })

  const [discordChannels, setDiscordChannels] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [annRes, usrRes, clsRes, chanRes] = await Promise.all([
        fetch('/api/admin/announcements'),
        fetch('/api/admin/users'),
        fetch('/api/admin/classes'),
        fetch('/api/discord/channels')
      ])
      
      if (annRes.ok) {
        const d = await annRes.json()
        setAnnouncements(d.items || [])
        setSalonDiscord(d.salon_annonces || '')
        setSubjects(d.matieres || [])
        if (d.matieres?.length > 0) {
          setFormData(prev => ({...prev, subject: d.matieres[0]}))
        }
      }
      if (usrRes.ok) {
        const u = await usrRes.json()
        setUsers(u.users || [])
      }
      if (clsRes.ok) {
        const c = await clsRes.json()
        setClasses(c.classes || [])
      }
      if (chanRes.ok) {
        const ch = await chanRes.json()
        setDiscordChannels(ch.channels || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if channelId is missing for specific class
    if (formData.target_class !== 'all') {
      const cls = classes.find(c => c.name === formData.target_class)
      if (!cls || !cls.channelId) {
        alert("⚠️ Cette classe n'a pas de salon Discord (Channel ID) configuré dans l'onglet Effectifs & Classes. L'annonce ne pourra pas être envoyée sur Discord. Veuillez d'abord configurer le salon de la classe.")
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur')
      }
    } catch (e) {
      alert('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (id: string, action: 'publish' | 'unpublish' | 'delete') => {
    setProcessingId(id)
    try {
      if (action === 'delete') {
        if (!confirm('Voulez-vous supprimer cette annonce ?')) {
          setProcessingId(null)
          return
        }
        await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
      } else {
        await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action })
        })
      }
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/admin/effectifs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_annonces: salonDiscord })
      })
      alert('✅ Salon sauvegardé')
    } catch (e) {
      alert('❌ Erreur de sauvegarde')
    }
  }

  return (
    <>
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Megaphone className="text-discord-blurple w-8 h-8" />
            Annonces Classes
          </h2>
          <p className="text-discord-muted mt-2">Gérez les annonces et perturbations de cours (Mise à jour automatique dans le salon de la classe concernée).</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" /> Créer une annonce
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="space-y-4">
          {announcements.length > 0 ? announcements.map(ann => (
            <div key={ann.id} className={clsx(
              "glass-card p-5 border-l-4 transition-colors",
              ann.status === 'sent' ? "border-discord-success" : "border-gray-500"
            )}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-black",
                      ann.status === 'sent' ? "bg-discord-success" : "bg-gray-400"
                    )}>
                      {ann.status === 'sent' ? 'Publiée' : 'Brouillon'}
                    </span>
                    <span className="text-xs font-bold text-discord-muted uppercase tracking-widest">
                      {ann.info_status === 'annonce_cours' ? 'Nouveau cours' : 
                       ann.info_status === 'information' ? 'Information générale' : 
                       ann.info_status === 'supprime' ? 'Cours supprimé' : 
                       ann.info_status === 'remplace' ? 'Cours remplacé' : 
                       ann.info_status === 'retard' ? 'Prof. en retard' : 
                       ann.info_status === 'deplace' ? 'Cours déplacé' : 
                       ann.info_status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{ann.subject} <span className="text-discord-muted text-base font-normal">({ann.target_class})</span></h3>
                  <p className="text-sm text-gray-400">
                    Professeur : <span className="font-bold text-white">{ann.teacher?.nickname_rp || ann.teacher?.username || 'Aucun'}</span>
                    {ann.info_status === 'remplace' && (
                      <> ➔ Remplacé par : <span className="font-bold text-white">{ann.replacement?.nickname_rp || ann.replacement?.username || 'Inconnu'}</span></>
                    )}
                    {ann.start_time && (
                      <> | Date prévue : <span className="font-bold text-white">{new Date(ann.start_time).toLocaleDateString('fr-FR')} à {new Date(ann.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></>
                    )}
                  </p>
                  {ann.info_text && (
                    <p className="text-sm text-gray-300 mt-2 border-l-2 border-white/20 pl-2">
                      {ann.info_status === 'annonce_cours' ? (
                        <span className="flex items-center gap-1">
                          Salle : <span className="bg-[#5865F2]/20 text-[#5865F2] px-1.5 py-0.5 rounded-md font-medium text-xs">
                            #{discordChannels.find(c => c.id === ann.info_text.replace(/[<#>]/g, ''))?.name || 'salon-inconnu'}
                          </span>
                        </span>
                      ) : (
                        <span className="italic">"{ann.info_text}"</span>
                      )}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {ann.status === 'pending' ? (
                    <button onClick={() => handleAction(ann.id, 'publish')} disabled={processingId === ann.id} className="p-3 bg-discord-blurple/10 hover:bg-discord-blurple/20 text-discord-blurple rounded-xl transition-colors">
                      {processingId === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button onClick={() => handleAction(ann.id, 'unpublish')} disabled={processingId === ann.id} className="p-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl transition-colors" title="Retirer de l'affichage">
                      {processingId === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => handleAction(ann.id, 'delete')} disabled={processingId === ann.id} className="p-3 bg-discord-error/10 hover:bg-discord-error/20 text-discord-error rounded-xl transition-colors">
                    {processingId === ann.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center glass-card">
              <p className="text-discord-muted font-medium">Aucune annonce trouvée.</p>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Modal Creation */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#1e1e24] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] animate-slideUp">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
              <div>
                <h3 className="text-xl font-black text-white">Créer une Annonce</h3>
                <p className="text-sm text-discord-muted mt-1">Diffusez une annonce ciblée ou générale.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-black/20 hover:bg-black/40 rounded-xl text-discord-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-black/20">
              <form id="annonce-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Classe ciblée</label>
                    <select value={formData.target_class} onChange={e => setFormData({...formData, target_class: e.target.value})} className="glass-input w-full bg-white/5 border-white/10" required>
                      <option value="all">Toutes les classes</option>
                      {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Type de perturbation</label>
                    <select value={formData.info_status} onChange={e => {
                      const newStatus = e.target.value
                      setFormData({...formData, info_status: newStatus, info_text: newStatus === 'annonce_cours' ? '' : formData.info_text})
                    }} className="glass-input w-full bg-white/5 border-white/10" required>
                      <option value="information">Information générale</option>
                      <option value="annonce_cours">Nouveau cours</option>
                      <option value="supprime">Cours supprimé</option>
                      <option value="remplace">Cours remplacé</option>
                      <option value="retard">Professeur en retard</option>
                      <option value="deplace">Cours déplacé</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Matière / Sujet</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="glass-input w-full bg-white/5 border-white/10" required>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Professeur concerné</label>
                    <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="glass-input w-full bg-white/5 border-white/10">
                      <option value="">-- Aucun --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Date et Heure</label>
                    <input 
                      type="datetime-local" 
                      value={formData.start_time ? new Date(new Date(formData.start_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={e => setFormData({...formData, start_time: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                      className="glass-input w-full bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                {formData.info_status === 'remplace' && (
                  <div className="space-y-2 p-4 bg-discord-blurple/10 border border-discord-blurple/20 rounded-xl">
                    <label className="text-xs font-black text-discord-blurple uppercase tracking-widest block">Professeur remplaçant</label>
                    <select value={formData.replacement_teacher_id} onChange={e => setFormData({...formData, replacement_teacher_id: e.target.value})} className="glass-input w-full bg-black/40 border-discord-blurple/30">
                      <option value="">-- Aucun --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                    </select>
                  </div>
                )}

                {formData.info_status === 'annonce_cours' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Salle de cours</label>
                    <select 
                      value={formData.info_text?.replace(/[<#>]/g, '') || ''} 
                      onChange={e => setFormData({...formData, info_text: `<#${e.target.value}>`})} 
                      className="glass-input w-full bg-white/5 border-white/10" 
                      required
                    >
                      <option value="">-- Sélectionnez une salle --</option>
                      {discordChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Informations supplémentaires</label>
                    <textarea 
                      value={formData.info_text} 
                      onChange={e => setFormData({...formData, info_text: e.target.value})} 
                      className="glass-input w-full bg-white/5 border-white/10 resize-none h-24" 
                      placeholder="Précisez le motif, la salle, etc."
                    />
                  </div>
                )}
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/5 shrink-0 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-discord-muted hover:text-white hover:bg-white/10 transition-colors">
                Annuler
              </button>
              <button type="submit" form="annonce-form" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold bg-discord-blurple hover:bg-discord-blurple/80 text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-discord-blurple/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer le brouillon</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
