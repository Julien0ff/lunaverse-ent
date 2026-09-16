'use client'

import { useState, useEffect, useMemo } from 'react'
import { Briefcase, ChevronDown, CheckCircle2, Copy, Loader2, Info, Users, MonitorPlay, GraduationCap, Gavel, FileText, Calendar, Clock, Lock, ArrowRight, ShieldCheck, Gamepad2, Mic2, FileSearch, HelpCircle, BookOpen, UserPlus, FileSignature, AlertCircle, Camera, Stethoscope, Scissors, ShieldAlert, FileQuestion, Megaphone, Coffee, Upload, Send, ClipboardCheck, Shield, Heart } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

// Fallback static info for known roles
const ROLE_TEMPLATES: Record<string, any> = {
  'Professeur': {
    icon: GraduationCap, color: 'discord-blurple',
    description: 'En tant que professeur, vous êtes le cœur de l\'enseignement à LunaVerse. Vous devrez préparer et donner des cours, encadrer les élèves et faire respecter la discipline dans vos classes.',
    requis: ['Maîtrise d\'une ou plusieurs matières (RP)', 'Bonne élocution et pédagogie', 'Patience et autorité naturelle', 'Activité régulière']
  },
  'AED': {
    icon: Shield, color: 'discord-error',
    description: 'Les AED sont les garants de la sécurité et du bon fonctionnement de l\'établissement. Vous gérerez les conflits, surveillerez les couloirs et appliquerez les sanctions.',
    requis: ['Sang-froid et fermeté face aux conflits', 'Bonne connaissance du règlement intérieur', 'Capacité à travailler en équipe', 'Impartialité']
  },
  'Infirmier(e)': {
    icon: Heart, color: 'discord-success',
    description: 'L\'infirmerie est un lieu de passage fréquent. Vous devrez soigner les petites blessures, gérer les urgences médicales et écouter les élèves dans le besoin.',
    requis: ['Bases du RP Médical / Secourisme', 'Grande écoute et empathie', 'Réactivité en cas d\'accident', 'Respect strict du secret médical']
  },
  'Psychologue': {
    icon: Users, color: 'discord-warning',
    description: 'Le/La psychologue de l\'école accompagne les élèves en difficulté (harcèlement, phobie scolaire, problèmes familiaux).',
    requis: ['Maturité et grand sens de l\'écoute', 'Capacité d\'analyse psychologique', 'Bon relationnel avec les jeunes', 'Très bonne orthographe']
  }
}

