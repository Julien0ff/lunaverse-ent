'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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

  const cleanTarget = targetClass.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const cleanSelected = selectedClass.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  if (cleanTarget === cleanSelected) return true

  // Mots-clés universels (cours pour toute l'école / tout le monde)
  const universal = ['all', 'tous', 'toutes', 'general', 'generale', 'commun', 'commune', 'tout']
  const targetAlnum = cleanTarget.replace(/[^a-z0-9]/g, '')
  const selectedAlnum = cleanSelected.replace(/[^a-z0-9]/g, '')

  if (universal.includes(targetAlnum) || universal.includes(selectedAlnum)) return true
  if (targetAlnum === selectedAlnum) return true

  // Groupe d'alias 3ème Générale A
  const is3A_Target = ['3ga', '3a', '3ea', '3emea', '3eme', 'troisieme'].some(t => targetAlnum.includes(t))
  const is3A_Selected = ['3ga', '3a', '3ea', '3emea', '3eme', 'troisieme'].some(t => selectedAlnum.includes(t))
  if (is3A_Target && is3A_Selected) return true

  // Nettoyage des préfixes "classe", "groupe"
  const strip = (s: string) => s.replace(/^(classe|groupe|niveau)/i, '').replace(/[^a-z0-9]/g, '').trim()
  const sTarget = strip(cleanTarget)
  const sSelected = strip(cleanSelected)
  if (sTarget && sSelected) {
    if (sTarget === sSelected) return true
    if (sTarget.includes(sSelected) || sSelected.includes(sTarget)) return true
  }

  return targetAlnum.includes(selectedAlnum) || selectedAlnum.includes(targetAlnum)
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
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<number>(6) // Samedi (6) par défaut, ou -1 pour tous
  const [lastSync, setLastSync] = useState<string>('')
  const [apiStudentClass, setApiStudentClass] = useState<string | null>(null)
  const initialClassSet = useRef(false)
  const initialDaySet = useRef(false)

  // Heure actuelle pour le badge "En cours"
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Déterminer la classe personnelle de l'élève
  const studentClass = useMemo(() => {
    // 1. Classe détectée côté serveur via inscriptions ou profil
    if (apiStudentClass) return apiStudentClass

    // 2. Chercher dans les rôles Discord si un rôle correspond à une classe
    const matchedClass = classes.find(c =>
      roles.some(r => areClassesMatching(r.name, c.name))
    )
    if (matchedClass) return matchedClass.name

    // 3. Chercher dans les rôles si un rôle contient "3A", "3GA" ou "3EA"
    const has3A = roles.some(r => {
      const clean = r.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return clean.includes('3a') || clean.includes('3ga') || clean.includes('3ea')
    })
    if (has3A) return '3GA'

    // 4. Chercher dans le pseudo RP (ex: "3GA・Pseudo")
    if (profile?.nickname_rp && profile.nickname_rp.includes('・')) {
      const prefix = profile.nickname_rp.split('・')[0].trim()
      const foundInClasses = classes.find(c => areClassesMatching(c.name, prefix))
      if (foundInClasses) return foundInClasses.name
      if (prefix) return prefix
    }

    // 5. Classe par défaut dans LunaVerse pour les élèves
    const class3 = classes.find(c => areClassesMatching(c.name, '3GA'))
    if (class3) return class3.name

    return '3GA'
  }, [apiStudentClass, roles, classes, profile])

  // Déterminer les jours disponibles (Samedi, Dimanche, et tout autre jour ayant des cours enregistrés)
  const availableDays = useMemo(() => {
    const courseDays = new Set(courses.map(c => c.day_of_week))
    courseDays.add(6) // Samedi
    courseDays.add(0) // Dimanche

    const ALL_DAYS = [
      { day: 6, label: 'Samedi' },
      { day: 0, label: 'Dimanche' },
      { day: 1, label: 'Lundi' },
      { day: 2, label: 'Mardi' },
      { day: 3, label: 'Mercredi' },
      { day: 4, label: 'Jeudi' },
      { day: 5, label: 'Vendredi' },
    ]

    return ALL_DAYS.filter(d => courseDays.has(d.day))
  }, [courses])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/edt')
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          setCourses(data.courses || [])
          if (data.studentClass) {
            setApiStudentClass(data.studentClass)
          }

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

  // Initialisation de la classe sélectionnée une seule fois
  useEffect(() => {
    if (!initialClassSet.current && classes.length > 0) {
      if (!isStudent) {
        setSelectedClass('all')
      }
      initialClassSet.current = true
    }
  }, [classes, isStudent])

  // Sélection intelligente du jour initial dès que les cours sont chargés
  useEffect(() => {
    if (!initialDaySet.current && courses.length > 0) {
      const today = new Date().getDay()
      const relevantCourses = courses.filter(c => {
        if (isHiddenClass(c.target_class)) return false
        if (isStudent) return areClassesMatching(c.target_class, studentClass)
        return true
      })

      const hasTodayCourses = relevantCourses.some(c => c.day_of_week === today)
      if (hasTodayCourses) {
        setSelectedDay(today)
      } else {
        const hasSaturdayCourses = relevantCourses.some(c => c.day_of_week === 6)
        if (hasSaturdayCourses) {
          setSelectedDay(6)
        } else {
          const firstDay = relevantCourses[0]
          if (firstDay) {
            setSelectedDay(firstDay.day_of_week)
          } else {
            setSelectedDay(6)
          }
        }
      }
      initialDaySet.current = true
    }
  }, [courses, isStudent, studentClass])

  // Nombre de cours par jour pour l'utilisateur connecté
  const dayCourseCount = useMemo(() => {
    const counts: Record<number, number> = {}
    courses.forEach(c => {
      if (isHiddenClass(c.target_class)) return
      if (isStudent && !areClassesMatching(c.target_class, studentClass)) return
      if (!isStudent && selectedClass !== 'all' && selectedClass !== 'my_courses' && !areClassesMatching(c.target_class, selectedClass)) return
      counts[c.day_of_week] = (counts[c.day_of_week] || 0) + 1
    })
    return counts
  }, [courses, isStudent, studentClass, selectedClass])

  const totalCourseCount = useMemo(() => {
    return Object.values(dayCourseCount).reduce((a, b) => a + b, 0)
  }, [dayCourseCount])

  // Filtrer les cours pour le jour et la classe sélectionnés
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Exclure formellement les cours des classes masquées (2GT1, 3PM, 2PRO1)
      if (isHiddenClass(c.target_class)) return false

      const matchesDay = selectedDay === -1 || c.day_of_week === selectedDay

      // Si l'utilisateur est un élève : STRICTEMENT les cours de SA classe (ou annonces générales)
      if (isStudent) {
        return matchesDay && areClassesMatching(c.target_class, studentClass)
      }

      // Enseignant filtrant sur ses propres cours
      if (isTeacher && selectedClass === 'my_courses') {
        const teacherName = (profile?.nickname_rp || profile?.username || '').toLowerCase().trim()
        const isMyCourse = teacherName && c.teacher_name?.toLowerCase().includes(teacherName)
        return matchesDay && isMyCourse
      }

      // Filtrage par classe pour le staff/profs (ou toutes si 'all')
      const matchesClass = !selectedClass || selectedClass === 'all' || areClassesMatching(c.target_class, selectedClass)
      return matchesDay && matchesClass
    })
  }, [courses, selectedDay, selectedClass, isTeacher, isStudent, studentClass, profile])

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
                  <>Planning des cours synchronisés depuis Pronote pour votre classe (<span className="text-white font-bold">{studentClass}</span>)</>
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
        {/* Sélecteur de Jour */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          {availableDays.map(d => {
            const count = dayCourseCount[d.day] || 0
            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={clsx(
                  "flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0",
                  selectedDay === d.day
                    ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/30"
                    : "text-discord-muted hover:text-white hover:bg-white/5"
                )}
              >
                <Calendar className="w-4 h-4" />
                <span>{d.label}</span>
                <span className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                  selectedDay === d.day ? "bg-white/20 text-white" : "bg-white/10 text-discord-muted"
                )}>
                  {count}
                </span>
                {now.getDay() === d.day && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Aujourd'hui" />
                )}
              </button>
            )
          })}
          <button
            onClick={() => setSelectedDay(-1)}
            className={clsx(
              "flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0",
              selectedDay === -1
                ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/30"
                : "text-discord-muted hover:text-white hover:bg-white/5"
            )}
          >
            <span>Tous les jours</span>
            <span className={clsx(
              "text-[10px] px-1.5 py-0.5 rounded-full font-black",
              selectedDay === -1 ? "bg-white/20 text-white" : "bg-white/10 text-discord-muted"
            )}>
              {totalCourseCount}
            </span>
          </button>
        </div>

        {/* Contrôles de classe : Badge unique pour les élèves, sélecteur pour l'administration/professeurs */}
        {isStudent ? (
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-xs shrink-0 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Votre classe : <strong className="text-white">Classe {studentClass}</strong></span>
            </span>
          </div>
        ) : (
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
            {isStudent
              ? (selectedDay === -1
                ? `Aucun cours n'est actuellement programmé pour votre classe (${studentClass}).`
                : `Aucun cours n'est programmé ce jour pour votre classe (${studentClass}).`
              )
              : (selectedDay === -1
                ? `Il n'y a aucun cours programmé sur l'ensemble de la semaine${selectedClass && selectedClass !== 'all' ? ` pour la classe ${selectedClass}` : ''}.`
                : `Il n'y a aucun cours sur l'emploi du temps pour ce jour${selectedClass && selectedClass !== 'all' ? ` pour la classe ${selectedClass}` : ''}.`
              )
            }
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {selectedDay !== -1 && (
              <button
                onClick={() => setSelectedDay(-1)}
                className="px-4 py-2 rounded-xl bg-discord-blurple/20 hover:bg-discord-blurple/30 text-discord-blurple font-bold text-xs transition-all border border-discord-blurple/30"
              >
                Voir tous les jours
              </button>
            )}
            {!isStudent && selectedClass !== 'all' && (
              <button
                onClick={() => setSelectedClass('all')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all border border-white/10"
              >
                Voir toutes les classes
              </button>
            )}
          </div>
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
                  {/* Badge en-tête : Classe + Jour si "Tous les jours" + Statut */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/5">
                        {course.target_class}
                      </span>
                      {selectedDay === -1 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30">
                          {course.day_of_week === 6 ? 'Samedi' : course.day_of_week === 0 ? 'Dimanche' : `Jour ${course.day_of_week}`}
                        </span>
                      )}
                    </div>

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
