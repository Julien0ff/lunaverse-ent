'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Send, Loader2, X, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

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
  teacher?: { username: string, nickname_rp: string }
  replacement?: { username: string, nickname_rp: string }
}

interface User {
  id: string
  username: string
  nickname_rp: string
}

const SUBJECTS = [
  'ALLEMAND', 'ANGLAIS', 'ARTS PLASTIQUES', 'BRANLETTE COLLECTIVE', 'CLUB (au choix)',
  'CRIMINOLOGIE', 'CUISINE', 'CYBERSÉCURITÉ', 'DROIT', 'DROIT CONSTITUTIONNEL DE LA VE RÉPUBLIQUE',
  'ÉDUCATION MORALE ET CIVIQUE', 'ÉDUCATION MUSICALE', 'ÉDUCATION PHYSIQUE ET SPORTIVE',
  'ESPAGNOL', 'EVENT', 'EXAMENS NATIONAUX', 'FORMATION HUMAINE', 'FRANÇAIS',
  'Gestion Etab', 'HISTOIRE-GÉOGRAPHIE', 'HYMNE', 'INFIRMERIE', 'MATHÉMATIQUES',
  'Matière non désignée', 'Permanence', 'PHYSIQUE-CHIMIE', 'PPMS', 'Prévention',
  'Réservation de salle', 'SCIENCE DE LA VIE QUOTIDIENNE', 'SCIENCES DE LA VIE ET DE LA TERRE',
  'SCIENCES ÉCONOMIQUES ET SOCIALES', 'SORTIE SCOLAIRE', 'TECHNOLOGIE', 'TP PHYSIQUE-CHIMIE',
  'VIE POLITIQUE FRANÇAISE'
]

export default function AdminAnnoncesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Announcement>>({
    type: 'info',
    target_class: 'nova',
    subject: 'MATHÉMATIQUES',
    info_status: 'information',
    teacher_id: '',
    replacement_teacher_id: '',
    info_text: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [annRes, usrRes] = await Promise.all([
        fetch('/api/admin/announcements'),
        fetch('/api/admin/users')
      ])
      
      if (annRes.ok) {
        const d = await annRes.json()
        setAnnouncements(d.items || [])
      }
      if (usrRes.ok) {
        const u = await usrRes.json()
        setUsers(u.users || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Megaphone className="text-discord-blurple w-8 h-8" />
            Annonces & Info-Trafic
          </h2>
          <p className="text-discord-muted mt-2">Gérez les perturbations et annonces de cours (Mise à jour automatique de l'embed Discord).</p>
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
                    <span className="text-xs font-bold text-discord-muted uppercase tracking-widest">{ann.info_status}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{ann.subject} <span className="text-discord-muted text-base font-normal">({ann.target_class})</span></h3>
                  <p className="text-sm text-gray-400">
                    Professeur : <span className="font-bold text-white">{ann.teacher?.nickname_rp || ann.teacher?.username || 'Aucun'}</span>
                    {ann.info_status === 'remplace' && (
                      <> ➔ Remplacé par : <span className="font-bold text-white">{ann.replacement?.nickname_rp || ann.replacement?.username || 'Inconnu'}</span></>
                    )}
                  </p>
                  {ann.info_text && <p className="text-sm text-gray-300 italic mt-2 border-l-2 border-white/20 pl-2">"{ann.info_text}"</p>}
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

      {/* Modal Creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card max-w-lg w-full relative animate-slideUp">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-discord-muted hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-white mb-6">Créer un Info-Trafic</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Classe</label>
                  <select value={formData.target_class} onChange={e => setFormData({...formData, target_class: e.target.value})} className="input-field mt-1" required>
                    <option value="nova">Nova</option>
                    <option value="nebuleuse">Nébuleuse</option>
                    <option value="general">Général (Les deux)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Type Perturbation</label>
                  <select value={formData.info_status} onChange={e => setFormData({...formData, info_status: e.target.value})} className="input-field mt-1" required>
                    <option value="information">Information</option>
                    <option value="supprime">Supprimé</option>
                    <option value="remplace">Remplacé</option>
                    <option value="retard">En retard</option>
                    <option value="deplace">Déplacé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Matière</label>
                <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-field mt-1" required>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Professeur Concerne</label>
                <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="input-field mt-1">
                  <option value="">-- Aucun --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                </select>
              </div>

              {formData.info_status === 'remplace' && (
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Professeur Remplaçant</label>
                  <select value={formData.replacement_teacher_id} onChange={e => setFormData({...formData, replacement_teacher_id: e.target.value})} className="input-field mt-1">
                    <option value="">-- Aucun --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Informations Complémentaires</label>
                <textarea 
                  value={formData.info_text} 
                  onChange={e => setFormData({...formData, info_text: e.target.value})} 
                  className="input-field mt-1 resize-none h-20" placeholder="Ex: Devoir annulé..."
                />
              </div>
              
              <div className="pt-4">
                <button type="submit" disabled={saving} className="btn btn-primary w-full">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Créer le brouillon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