export default function RecrutementPage() {
  const { profile, ready } = useAuth()
  const [effectifs, setEffectifs] = useState<{ classiques: any[], personnel: any[] }>({ classiques: [], personnel: [] })
  const [loadingEffectifs, setLoadingEffectifs] = useState(true)

  const [myApplication, setMyApplication] = useState<any>(null)
  const [loadingApp, setLoadingApp] = useState(true)

  // Modals / States
  const [selectedRoleToApply, setSelectedRoleToApply] = useState<any>(null)

  // Form states
  const [rpFirstname, setRpFirstname] = useState('')
  const [rpLastname, setRpLastname] = useState('')
  const [motivation, setMotivation] = useState('')
  const [disponibilites, setDisponibilites] = useState('')
  const [selectedMatiere, setSelectedMatiere] = useState<string>('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchEffectifs = async () => {
      try {
        const res = await fetch('/api/recrutement/effectifs')
        if (res.ok) {
          const data = await res.json()
          setEffectifs(data.effectifs)
        }
      } catch (e) {
        console.error('Failed to load effectifs', e)
      } finally {
        setLoadingEffectifs(false)
      }
    }
    fetchEffectifs()
  }, [])

  useEffect(() => {
    if (!ready || !profile) {
      setLoadingApp(false)
      return
    }
    const fetchApp = async () => {
      try {
        const res = await fetch('/api/recrutement/my-application')
        if (res.ok) {
          const data = await res.json()
          setMyApplication(data.application || null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingApp(false)
      }
    }
    fetchApp()
    
    // Auto-refresh every 10 seconds to update timeline dynamically
    const intervalId = setInterval(fetchApp, 10000)
    return () => clearInterval(intervalId)
  }, [ready, profile])

  const handleLogin = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback?next=/recrutement`
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: redirectUrl }
    })
  }

  const handleSelectRole = (role: any) => {
    setSelectedRoleToApply(role)
    // Reset form
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedMatiere('')
  }

  const toggleMatiere = (mat: string) => {
    setSelectedMatiere(mat)
  }

  const handleSubmit = async (roleId: string) => {
    if (!rpFirstname || !rpLastname) {
      setErrorMsg('Veuillez renseigner votre Prénom et Nom RP.')
      return
    }
    if (roleId === 'Professeur' && !selectedMatiere) {
      setErrorMsg('Veuillez sélectionner au moins une matière.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      let cv_url = ''
      if (cvFile) {
        const ext = cvFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError, data } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile)

        if (uploadError) {
          console.error("CV Upload failed", uploadError)
        } else if (data) {
          const { data: publicData } = supabase.storage.from('cvs').getPublicUrl(data.path)
          cv_url = publicData.publicUrl
        }
      }

      const payload = {
        target_role: roleId,
        rp_firstname: rpFirstname,
        rp_lastname: rpLastname,
        motivation,
        disponibilites,
        matieres: selectedMatiere ? [selectedMatiere] : [],
        cv_url
      }

      const res = await fetch('/api/recrutement/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la candidature.')
      }

      const resData = await res.json()
      setSuccessMsg('Votre candidature a été envoyée avec succès ! L\'équipe administrative vous recontactera très vite.')
      
      setMyApplication(resData.interview)
      
      setRpFirstname('')
      setRpLastname('')
      setMotivation('')
      setDisponibilites('')
      setSelectedMatiere('')
      setCvFile(null)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamically generate available roles
  const dynamicRoles = useMemo(() => {
    const roles: any[] = []
    
    // Check Professeur
    const hasProf = effectifs.classiques?.some((c: any) => (c.total || c.capacity) > 0 && c.capacity > 0)
    if (hasProf) {
      roles.push({
        id: 'Professeur',
        title: 'Professeur',
        ...ROLE_TEMPLATES['Professeur']
      })
    }

    // Check Personnel
    if (effectifs.personnel) {
      effectifs.personnel.forEach((p: any) => {
        if (p.capacity > 0) {
          const tplName = Object.keys(ROLE_TEMPLATES).find(k => p.name.includes(k) || k.includes(p.name))
          const template = tplName ? ROLE_TEMPLATES[tplName] : {
            icon: Users, color: 'discord-warning',
            description: `Le poste de ${p.name} est actuellement ouvert au recrutement.`,
            requis: ['Sérieux et motivation', 'Activité régulière']
          }
          roles.push({
            id: p.name,
            title: p.name,
            ...template
          })
        }
      })
    }
    return roles
  }, [effectifs])

  return (
    <div className="min-h-screen bg-[var(--discord-dark)] text-white selection:bg-discord-blurple/30 selection:text-white pb-32">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LunaVerse" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-black leading-none">LunaVerse</h1>
              <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">Recrutement</p>
            </div>
          </div>
          {ready && profile ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-discord-muted hidden sm:block">Connecté en tant que {profile.username}</span>
              <Link href="/" className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                Aller sur l'ENT
              </Link>
            </div>
          ) : (
            <button onClick={handleLogin} className="text-sm font-bold text-white bg-discord-blurple hover:bg-discord-blurple/80 px-4 py-2 rounded-lg transition-colors">
              Se connecter (Discord)
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 animate-slideIn text-center">
        {selectedRoleToApply || myApplication ? (
          <div className="w-16 h-16 bg-discord-blurple/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(88,101,242,0.3)]">
            <ClipboardCheck className="w-8 h-8 text-discord-blurple" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-discord-blurple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-discord-blurple" />
          </div>
        )}
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
          {selectedRoleToApply || myApplication ? 'Votre Candidature' : (
            <>
              Rejoignez l'équipe<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-discord-blurple to-purple-400">
                Éducative de LunaVerse
              </span>
            </>
          )}
        </h1>
        <p className="text-lg text-discord-muted font-medium max-w-2xl mx-auto leading-relaxed">
          {selectedRoleToApply || myApplication 
            ? "Suivez l'avancement de votre candidature en temps réel." 
            : "L'académie recrute ! Consultez nos postes ouverts et déposez votre candidature pour intégrer notre équipe."}
        </p>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        {(selectedRoleToApply || myApplication) ? (
          <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-12 shadow-2xl animate-scaleIn relative overflow-hidden">
            
            {/* Header Timeline */}
            <div className="text-center mb-12">
              <h3 className="text-2xl font-black text-white mb-2">
                Poste : {myApplication?.target_role || selectedRoleToApply?.title}
              </h3>
              <p className="text-discord-muted font-medium">Timeline de Recrutement</p>
            </div>

            {/* Back Button */}
            {!myApplication && (
              <button 
                onClick={() => setSelectedRoleToApply(null)} 
                className="mb-8 text-discord-blurple font-bold hover:underline text-sm flex items-center"
              >
                ← Retour aux postes
              </button>
            )}

            {/* Horizontal Timeline (Top) */}
            <div className="mb-12 relative w-full mx-auto">
              <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-white/10 z-0 overflow-hidden">
                <div 
                  className="h-full bg-discord-blurple transition-all duration-1000 ease-in-out" 
                  style={{ width: !myApplication ? '0%' : ['accepted', 'refused'].includes(myApplication.status) ? '100%' : myApplication.vocal_channel_name ? '66%' : myApplication.scheduled_at ? '33%' : '0%' }}
                />
              </div>
              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-6 md:gap-0">
                {/* Step 1: Formulaire / Envoyé */}
                <div className="flex flex-col items-center flex-1">
                  <div className={clsx("w-10 h-10 rounded-full border-4 border-[var(--discord-dark)] flex items-center justify-center shrink-0 shadow-lg", 
                    "bg-discord-blurple text-white")}>
                    {myApplication ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                  </div>
                  <div className="mt-2 text-center text-sm font-bold text-white">Candidature</div>
                </div>

                {/* Step 2: Planification */}
                <div className="flex flex-col items-center flex-1">
                  <div className={clsx("w-10 h-10 rounded-full border-4 border-[var(--discord-dark)] flex items-center justify-center shrink-0 shadow-lg", 
                    myApplication?.scheduled_at ? "bg-discord-blurple text-white" : "bg-white/10 text-discord-muted")}>
                    {myApplication?.scheduled_at ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className={clsx("mt-2 text-center text-sm font-bold", myApplication?.scheduled_at ? "text-white" : "text-discord-muted")}>Planification</div>
                </div>

                {/* Step 3: Convocation */}
                <div className="flex flex-col items-center flex-1">
                  <div className={clsx("w-10 h-10 rounded-full border-4 border-[var(--discord-dark)] flex items-center justify-center shrink-0 shadow-lg", 
                    myApplication?.vocal_channel_name ? "bg-discord-blurple text-white" : "bg-white/10 text-discord-muted")}>
                    {myApplication?.vocal_channel_name ? <CheckCircle2 className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
                  </div>
                  <div className={clsx("mt-2 text-center text-sm font-bold", myApplication?.vocal_channel_name ? "text-white" : "text-discord-muted")}>Convocation</div>
                </div>

                {/* Step 4: Résultat */}
                <div className="flex flex-col items-center flex-1">
                  <div className={clsx("w-10 h-10 rounded-full border-4 border-[var(--discord-dark)] flex items-center justify-center shrink-0 shadow-lg", 
                    myApplication?.status === 'accepted' ? "bg-discord-success text-white" : 
                    myApplication?.status === 'refused' ? "bg-discord-error text-white" : "bg-white/10 text-discord-muted")}>
                    {myApplication?.status === 'accepted' ? <CheckCircle2 className="w-5 h-5" /> : myApplication?.status === 'refused' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div className={clsx("mt-2 text-center text-sm font-bold", ['accepted', 'refused'].includes(myApplication?.status) ? "text-white" : "text-discord-muted")}>Résultat</div>
                </div>
              </div>
            </div>

            {/* Active Content Area */}
            <div className="w-full transition-all">
              {!myApplication ? (
                // -----------------------------
                // ETAPE 1: LE FORMULAIRE
                // -----------------------------
                <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 shadow-xl">
                  <h3 className="font-bold text-2xl text-white mb-6">Formulaire de Candidature</h3>
                        
                        {!ready || !profile ? (
                          <div className="text-center py-4">
                            <p className="text-discord-muted mb-4 font-medium text-sm">Connectez-vous avec Discord pour postuler.</p>
                            <button onClick={handleLogin} className="btn bg-discord-blurple text-white hover:bg-discord-blurple/80 text-sm">
                              Se connecter avec Discord
                            </button>
                          </div>
                        ) : successMsg ? (
                          <div className="p-4 rounded-xl bg-discord-success/10 border border-discord-success/30 text-discord-success font-bold text-center">
                            {successMsg}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Prénom RP *</label>
                                <input 
                                  type="text" 
                                  value={rpFirstname}
                                  onChange={e => setRpFirstname(e.target.value)}
                                  className="glass-input w-full text-sm py-2" 
                                  placeholder="Ex: John" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Nom RP *</label>
                                <input 
                                  type="text" 
                                  value={rpLastname}
                                  onChange={e => setRpLastname(e.target.value)}
                                  className="glass-input w-full text-sm py-2" 
                                  placeholder="Ex: Doe" 
                                />
                              </div>
                            </div>

                            {selectedRoleToApply?.id === 'Professeur' && (
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-2">Matière(s) Souhaitée(s) *</label>
                                <div className="flex flex-wrap gap-2">
                                  {effectifs.classiques?.filter((subj: any) => subj.capacity > 0)
                                    .map((subj: any) => (
                                      <button
                                        key={subj.name}
                                        onClick={() => toggleMatiere(subj.name)}
                                        className={clsx(
                                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                          selectedMatiere === subj.name
                                            ? "bg-discord-blurple/20 text-discord-blurple border-discord-blurple/50"
                                            : "bg-white/5 text-discord-muted border-white/5 hover:bg-white/10"
                                        )}
                                      >
                                        {subj.name}
                                      </button>
                                  ))}
                                  {(!effectifs.classiques || effectifs.classiques.length === 0) && (
                                    <span className="text-discord-muted text-xs">Aucune matière disponible</span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Lettre de Motivation *</label>
                              <textarea 
                                value={motivation}
                                onChange={e => setMotivation(e.target.value)}
                                className="glass-input w-full min-h-[80px] py-2 text-sm" 
                                placeholder="Expliquez pourquoi..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Vos Disponibilités *</label>
                              <input 
                                type="text" 
                                value={disponibilites}
                                onChange={e => setDisponibilites(e.target.value)}
                                className="glass-input w-full text-sm py-2" 
                                placeholder="Ex: Tous les soirs..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">CV ou Ressources (Optionnel)</label>
                              <div className="flex items-center gap-4">
                                <label className="btn bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-xs py-2 px-3">
                                  <Upload className="w-3 h-3 mr-2 inline" />
                                  Joindre un fichier
                                  <input 
                                    type="file" 
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    className="hidden" 
                                    onChange={e => e.target.files && setCvFile(e.target.files[0])}
                                  />
                                </label>
                                {cvFile && <span className="text-xs text-discord-blurple font-bold">{cvFile.name}</span>}
                              </div>
                            </div>

                            {errorMsg && <div className="text-discord-error text-xs font-bold">{errorMsg}</div>}

                            <button 
                              onClick={() => handleSubmit(selectedRoleToApply?.id)}
                              disabled={isSubmitting}
                              className="w-full py-3 rounded-xl font-bold bg-discord-blurple hover:bg-discord-blurple/80 text-white transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              Envoyer ma Candidature
                            </button>
                          </div>
                        )}
                </div>
              ) : (
                // -----------------------------
                // ETAPE 2 à 4 : STATUT DE LA CANDIDATURE
                // -----------------------------
                <div className="space-y-6">
                  {/* Résultat (if present) */}
                  {['accepted', 'refused'].includes(myApplication.status) && (
                    <div className={clsx("p-6 rounded-2xl border shadow-xl",
                      myApplication.status === 'accepted' ? "border-discord-success/30 bg-discord-success/10" : "border-discord-error/30 bg-discord-error/10"
                    )}>
                      <h3 className={clsx("font-bold text-xl", myApplication.status === 'accepted' ? "text-discord-success" : "text-discord-error")}>
                        {myApplication.status === 'accepted' ? "Candidature Acceptée !" : "Candidature Refusée"}
                      </h3>
                      <p className="text-discord-muted mt-2">
                        {myApplication.status === 'accepted' ? "Félicitations, vous avez réussi l'entretien et êtes désormais intégré(e) à l'équipe éducative." : "Malheureusement, votre profil n'a pas été retenu suite à l'entretien. Vous pourrez retenter votre chance d'ici 7 jours."}
                      </p>
                    </div>
                  )}

                  {/* Convocation (if scheduled but not finished) */}
                  {!['accepted', 'refused'].includes(myApplication.status) && myApplication.vocal_channel_name && (
                    <div className="p-6 rounded-2xl border border-discord-blurple/30 bg-discord-blurple/10 shadow-xl">
                      <h3 className="font-bold text-xl text-discord-blurple">Convocation à l'oral</h3>
                      <p className="text-discord-muted mt-2">
                        Veuillez vous rendre dans le salon vocal <strong className="text-white bg-black/30 px-2 py-0.5 rounded">#{myApplication.vocal_channel_name}</strong>.
                      </p>
                      {myApplication.scheduled_at && (
                        <p className="text-discord-muted mt-2">
                          Heure du rendez-vous : <strong className="text-white">{new Date(myApplication.scheduled_at).toLocaleString('fr-FR')}</strong>.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pending/Analysis (if no vocal channel yet) */}
                  {!['accepted', 'refused'].includes(myApplication.status) && !myApplication.vocal_channel_name && (
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-xl">
                      <h3 className="font-bold text-xl text-white">Dossier en cours d'analyse</h3>
                      <p className="text-discord-muted mt-2">
                        Candidature soumise le <strong className="text-white">{new Date(myApplication.created_at).toLocaleDateString('fr-FR')}</strong>.<br />
                        L'administration analyse votre profil et vous convoquera pour un oral si votre dossier est retenu. Gardez un œil sur cette page.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
            
            {myApplication && ['accepted', 'refused'].includes(myApplication.status) && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setMyApplication(null)}
                  className="btn bg-white/10 hover:bg-white/20 text-white"
                >
                  Soumettre une autre candidature
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 flex items-center justify-between">
              <span>Postes Disponibles</span>
              {loadingEffectifs && <Loader2 className="w-4 h-4 animate-spin" />}
            </h2>
            
            {dynamicRoles.length === 0 && !loadingEffectifs && (
              <div className="p-8 text-center glass-card">
                <p className="text-discord-muted font-medium">Aucun poste n'est actuellement ouvert au recrutement.</p>
              </div>
            )}

            {dynamicRoles.map(role => {
              const Icon = role.icon

              return (
                <div 
                  key={role.id}
                  className="rounded-2xl transition-all duration-300 overflow-hidden border bg-white/[0.02] border-transparent hover:bg-white/5"
                >
                  <div className="px-6 py-5 flex items-center justify-between select-none">
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-20", `bg-${role.color}/20 text-${role.color}`)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{role.title}</h3>
                        <p className="text-sm font-bold text-discord-success">Poste Ouvert</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <div className="h-px w-full bg-white/5 mb-6" />
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Le Rôle</h4>
                      <p className="text-discord-muted font-medium mb-6 leading-relaxed">
                        {role.description}
                      </p>
                      
                      <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Prérequis</h4>
                      <ul className="space-y-2 mb-6">
                        {role.requis.map((req: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-discord-muted font-medium bg-black/20 p-2 rounded-lg border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-discord-success" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => handleSelectRole(role)}
                        className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold"
                      >
                        Candidater pour ce poste
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
