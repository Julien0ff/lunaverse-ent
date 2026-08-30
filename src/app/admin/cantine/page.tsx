'use client'

import { useState, useEffect } from 'react'
import { Clock, Send, Utensils, Info, CheckCircle2, Loader2, Save } from 'lucide-react'
import clsx from 'clsx'

export default function AdminCantinePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deploying, setDeploying] = useState(false)
  
  const [startTime, setStartTime] = useState('11:30')
  const [endTime, setEndTime] = useState('13:30')
  const [menuText, setMenuText] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    loadCantineSettings()
  }, [])

  const loadCantineSettings = async () => {
    try {
      const res = await fetch('/api/admin/cantine')
      if (res.ok) {
        const data = await res.json()
        setStartTime(data.cantine_start_time || '11:30')
        setEndTime(data.cantine_end_time || '13:30')
        setMenuText(data.canteen_menu_text || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setFeedback('')
    try {
      const res = await fetch('/api/admin/cantine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantine_start_time: startTime, cantine_end_time: endTime, canteen_menu_text: menuText })
      })
      if (res.ok) {
        setFeedback('✅ Paramètres sauvegardés avec succès !')
      } else {
        setFeedback('❌ Erreur lors de la sauvegarde.')
      }
    } catch (e) {
      setFeedback('❌ Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  const deployMenu = async () => {
    setDeploying(true)
    setFeedback('')
    try {
      const res = await fetch('/api/admin/cantine/deploy', { method: 'POST' })
      if (res.ok) {
        setFeedback('✅ Menu déployé/mis à jour sur Discord !')
      } else {
        const err = await res.json()
        setFeedback(`❌ Erreur: ${err.error || 'Impossible de déployer.'}`)
      }
    } catch (e) {
      setFeedback('❌ Erreur lors du déploiement.')
    } finally {
      setDeploying(false)
      setTimeout(() => setFeedback(''), 4000)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Utensils className="text-discord-blurple w-8 h-8" />
          Cantine
        </h2>
        <p className="text-discord-muted">Gérez les horaires d'ouverture et le menu de la cantine RP.</p>
      </div>

      {feedback && (
        <div className={clsx(
          "p-4 rounded-xl border font-bold flex items-center gap-2",
          feedback.includes('✅') ? "bg-discord-success/10 border-discord-success/30 text-discord-success" : "bg-discord-error/10 border-discord-error/30 text-discord-error"
        )}>
          {feedback.includes('✅') ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horaires */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Horaires d'Ouverture</h3>
              <p className="text-xs text-discord-muted">Les heures durant lesquelles les élèves peuvent écrire dans le salon.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">Heure d'ouverture</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">Heure de fermeture</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn bg-amber-500 hover:bg-amber-600 text-white w-full py-3 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder les horaires'}
          </button>
        </div>

        {/* Menu */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-discord-blurple/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-discord-blurple" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Menu de la Semaine</h3>
              <p className="text-xs text-discord-muted">Ce texte sera affiché sur l'embed Discord.</p>
            </div>
          </div>

          <textarea
            value={menuText}
            onChange={e => setMenuText(e.target.value)}
            rows={8}
            placeholder="Ex: Lundi: Pâtes carbo..."
            className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-discord-blurple resize-none"
          />

          <div className="flex gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 btn bg-white/10 hover:bg-white/20 text-white py-3 font-bold flex items-center justify-center gap-2 transition-all"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Sauvegarder
            </button>
            <button
              onClick={deployMenu}
              disabled={deploying}
              className="flex-1 btn bg-discord-blurple hover:bg-discord-blurple/80 text-white py-3 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-discord-blurple/20"
            >
              {deploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {deploying ? 'Envoi...' : 'Déployer sur Discord'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
