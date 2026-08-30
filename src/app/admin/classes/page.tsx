'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import clsx from 'clsx'

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newClass, setNewClass] = useState('')
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

  const saveClasses = async (newClassesList: string[]) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: newClassesList })
      })
      if (r.ok) {
        setClasses(newClassesList)
        setNewClass('')
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

  const addClass = () => {
    const trimmed = newClass.trim()
    if (!trimmed) return
    if (classes.includes(trimmed)) {
      showMsg('error', 'Cette classe existe déjà.')
      return
    }
    saveClasses([...classes, trimmed])
  }

  const removeClass = (classToRemove: string) => {
    saveClasses(classes.filter(c => c !== classToRemove))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto p-4 md:p-8">
      <div>
        <h2 className="text-3xl font-black text-white">Gestion des Classes</h2>
        <p className="text-discord-muted">Gérez les classes disponibles pour les inscriptions des élèves.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 border-dashed">
        <h3 className="text-lg font-black text-white mb-4">Ajouter une classe</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nom de la classe (ex: 3ème A)" 
            className="glass-input flex-1 bg-white/5 border-white/10 text-white"
            value={newClass}
            onChange={e => setNewClass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addClass()}
          />
          <button 
            onClick={addClass} 
            disabled={saving || !newClass.trim()} 
            className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white flex items-center gap-2 px-6 font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
        </div>
      </div>

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5">
        <h3 className="text-lg font-black text-white mb-4">Classes existantes ({classes.length})</h3>
        
        {classes.length === 0 ? (
          <p className="text-discord-muted text-center p-4">Aucune classe configurée.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map(c => (
              <div key={c} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all">
                <span className="font-bold text-white text-sm">{c}</span>
                <button 
                  onClick={() => removeClass(c)}
                  disabled={saving}
                  className="p-2 text-discord-error hover:bg-discord-error/20 rounded-xl transition-colors disabled:opacity-50"
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
