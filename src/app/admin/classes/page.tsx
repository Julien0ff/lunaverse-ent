'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertCircle, Trash2, Hash } from 'lucide-react'
import clsx from 'clsx'

interface RpClass {
  name: string
  roleId: string
  channelId: string
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<RpClass[]>([])
  const [loading, setLoading] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [newChannelId, setNewChannelId] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/classes')
      if (r.ok) {
        const data = await r.json()
        setClasses(data.classes || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const saveClasses = async (newClassesList: RpClass[]) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: newClassesList })
      })
      if (r.ok) {
        setClasses(newClassesList)
        showMsg('success', 'Classes mises à jour avec succès.')
      } else {
        const err = await r.json()
        showMsg('error', err.error || 'Erreur lors de la sauvegarde.')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  const addClass = async () => {
    const trimmedName = newClassName.trim()
    const trimmedChannel = newChannelId.trim()
    if (!trimmedName || !trimmedChannel) {
      showMsg('error', 'Le nom et le salon sont obligatoires.')
      return
    }
    if (classes.some(c => c.name === trimmedName)) {
      showMsg('error', 'Cette classe existe déjà.')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', className: trimmedName, channelId: trimmedChannel })
      })
      if (r.ok) {
        const data = await r.json()
        setClasses(data.classes || [])
        setNewClassName('')
        setNewChannelId('')
        showMsg('success', 'Classe et rôle ajoutés avec succès.')
      } else {
        const err = await r.json()
        showMsg('error', err.error || 'Erreur.')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  const removeClass = (classToRemove: string) => {
    saveClasses(classes.filter(c => c.name !== classToRemove))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-black text-white">Gestion des Classes</h2>
        <p className="text-discord-muted">Gérez les classes disponibles pour les inscriptions des élèves. La création génère automatiquement un rôle Discord.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 border-dashed">
        <h3 className="text-lg font-black text-white mb-4">Ajouter une classe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest block">Nom de la classe</label>
            <input 
              type="text" 
              placeholder="ex: 3ème A" 
              className="glass-input w-full bg-white/5 border-white/10 text-white"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest block">ID du Salon Info-Trafic</label>
            <input 
              type="text" 
              placeholder="ex: 123456789012345678" 
              className="glass-input w-full bg-white/5 border-white/10 text-white font-mono"
              value={newChannelId}
              onChange={e => setNewChannelId(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={addClass} 
            disabled={saving || !newClassName.trim() || !newChannelId.trim()} 
            className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white flex items-center gap-2 px-6 font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer la Classe & le Rôle
          </button>
        </div>
      </div>

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5">
        <h3 className="text-lg font-black text-white mb-4">Classes existantes ({classes.length})</h3>
        
        {classes.length === 0 ? (
          <p className="text-discord-muted text-center p-4">Aucune classe configurée.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {classes.map(c => (
              <div key={c.name} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all gap-4">
                <div>
                  <span className="font-black text-white text-lg">{c.name}</span>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-discord-muted font-mono bg-black/20 px-2 py-1 rounded-md border border-white/5">
                      <Hash className="w-3 h-3" /> Salon: {c.channelId || 'Non défini'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-discord-muted font-mono bg-black/20 px-2 py-1 rounded-md border border-white/5">
                      <Hash className="w-3 h-3 text-discord-blurple" /> Rôle: {c.roleId || 'Non défini'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => removeClass(c.name)}
                  disabled={saving}
                  className="p-3 bg-discord-error/10 text-discord-error hover:bg-discord-error hover:text-white rounded-xl transition-colors disabled:opacity-50"
                  title="Supprimer la classe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
