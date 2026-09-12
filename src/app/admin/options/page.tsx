'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import clsx from 'clsx'

export default function AdminOptionsPage() {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newOption, setNewOption] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/options')
      if (r.ok) {
        const data = await r.json()
        const normalizedOptions = (data.options || []).map((o: any) => {
          if (typeof o === 'string') return { id: Math.random().toString(), name: o, capacity: 0 }
          return o
        })
        setOptions(normalizedOptions)
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

  const saveOptions = async (newOptionsList: any[]) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: newOptionsList })
      })
      if (r.ok) {
        setOptions(newOptionsList)
        setNewOption('')
        showMsg('success', 'Options mises à jour avec succès.')
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

  const addOption = () => {
    const trimmed = newOption.trim()
    if (!trimmed) return
    if (options.some(o => o.name.toLowerCase() === trimmed.toLowerCase())) {
      showMsg('error', 'Cette option existe déjà.')
      return
    }
    const newOptObj = { id: Math.random().toString(), name: trimmed, capacity: 0 }
    saveOptions([...options, newOptObj])
  }

  const removeOption = (idToRemove: string) => {
    saveOptions(options.filter(o => o.id !== idToRemove))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-3xl font-black text-white">Spécialités & Clubs</h2>
        <p className="text-discord-muted">Gérez les options disponibles lors de l'inscription RP.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 border-dashed">
        <h3 className="text-lg font-black text-white mb-4">Ajouter une spécialité</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nom de l'option (ex: Physique Chimie)" 
            className="glass-input flex-1 bg-white/5 border-white/10 text-white"
            value={newOption}
            onChange={e => setNewOption(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addOption()}
          />
          <button 
            onClick={addOption} 
            disabled={saving || !newOption.trim()} 
            className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white flex items-center gap-2 px-6 font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
        </div>
      </div>

      <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5">
        <h3 className="text-lg font-black text-white mb-4">Options existantes ({options.length})</h3>
        
        {options.length === 0 ? (
          <p className="text-discord-muted text-center p-4">Aucune option configurée.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {options.map(opt => (
              <div key={opt.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all">
                <span className="font-bold text-white text-sm">{opt.name}</span>
                <button 
                  onClick={() => removeOption(opt.id)}
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
