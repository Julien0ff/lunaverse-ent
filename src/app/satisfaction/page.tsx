'use client'

import { useState, useEffect } from 'react'
import { Save, Check, Smartphone, Monitor, ClipboardList } from 'lucide-react'
import clsx from 'clsx'

export default function PublicSatisfactionPage() {
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/satisfaction')
      .then(res => res.json())
      .then(data => {
        if (data.form) setForm(data.form)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (customUpdates?: any) => {
    setSaving(true)
    const payload = customUpdates ? { ...form, ...customUpdates } : { ...form }
    try {
      const res = await fetch(`/api/satisfaction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        setForm(data.form)
        if (customUpdates?.status === 'completed') {
           alert('Merci beaucoup pour vos retours ! Votre questionnaire a été envoyé.')
        }
      } else {
        const err = await res.json()
        alert(`Erreur: ${err.error}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-lg">Chargement de votre questionnaire...</div>
  if (!form) return <div className="p-20 text-center text-discord-error">Erreur lors de la récupération du questionnaire.</div>

  if (form.status === 'completed') {
    return (
      <div className="page-container max-w-2xl mx-auto py-20 px-4 text-center">
        <Check className="w-20 h-20 text-discord-success mx-auto mb-6 drop-shadow-md" />
        <h1 className="text-4xl font-black text-white mb-4">Merci pour vos retours !</h1>
        <p className="text-discord-muted text-lg">Votre questionnaire a bien été pris en compte. L'équipe étudiera vos réponses avec attention pour améliorer l'ENT.</p>
      </div>
    )
  }

  return (
    <div className="page-container max-w-4xl mx-auto pb-32 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-slideIn">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-discord-blurple" />
            Votre Avis nous intéresse !
          </h1>
          <p className="text-discord-muted mt-2">Aidez-nous à améliorer le serveur et l'ENT en répondant à ces quelques questions.</p>
        </div>
        <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary px-6 shadow-lg shadow-discord-blurple/20">
          <Save className="w-5 h-5" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="glass-card mb-6">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/10 pb-4">1. Inscription & Arrivée</h3>
          
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
              <label className="text-xs font-bold text-discord-muted uppercase mb-3 block">Accueil sur le Serveur Discord (1 à 10)</label>
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

        <div className="glass-card mb-6">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/10 pb-4">2. Expérience Pronote</h3>
          
          <div className="flex flex-col gap-8 mb-6">
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
            <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Bugs ou suggestions sur Pronote</label>
            <textarea 
              value={form.q_pronote_exp || ''}
              onChange={e => setForm({...form, q_pronote_exp: e.target.value})}
              className="glass-input min-h-[100px]"
              placeholder="Ressenti sur l'interface, problèmes rencontrés..."
            />
          </div>
        </div>

        <div className="glass-card mb-6">
          <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 border-b border-white/10 pb-4">3. L'ENT Global</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Ce qui vous plaît le plus</label>
              <textarea 
                value={form.q_ent_likes || ''}
                onChange={e => setForm({...form, q_ent_likes: e.target.value})}
                className="glass-input min-h-[100px]"
                placeholder="Quelles sont vos fonctionnalités préférées ?"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-discord-muted uppercase mb-2 block">Ce qui manque / Améliorations possibles</label>
              <textarea 
                value={form.q_ent_improvements || ''}
                onChange={e => setForm({...form, q_ent_improvements: e.target.value})}
                className="glass-input min-h-[100px]"
                placeholder="Qu'est-ce qu'on pourrait faire de mieux ? (Ressenti global libre...)"
              />
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 bg-discord-blurple/5 border-discord-blurple/20">
          <div>
            <h4 className="font-bold text-white">Prêt à envoyer ?</h4>
            <p className="text-discord-muted text-sm mt-1">Vous ne pourrez plus modifier vos réponses une fois envoyées.</p>
          </div>
          <button 
            onClick={() => handleSave({ status: 'completed' })}
            className="btn bg-discord-success text-black font-black hover:bg-discord-success/80 px-8 w-full md:w-auto shadow-lg shadow-discord-success/20"
          >
            <Check className="w-5 h-5" />
            Envoyer mon Questionnaire
          </button>
        </div>
      </div>
    </div>
  )
}
