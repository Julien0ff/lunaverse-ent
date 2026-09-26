'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, AlertCircle, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { createBrowserClient } from '@supabase/ssr'

const DISCORD_CONFIG_KEYS = [
  { key: 'salon_inscription', label: 'Salon Inscription (Embed)' },
  { key: 'cantine_channel_id', label: 'Salon Cantine (RP)' },
  { key: 'discord_canteen_menu_channel_id', label: 'Salon Menu Cantine' },
  { key: 'pronote_admin_id', label: 'Salon Alertes Pronote' },
  { key: 'social_feed_channel_id', label: 'Salon Réseau Social' }
]

export default function AdminDiscordPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('server_settings').select('key, value')
    if (data) {
      const newSettings: Record<string, string> = {}
      for (const row of data) {
        if (typeof row.value === 'string') {
          newSettings[row.key] = row.value
        }
      }
      setSettings(newSettings)
    }
    setLoading(false)
  }

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const key of DISCORD_CONFIG_KEYS) {
        const val = settings[key.key] || ''
        await supabase.from('server_settings').upsert({ 
          key: key.key, 
          value: val, 
          updated_at: new Date().toISOString() 
        })
      }
      showMsg('success', 'Paramètres Discord sauvegardés.')
    } catch (e) {
      showMsg('error', 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-discord-blurple" /> Intégration Discord
        </h2>
        <p className="text-discord-muted mt-2">Configurez les identifiants (IDs) des salons Discord utilisés par l'ENT.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5">
        <div className="space-y-6">
          {DISCORD_CONFIG_KEYS.map((conf) => (
            <div key={conf.key} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">{conf.label}</label>
              <input 
                type="text" 
                className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-discord-blurple"
                placeholder="ID du salon (ex: 123456789...)"
                value={settings[conf.key] || ''}
                onChange={(e) => handleChange(conf.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white flex items-center gap-2 px-6 font-bold py-3 rounded-xl"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Enregistrer les salons
          </button>
        </div>
      </div>
    </div>
  )
}
