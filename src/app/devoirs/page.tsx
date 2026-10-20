'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  BookOpen, Calendar, CheckCircle2, Clock, Plus, Trash2,
  Loader2, Filter, AlertCircle, CheckSquare, Square, Info
} from 'lucide-react'
import clsx from 'clsx'

interface Homework {
  id: string
  target_class: string
  subject: string
  title: string
  description?: string
  due_date: string
  teacher_name?: string
  completed?: boolean
}

export default function DevoirsPage() {
  const { roles, profile } = useAuth()
  const isStaff = roles.some(r => ['admin', 'professeur', 'direction', 'cpe'].includes(r.name.toLowerCase()))

  const [loading, setLoading] = useState(true)
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [classes, setClasses] = useState<{ name: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')

  // Modale ajout
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string>('')

  // Formulaire
  const [formData, setFormData] = useState({
    target_class: '',
    subject: 'Mathématiques',
    title: '',
    description: '',
    due_date: '',
    teacher_name: '',
    notify_discord: true
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [hwRes, clsRes] = await Promise.all([
        fetch('/api/devoirs'),
        fetch('/api/admin/classes')
      ])

      if (hwRes.ok) {
        const data = await hwRes.json()
        setHomeworks(data.homeworks || [])
      }

      if (clsRes.ok) {
        const cData = await clsRes.json()
        const clsList = cData.classes || []
        setClasses(clsList)
        if (clsList.length > 0 && selectedClass === 'all') {
          const userClass = clsList.find((c: any) => 
            roles.some(r => r.name.toLowerCase().includes(c.name.toLowerCase()))
          )
          if (userClass) {
            setSelectedClass(userClass.name)
            setFormData(prev => ({ ...prev, target_class: userClass.name }))
          } else {
            setFormData(prev => ({ ...prev, target_class: clsList[0].name }))
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleComplete = async (hw: Homework) => {
    const nextCompleted = !hw.completed
    // Optimistic update
    setHomeworks(prev => prev.map(item => item.id === hw.id ? { ...item, completed: nextCompleted } : item))

    try {
      await fetch('/api/devoirs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homework_id: hw.id, completed: nextCompleted })
      })
    } catch (e) {
      console.error('Failed to update homework status:', e)
      // Rollback
      setHomeworks(prev => prev.map(item => item.id === hw.id ? { ...item, completed: !nextCompleted } : item))
    }
  }

  const handleOpenAdd = () => {
    // Calculer la date du prochain samedi
    const d = new Date()
    const diff = (6 - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    const nextSat = d.toISOString().split('T')[0]

    setFormData({
      target_class: selectedClass !== 'all' ? selectedClass : (classes[0]?.name || ''),
      subject: 'Mathématiques',
      title: '',
      description: '',
      due_date: nextSat,
      teacher_name: profile?.nickname_rp || profile?.username || '',
      notify_discord: true
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.due_date) return
    setSaving(true)
    setFeedback('')

    try {
      const res = await fetch('/api/devoirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setFeedback('✅ Devoir ajouté et publié sur Discord !')
        loadData()
        setTimeout(() => setFeedback(''), 4000)
      } else {
        const err = await res.json()
        setFeedback(`❌ Erreur: ${err.error || 'Impossible d\'ajouter le devoir'}`)
      }
    } catch (e) {
      setFeedback('❌ Erreur de communication avec le serveur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devoir ?')) return
    try {
      const res = await fetch(`/api/devoirs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter(hw => {
      return selectedClass === 'all' || hw.target_class.toLowerCase() === selectedClass.toLowerCase() || hw.target_class === 'all'
    })
  }, [homeworks, selectedClass])

  const stats = useMemo(() => {
    const total = filteredHomeworks.length
    const done = filteredHomeworks.filter(h => h.completed).length
    return { total, done, remaining: total - done }
  }, [filteredHomeworks])

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideIn">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Devoirs & Cahier de Textes</h1>
              <p className="text-discord-muted text-sm font-medium">
                Consultez vos travaux à rendre pour le week-end et suivez votre progression.
              </p>
            </div>
          </div>
        </div>

        {isStaff && (
          <button
            onClick={handleOpenAdd}
            className="btn bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-600/20 font-bold"
          >
            <Plus className="w-5 h-5" />
            Ajouter un Devoir
          </button>
        )}
      </div>

      {feedback && (
        <div className={clsx(
          "p-4 rounded-2xl font-bold flex items-center gap-3 animate-fadeIn",
          feedback.includes('✅') ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
        )}>
          {feedback.includes('✅') ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          {feedback}
        </div>
      )}

      {/* Barre d'état & filtre classe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1 : Restants */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-discord-muted">À faire</p>
            <p className="text-2xl font-black text-white">{stats.remaining} devoir{stats.remaining > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Stat 2 : Terminés */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-discord-muted">Terminés</p>
            <p className="text-2xl font-black text-white">{stats.done} devoir{stats.done > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filtre Classe */}
        <div className="glass-card p-4 flex flex-col justify-center">
          <label className="text-[10px] font-black uppercase tracking-widest text-discord-muted block mb-1.5">
            Filtrer par classe
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedClass('all')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors",
                selectedClass === 'all' ? "bg-purple-600 text-white" : "bg-white/5 text-discord-muted hover:text-white"
              )}
            >
              Toutes
            </button>
            {classes.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedClass(c.name)}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors",
                  selectedClass.toLowerCase() === c.name.toLowerCase() ? "bg-purple-600 text-white" : "bg-white/5 text-discord-muted hover:text-white"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des devoirs */}
      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-4" />
          <p className="text-discord-muted font-bold">Chargement des devoirs...</p>
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-discord-muted mb-4 border border-white/10">
            <BookOpen className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Aucun devoir à rendre</h3>
          <p className="text-discord-muted text-sm max-w-md">
            Super ! Aucun devoir n'est programmé actuellement pour {selectedClass !== 'all' ? `la ${selectedClass}` : 'les classes sélectionnées'}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHomeworks.map(hw => {
            const dueDate = new Date(hw.due_date)
            const dueFormatted = dueDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
            const isLate = !hw.completed && dueDate < new Date(new Date().setHours(0,0,0,0))

            return (
              <div
                key={hw.id}
                className={clsx(
                  "p-6 rounded-3xl transition-all duration-300 border flex flex-col md:flex-row md:items-start justify-between gap-5 group",
                  hw.completed
                    ? "bg-white/5 border-white/5 opacity-60 hover:opacity-80"
                    : isLate
                    ? "bg-rose-950/20 border-rose-500/30"
                    : "glass-card hover:border-purple-500/40"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Case à cocher pour l'élève */}
                  <button
                    onClick={() => handleToggleComplete(hw)}
                    className="mt-1 p-1 text-discord-muted hover:text-white transition-colors shrink-0"
                    title={hw.completed ? "Marquer comme à faire" : "Marquer comme fait"}
                  >
                    {hw.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg border-2 border-white/20 hover:border-purple-400 transition-colors" />
                    )}
                  </button>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {hw.subject}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-discord-muted border border-white/5">
                        {hw.target_class}
                      </span>
                      {hw.teacher_name && (
                        <span className="text-xs text-discord-muted font-medium">
                          • {hw.teacher_name}
                        </span>
                      )}
                    </div>

                    <h3 className={clsx(
                      "text-xl font-bold tracking-tight",
                      hw.completed ? "line-through text-white/50" : "text-white"
                    )}>
                      {hw.title}
                    </h3>

                    {hw.description && (
                      <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                        {hw.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Échéance & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-discord-muted">Pour le</p>
                    <p className={clsx(
                      "text-sm font-bold capitalize",
                      isLate ? "text-rose-400" : "text-purple-300"
                    )}>
                      {dueFormatted}
                    </p>
                  </div>

                  {isStaff && (
                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="p-2 rounded-xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer ce devoir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Ajout de Devoir */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Nouveau Devoir
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-discord-muted hover:text-white rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Classe</label>
                  <select
                    value={formData.target_class}
                    onChange={e => setFormData({ ...formData, target_class: e.target.value })}
                    className="glass-input w-full bg-[#18191c] text-white"
                    required
                  >
                    {classes.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    <option value="all">Toutes les classes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Matière</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="ex: Mathématiques"
                    className="glass-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Titre du devoir</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Exercices 12 et 14 p. 45"
                  className="glass-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Date limite</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="glass-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Professeur</label>
                  <input
                    type="text"
                    value={formData.teacher_name}
                    onChange={e => setFormData({ ...formData, teacher_name: e.target.value })}
                    placeholder="Nom du professeur"
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest block mb-1.5">Consignes détaillées</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails, consignes à respecter, matériel nécessaire..."
                  rows={4}
                  className="glass-input w-full"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.notify_discord}
                  onChange={e => setFormData({ ...formData, notify_discord: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                />
                <span className="text-xs font-bold text-white">
                  Publier l'annonce sur le salon Discord de la classe (avec ping du rôle)
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-discord-muted hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 flex items-center gap-2 text-sm font-bold"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
