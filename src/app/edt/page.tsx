'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar, Clock, MapPin, User, AlertTriangle, XCircle, CheckCircle2,
  Loader2, Sparkles, Filter, RefreshCw, Check
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

export default function TimetablePage() {
  const { roles } = useAuth()

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

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/edt')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
        const dynamicClasses = data.classes || []
        setClasses(dynamicClasses)

        // Définir la classe par défaut dynamiquement
        if (dynamicClasses.length > 0 && !selectedClass) {
          // Si l'utilisateur possède un rôle correspondant à une classe dynamique
          const userClass = dynamicClasses.find((c: any) =>
            roles.some(r => r.name.toLowerCase().trim() === c.name.toLowerCase().trim())
          )
          if (userClass) {
            setSelectedClass(userClass.name)
          } else {
            setSelectedClass(dynamicClasses[0].name)
          }
        }
        setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
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

  // Filtrer les cours pour le jour et la classe sélectionnés
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesDay = c.day_of_week === selectedDay
      const matchesClass = !selectedClass || selectedClass === 'all' || 
        c.target_class.toLowerCase().trim() === selectedClass.toLowerCase().trim() || 
        c.target_class === 'all'
      return matchesDay && matchesClass
    })
  }, [courses, selectedDay, selectedClass])

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
              <h1 className="text-3xl font-black text-white tracking-tight">Emploi du Temps</h1>
              <p className="text-discord-muted text-sm font-medium">
                Planning des cours • <span className="text-white font-bold">Samedi & Dimanche</span> (12h00 - 19h30)
              </p>
            </div>
          </div>
        </div>

        {/* Indicateur de synchro Pronote */}
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

      {/* Barre de sélection : Jour & Classe */}
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

        {/* Filtre Classes Dynamiques (Page Classes) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
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
                selectedClass.toLowerCase().trim() === c.name.toLowerCase().trim()
                  ? "bg-discord-blurple text-white border border-discord-blurple shadow-lg shadow-discord-blurple/20"
                  : "bg-white/5 text-discord-muted hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
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
            Il n'y a aucun cours sur l'emploi du temps pour le {selectedDay === 6 ? 'Samedi' : 'Dimanche'} {selectedClass && selectedClass !== 'all' ? `en ${selectedClass}` : ''}.
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
