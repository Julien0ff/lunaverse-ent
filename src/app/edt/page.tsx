'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar, Clock, MapPin, User, AlertTriangle, XCircle, CheckCircle2,
  Loader2, RefreshCw, Shield, GraduationCap
} from 'lucide-react'
import clsx from 'clsx'

interface Course {
  id: string
  target_class: string
  subject: string
  teacher_name: string
  room: string
  day_of_week: number // 6 = Samedi, 0 = Dimanche
  start_time: string
  end_time: string
  color: string
  status: 'normal' | 'modifie' | 'deplace' | 'annule' | 'prof_absent'
  status_note?: string
}

// Classes masquées temporairement à la demande de l'utilisateur
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

  // Groupe d'alias 3ème Générale A
  const is3A_Target = ['3ga', '3a', '3ea', '3emea', '3eme'].includes(cleanTarget)
  const is3A_Selected = ['3ga', '3a', '3ea', '3emea', '3eme'].includes(cleanSelected)
  if (is3A_Target && is3A_Selected) return true

  return cleanTarget.includes(cleanSelected) || cleanSelected.includes(cleanTarget)
}

export default function TimetablePage() {
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
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<{ name: string; roleId?: string; channelId?: string }[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<number>(6) // Samedi (6) par défaut
  const [lastSync, setLastSync] = useState<string>('')

  // Heure actuelle pour le badge "En cours"
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Déterminer la classe personnelle de l'élève
  const studentClass = useMemo(() => {
    // 1. Recherche par rôle concordant avec une classe visible
    const matchedClass = classes.find(c =>
      roles.some(r => areClassesMatching(r.name, c.name))
    )
    if (matchedClass) return matchedClass.name

    // 2. Recherche par indicateur 3ème / 3A dans les rôles
    const has3A = roles.some(r => {
      const clean = r.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return clean.includes('3a') || clean.includes('3ga') || clean.includes('3ea')
    })
    if (has3A) {
      const class3 = classes.find(c => areClassesMatching(c.name, '3GA'))
      if (class3) return class3.name
    }

    // 3. Fallback sur la première classe active (ex: 3GA)
    return classes[0]?.name || '3GA'
  }, [roles, classes])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/edt')
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          setCourses(data.courses || [])

          // Filtrer les classes pour exclure les classes masquées (2GT1, 3PM, 2PRO1)
          const dynamicClasses = (data.classes || []).filter((c: any) => !isHiddenClass(c.name))
          setClasses(dynamicClasses)

          setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
        }
      }
    } catch (e) {
      console.error('Erreur chargement EDT:', e)
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
      } else if (!selectedClass) {
        setSelectedClass('all')
      }
    }
  }, [classes, isStudent, studentClass, selectedClass])

  // Filtrer les cours pour le jour et la classe sélectionnés
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Exclure formellement les cours des classes masquées (2GT1, 3PM, 2PRO1)
      if (isHiddenClass(c.target_class)) return false

      const matchesDay = c.day_of_week === selectedDay

      // Cas 1 : L'élève ne voit strictement QUE sa classe personnelle
      if (isStudent) {
        const isStudentOwnClass = areClassesMatching(c.target_class, studentClass)
        return matchesDay && isStudentOwnClass
      }

      // Cas 2 : Enseignant filtrant sur ses propres cours
      if (isTeacher && selectedClass === 'my_courses') {
        const teacherName = (profile?.nickname_rp || profile?.username || '').toLowerCase().trim()
        const isMyCourse = teacherName && c.teacher_name?.toLowerCase().includes(teacherName)
        return matchesDay && isMyCourse
      }

      // Cas 3 : Administrateur ou enseignant consultant une classe ou toutes
      const matchesClass = !selectedClass || selectedClass === 'all' || areClassesMatching(c.target_class, selectedClass)
      return matchesDay && matchesClass
    })
  }, [courses, selectedDay, selectedClass, isStudent, studentClass, isTeacher, profile])

  // Détection du cours actuellement en cours
  const isCourseOngoing = (c: Course) => {
    const currentDay = now.getDay()
    if (currentDay !== c.day_of_week) return false
    const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const startStr = c.start_time.slice(0, 5)
    const endStr = c.end_time.slice(0, 5)
    return nowTimeStr >= startStr && nowTimeStr <= endStr && c.status === 'normal'
  }

  return (
    <div className="page-container max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideIn">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-discord-blurple/20 rounded-2xl border border-discord-blurple/30 shadow-lg shadow-discord-blurple/10">
              <Calendar className="w-8 h-8 text-discord-blurple" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {isStudent ? 'Mon Emploi du Temps' : 'Emploi du Temps'}
              </h1>
              <p className="text-discord-muted text-sm font-medium">
                {isStudent ? (
                  <>Planning personnel des cours • <span className="text-white font-bold">Classe {studentClass}</span></>
                ) : (
                  <>Planning des cours • <span className="text-white font-bold">Samedi & Dimanche</span> (12h00 - 19h30)</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Indicateur de synchro Pronote & Bouton Actualiser */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-discord-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Miroir Pronote</span>
            {lastSync && <span className="text-white/40">({lastSync})</span>}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-discord-muted hover:text-white transition-colors border border-white/10 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Barre de sélection : Jour & Vue */}
      <div className="glass-card p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Sélecteur de Jour (Samedi / Dimanche) */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDay(6)}
            className={clsx(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              selectedDay === 6
                ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/30"
                : "text-discord-muted hover:text-white hover:bg-white/5"
            )}
          >
            <Calendar className="w-4 h-4" />
            Samedi
            {now.getDay() === 6 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Aujourd'hui" />
            )}
          </button>
          <button
            onClick={() => setSelectedDay(0)}
            className={clsx(
              "flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              selectedDay === 0
                ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/30"
                : "text-discord-muted hover:text-white hover:bg-white/5"
            )}
          >
            <Calendar className="w-4 h-4" />
            Dimanche
            {now.getDay() === 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Aujourd'hui" />
            )}
          </button>
        </div>

        {/* Contrôles de filtrage : Mode Élève vs Mode Admin / Professeur */}
        {isStudent ? (
          // Affichage dédié à l'élève : Badge personnel sans possibilité de changer de classe
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-gray-200">
            <GraduationCap className="w-4 h-4 text-discord-blurple" />
            <span>Emploi du temps personnel :</span>
            <span className="px-2.5 py-1 rounded-xl bg-discord-blurple text-white font-black uppercase text-xs shadow-md shadow-discord-blurple/30">
              Classe {studentClass}
            </span>
          </div>
        ) : (
          // Affichage Admin & Enseignants : Choix des classes actives
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {isTeacher && (
              <button
                onClick={() => setSelectedClass('my_courses')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5",
                  selectedClass === 'my_courses'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-white/5 text-discord-muted hover:text-white hover:bg-white/10 border border-white/5"
                )}
              >
                <User className="w-3.5 h-3.5" />
                Mes cours
              </button>
            )}

            <button
              onClick={() => setSelectedClass('all')}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0",
                selectedClass === 'all'
                  ? "bg-white/20 text-white border border-white/20 shadow-md"
                  : "bg-white/5 text-discord-muted hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              Toutes les classes
            </button>

            {classes.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedClass(c.name)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0",
                  areClassesMatching(selectedClass, c.name) && selectedClass !== 'all' && selectedClass !== 'my_courses'
                    ? "bg-discord-blurple text-white border border-discord-blurple shadow-lg shadow-discord-blurple/20"
                    : "bg-white/5 text-discord-muted hover:text-white hover:bg-white/10 border border-white/5"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grille des Cours */}
      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 animate-spin text-discord-blurple mb-4" />
          <p className="text-discord-muted font-bold">Synchronisation des cours...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-discord-muted mb-4 border border-white/10">
            <Clock className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Aucun cours programmé</h3>
          <p className="text-discord-muted text-sm max-w-md">
            Il n'y a aucun cours sur l'emploi du temps pour le {selectedDay === 6 ? 'Samedi' : 'Dimanche'} {isStudent ? `pour votre classe (${studentClass})` : selectedClass && selectedClass !== 'all' ? `en ${selectedClass}` : ''}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const isOngoing = isCourseOngoing(course)
            const isCancelled = course.status === 'annule' || course.status === 'prof_absent'
            const isModified = course.status === 'modifie' || course.status === 'deplace'

            return (
              <div
                key={course.id}
                className={clsx(
                  "relative rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between group overflow-hidden",
                  isOngoing
                    ? "bg-discord-blurple/15 border-discord-blurple/60 shadow-[0_0_30px_rgba(88,101,242,0.25)] ring-1 ring-discord-blurple/50"
                    : isCancelled
                    ? "bg-rose-950/20 border-rose-500/30 opacity-80"
                    : isModified
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "glass-card hover:border-white/20"
                )}
              >
                {/* Liseré de couleur matière */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
                  style={{ backgroundColor: course.color || '#5865F2' }}
                />

                <div>
                  {/* Badge en-tête : Classe + Statut */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/5">
                      {course.target_class}
                    </span>

                    <div className="flex items-center gap-2">
                      {isOngoing && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          En cours
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {course.status === 'prof_absent' ? 'Prof Absent' : 'Annulé'}
                        </span>
                      )}
                      {isModified && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Modifié
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matière */}
                  <h3 className={clsx(
                    "text-2xl font-black tracking-tight mb-2",
                    isCancelled ? "line-through text-white/50" : "text-white"
                  )}>
                    {course.subject}
                  </h3>

                  {/* Horaires */}
                  <div className="flex items-center gap-2 text-discord-blurple font-bold text-sm mb-4">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {course.start_time.slice(0, 5)} - {course.end_time.slice(0, 5)}
                    </span>
                  </div>

                  {/* Salle et Professeur */}
                  <div className="space-y-2 border-t border-white/5 pt-3 text-sm">
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <MapPin className="w-4 h-4 text-discord-muted shrink-0" />
                      <span className="font-semibold">{course.room || 'Salle non précisée'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <User className="w-4 h-4 text-discord-muted shrink-0" />
                      <span className="font-semibold">{course.teacher_name || 'Professeur non spécifié'}</span>
                    </div>
                  </div>

                  {/* Note de modification / motif d'absence */}
                  {course.status_note && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{course.status_note}</span>
                    </div>
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
