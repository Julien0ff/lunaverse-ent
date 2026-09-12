'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Save, Loader2, Info, Send, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

interface Effectif {
  id: string;
  name: string;
  capacity: number;
}

export default function AdminEffectifsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [feedback, setFeedback] = useState('')

  const [salonDiscord, setSalonDiscord] = useState('')
  const [classiques, setClassiques] = useState<Effectif[]>([])
  const [personnel, setPersonnel] = useState<Effectif[]>([])
  const [specialites, setSpecialites] = useState<Effectif[]>([]) // Loaded from rp_options

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/effectifs')
      if (res.ok) {
        const data = await res.json()
        setSalonDiscord(data.salon_effectifs || '')
        
        // Ensure options have a capacity field mapped
        const optionsList = (data.options || []).map((o: any) => ({
          id: o.id || Math.random().toString(),
          name: o.name || o,
          capacity: o.capacity || 0
        }))
        setSpecialites(optionsList)
        
        const loadEffectifItems = (items: any[]) => items.map(item => ({...item, id: item.id || Math.random().toString()}))

        setClassiques(loadEffectifItems(data.effectifs.classiques || []))
        setPersonnel(loadEffectifItems(data.effectifs.personnel || [
          { name: 'Infirmier(e)', capacity: 1 },
          { name: 'Psychologue', capacity: 1 },
          { name: 'Conseiller d\'orientation', capacity: 1 }
        ]))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    showFeedback('')
    try {
      const effectifsData = { classiques, personnel }
      const res = await fetch('/api/admin/effectifs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectifs: effectifsData,
          options: specialites,
          salon_effectifs: salonDiscord
        })
      })
      if (res.ok) {
        showFeedback('✅ Données sauvegardées !')
      } else {
        showFeedback('❌ Erreur de sauvegarde.')
      }
    } catch (e) {
      showFeedback('❌ Erreur de connexion.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeploy = async () => {
    if (!salonDiscord) {
      showFeedback('❌ Veuillez renseigner l\'ID du salon Discord.')
      return
    }
    setDeploying(true)
    showFeedback('⏳ Déploiement en cours...')
    try {
      // First save the latest changes implicitly
      await handleSave()

      const res = await fetch('/api/admin/effectifs/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          effectifs: { classiques, personnel },
          options: specialites,
          salon_effectifs: salonDiscord
        })
      })
      if (res.ok) {
        showFeedback('✨ Message Discord déployé avec succès !')
      } else {
        showFeedback('❌ Erreur lors du déploiement Discord.')
      }
    } catch (e) {
      showFeedback('❌ Erreur réseau.')
    } finally {
      setDeploying(false)
    }
  }

  const addClassique = () => {
    setClassiques([...classiques, { id: Math.random().toString(), name: 'Nouvelle Matière', capacity: 0 }])
  }
  const removeClassique = (id: string) => {
    setClassiques(classiques.filter(c => c.id !== id))
  }
  const updateClassique = (id: string, field: 'name' | 'capacity', value: any) => {
    setClassiques(classiques.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const updatePersonnel = (id: string, field: 'name' | 'capacity', value: any) => {
    setPersonnel(personnel.map(c => c.id === id ? { ...c, [field]: value } : c))
  }
  const addPersonnel = () => {
    setPersonnel([...personnel, { id: Math.random().toString(), name: 'Nouveau Personnel', capacity: 0 }])
  }
  const removePersonnel = (id: string) => {
    setPersonnel(personnel.filter(c => c.id !== id))
  }

  const updateSpecialite = (id: string, value: number) => {
    setSpecialites(specialites.map(c => c.id === id ? { ...c, capacity: value } : c))
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <GraduationCap className="text-discord-blurple w-8 h-8" />
          Effectifs & Professeurs
        </h2>
        <p className="text-discord-muted mt-2">Gérez les places disponibles par matière et déployez la liste publiquement.</p>
      </div>

      {feedback && (
        <div className={clsx(
          "p-4 rounded-xl font-bold flex items-center gap-2",
          feedback.includes('✅') || feedback.includes('✨') ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
        )}>
          {feedback.includes('✅') || feedback.includes('✨') ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Paramètres & Boutons */}
        <div className="glass-card p-6 space-y-6 self-start">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Configuration Discord
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">ID du Salon (Effectifs)</label>
            <input
              type="text"
              value={salonDiscord}
              onChange={e => setSalonDiscord(e.target.value)}
              placeholder="123456789..."
              className="glass-input w-full"
            />
            <p className="text-xs text-discord-muted">Le message sera envoyé et mis à jour dans ce salon.</p>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn bg-white/10 hover:bg-white/20 text-white flex-1 py-3 font-bold flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Sauvegarder
            </button>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white flex-1 py-3 font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(88,101,242,0.3)] disabled:opacity-50 disabled:shadow-none"
            >
              {deploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Déployer
            </button>
          </div>
        </div>

        {/* Personnel Scolaire */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">Personnel Scolaire</h3>
            <button onClick={addPersonnel} className="p-2 rounded-xl bg-discord-success/20 text-discord-success hover:bg-discord-success/30 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {personnel.length === 0 && <p className="text-discord-muted italic text-center py-4">Aucun personnel enregistré.</p>}
            {personnel.map(p => (
              <div key={p.id} className="flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                <input 
                  type="text" 
                  value={p.name} 
                  onChange={e => updatePersonnel(p.id, 'name', e.target.value)}
                  className="glass-input flex-1 min-w-0"
                  placeholder="Nom du rôle"
                />
                <input 
                  type="number" 
                  value={p.capacity} 
                  onChange={e => updatePersonnel(p.id, 'capacity', parseInt(e.target.value) || 0)}
                  className="glass-input !w-16 !px-2 shrink-0 text-center font-mono"
                  min="0"
                />
                <button onClick={() => removePersonnel(p.id)} className="p-2 text-discord-error hover:bg-discord-error/20 rounded-lg shrink-0">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matières Classiques */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">Matières Classiques</h3>
            <button onClick={addClassique} className="p-2 rounded-xl bg-discord-success/20 text-discord-success hover:bg-discord-success/30 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {classiques.length === 0 && <p className="text-discord-muted italic text-center py-4">Aucune matière enregistrée.</p>}
            {classiques.map(c => (
              <div key={c.id} className="flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                <input 
                  type="text" 
                  value={c.name} 
                  onChange={e => updateClassique(c.id, 'name', e.target.value)}
                  className="glass-input flex-1 min-w-0"
                  placeholder="Nom de la matière"
                />
                <input 
                  type="number" 
                  value={c.capacity} 
                  onChange={e => updateClassique(c.id, 'capacity', parseInt(e.target.value) || 0)}
                  className="glass-input !w-16 !px-2 shrink-0 text-center font-mono"
                  min="0"
                />
                <button onClick={() => removeClassique(c.id)} className="p-2 text-discord-error hover:bg-discord-error/20 rounded-lg shrink-0">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Spécialités (Read-only names, editable capacities) */}
        <div className="glass-card p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">Spécialités / Options</h3>
            <p className="text-xs text-discord-muted mt-1">La liste est générée depuis l'onglet d'administration des spécialités.</p>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {specialites.length === 0 && <p className="text-discord-muted italic text-center py-4">Aucune spécialité trouvée.</p>}
            {specialites.map(s => (
              <div key={s.id} className="flex gap-3 items-center bg-black/20 p-2 rounded-xl border border-white/5">
                <div className="flex-1 px-3 text-white font-medium">{s.name}</div>
                <input 
                  type="number" 
                  value={s.capacity} 
                  onChange={e => updateSpecialite(s.id, parseInt(e.target.value) || 0)}
                  className="glass-input !w-20 !px-2 text-center font-mono bg-white/5 shrink-0"
                  min="0"
                  placeholder="Places"
                />
              </div>
            ))}
            <p className="text-[10px] text-discord-warning text-center mt-4">⚠️ Pensez à "Sauvegarder" avant de déployer !</p>
          </div>
        </div>
      </div>
    </div>
  )
}
