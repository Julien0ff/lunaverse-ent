'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  BookOpen, Calendar, CheckCircle2, Clock, Trash2,
  Loader2, GraduationCap, RefreshCw
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

// Classes masquées temporairement
const HIDDEN_CLASSES = ['2gt1', '3pm', '2pro1']

function isHiddenClass(className: string): boolean {
  if (!className) return false
  const clean = className.toLowerCase().replace(/[^a-z0-9]/g, '')
  return HIDDEN_CLASSES.includes(clean)
}

/**
 * Compare deux dénominations de classe en tenant compte des alias courants (3GA, 3A, 3ea, 3ème A, etc.)
 */
function areClassesMatching(targetClass: string, selectedClass: string): boolean {
  if (!targetClass || !selectedClass) return false
  if (selectedClass === 'all' || targetClass === 'all') return true

  const cleanTarget = targetClass.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  const cleanSelected = selectedClass.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

  if (cleanTarget === cleanSelected) return true

  const is3A_Target = ['3ga', '3a', '3ea', '3emea', '3eme'].includes(cleanTarget)
  const is3A_Selected = ['3ga', '3a', '3ea', '3emea', '3eme'].includes(cleanSelected)
  if (is3A_Target && is3A_Selected) return true

  return cleanTarget.includes(cleanSelected) || cleanSelected.includes(cleanTarget)
}

export default function DevoirsPage() {
  const { roles, profile } = useAuth()

  // Détection des rôles
  const isAdmin = roles.some(r =>
    ['admin', 'direction', 'cpe', 'principal', 'nova'].includes(r.name.toLowerCase().trim())
  )
  const isTeacher = !isAdmin && roles.some(r =>
    ['professeur', 'prof'].includes(r.name.toLowerCase().trim())
  )
  const isStudent = !isAdmin && !isTeacher

  const [loading, setLoading] = useState(true)
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [classes, setClasses] = useState<{ name: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')

  // Déterminer la classe personnelle de l'élève
  const studentClass = useMemo(() => {
    const matchedClass = classes.find(c =>
      roles.some(r => areClassesMatching(r.name, c.name))
    )
    if (matchedClass) return matchedClass.name

    const has3A = roles.some(r => {
      const clean = r.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return clean.includes('3a') || clean.includes('3ga') || clean.includes('3ea')
    })
    if (has3A) {
      const class3 = classes.find(c => areClassesMatching(c.name, '3GA'))
      if (class3) return class3.name
    }

    return classes[0]?.name || '3GA'
  }, [roles, classes])

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
        const clsList = (cData.classes || []).filter((c: any) => !isHiddenClass(c.name))
        setClasses(clsList)
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

  // Initialisation de la classe sélectionnée
  useEffect(() => {
    if (classes.length > 0) {
      if (isStudent) {
        setSelectedClass(studentClass)
      } else if (selectedClass === 'all' && !isAdmin) {
        setSelectedClass(classes[0]?.name || 'all')
      }
    }
  }, [classes, isStudent, studentClass, isAdmin, selectedClass])

  const handleToggleComplete = async (hw: Homework) => {
    const nextCompleted = !hw.completed
    // Mise à jour optimiste
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

  // Filtrage selon le rôle : l'élève ne voit STRICTEMENT que sa classe
  const filteredHomeworks = useMemo(() => {
    return homeworks.filter(hw => {
      // Exclure classes masquées
      if (isHiddenClass(hw.target_class)) return false

      if (isStudent) {
        return areClassesMatching(hw.target_class, studentClass)
      }

      if (selectedClass === 'all') return true
      return areClassesMatching(hw.target_class, selectedClass)
    })
  }, [homeworks, selectedClass, isStudent, studentClass])

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
              <h1 className="text-3xl font-black text-white tracking-tight">
                {isStudent ? 'Mes Devoirs & Travaux' : 'Devoirs & Cahier de Textes'}
              </h1>
              <p className="text-discord-muted text-sm font-medium">
                {isStudent ? (
                  <>Travaux synchronisés depuis Pronote pour la <span className="text-white font-bold">Classe {studentClass}</span></>
                ) : (
                  <>Consultez les devoirs synchronisés automatiquement depuis Pronote.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton rafraîchir */}
        <button
          onClick={loadData}
          disabled={loading}
          className="btn bg-white/5 hover:bg-white/10 text-discord-muted hover:text-white p-2.5 rounded-xl border border-white/10 transition-colors flex items-center gap-2 text-xs font-bold self-start md:self-auto"
          title="Actualiser les devoirs"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Barre d'état & filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1 : À faire */}
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

        {/* Stat 3 / Contrôle classe : Badge personnel pour l'élève, sélecteur pour l'admin/prof */}
        {isStudent ? (
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-discord-muted">Classe assignée</p>
              <p className="text-xl font-black text-white">Classe {studentClass}</p>
            </div>
          </div>
        ) : (
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
                    areClassesMatching(selectedClass, c.name) && selectedClass !== 'all' ? "bg-purple-600 text-white" : "bg-white/5 text-discord-muted hover:text-white"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
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
            Super ! Aucun devoir n'est programmé actuellement pour {isStudent ? `votre classe (${studentClass})` : selectedClass !== 'all' ? `la ${selectedClass}` : 'les classes sélectionnées'}.
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

                {/* Échéance & Actions (Suppression admin uniquement) */}
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

                  {isAdmin && (
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
    </div>
  )
}
