'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Upload, Briefcase, CheckCircle2, Shield, Heart, GraduationCap, Users, Loader2 } from 'lucide-react'
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingEffectifs, setLoadingEffectifs] = useState(true)

  const [myApplication, setMyApplication] = useState<any>(null)
  const [loadingApp, setLoadingApp] = useState(true)

  // Form states
  const [rpFirstname, setRpFirstname] = useState('')
  const [rpLastname, setRpLastname] = useState('')
  const [motivation, setMotivation] = useState('')
  const [disponibilites, setDisponibilites] = useState('')
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([])
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
  }, [ready, profile])

  const handleLogin = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback?next=/recrutement`
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: redirectUrl }
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
    // Reset form
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedMatieres([])
  }

  const toggleMatiere = (mat: string) => {
    setSelectedMatieres(prev => 
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    )
  }

  const handleSubmit = async (roleId: string) => {
    if (!rpFirstname || !rpLastname) {
      setErrorMsg('Veuillez renseigner votre Prénom et Nom RP.')
      return
    }
    if (roleId === 'Professeur' && selectedMatieres.length === 0) {
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
          // Si le bucket n'existe pas, on continue sans crasher, mais on prévient
          console.error("CV Upload failed", uploadError)
        } else if (data) {
          const { data: publicData } = supabase.storage.from('cvs').getPublicUrl(data.path)
          cv_url = publicData.publicUrl
        }
      }

      const res = await fetch('/api/recrutement/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: roleId,
          rp_firstname: rpFirstname,
          rp_lastname: rpLastname,
          motivation,
          disponibilites,
          matieres: selectedMatieres,
          cv_url
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la candidature.')
      }

      const resData = await res.json()
      setSuccessMsg('Votre candidature a été envoyée avec succès ! L\'équipe administrative vous recontactera très vite.')
      
      // Update local state to show timeline
      setMyApplication(resData.interview)
      
      // Clear form
      setRpFirstname('')
      setRpLastname('')
      setMotivation('')
      setDisponibilites('')
      setSelectedMatieres([])
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
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 animate-slideIn">
        <div className="w-16 h-16 bg-discord-blurple/20 rounded-2xl flex items-center justify-center mb-6">
          <Briefcase className="w-8 h-8 text-discord-blurple" />
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">
          Rejoignez l'équipe<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-discord-blurple to-purple-400">
            Éducative de LunaVerse
          </span>
        </h1>
        <p className="text-lg text-discord-muted font-medium mb-8">
          {myApplication 
            ? "Suivez l'avancement de votre candidature en temps réel." 
            : "Découvrez nos postes ouverts et postulez directement via notre plateforme. Votre candidature sera transmise en temps réel à l'administration."}
        </p>
      </div>

      {myApplication && (
        <div className="max-w-3xl mx-auto px-4 mb-16 animate-slideIn">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-black text-white mb-8 border-b border-white/10 pb-4">Suivi de votre Candidature : {myApplication.target_role}</h2>
            
            <div className="relative pl-8 space-y-12 before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              
              {/* Étape 1 : Candidature envoyée */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[var(--discord-dark)] bg-discord-blurple text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-2rem] md:left-1/2">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-white/10 bg-white/5 shadow-xl">
                  <h3 className="font-bold text-white text-lg">Candidature Envoyée</h3>
                  <p className="text-sm text-discord-muted mt-1">Votre dossier a bien été transmis à l'administration.</p>
                  <p className="text-xs text-discord-muted mt-2 opacity-60">{new Date(myApplication.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Étape 2 : En attente / Planifié */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className={clsx("flex items-center justify-center w-6 h-6 rounded-full border-4 border-[var(--discord-dark)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-2rem] md:left-1/2", 
                  myApplication.scheduled_at ? "bg-discord-blurple text-white" : "bg-white/10 text-discord-muted"
                )}>
                  {myApplication.scheduled_at ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-white/30" />}
                </div>
                <div className={clsx("w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-xl transition-all",
                  myApplication.scheduled_at ? "border-white/10 bg-white/5" : "border-transparent bg-white/[0.02]"
                )}>
                  <h3 className={clsx("font-bold text-lg", myApplication.scheduled_at ? "text-white" : "text-discord-muted")}>Planification de l'Entretien</h3>
                  {myApplication.scheduled_at ? (
                     <p className="text-sm text-discord-muted mt-1">
                       Un entretien est prévu le <strong className="text-white">{new Date(myApplication.scheduled_at).toLocaleString('fr-FR')}</strong>.
                     </p>
                  ) : (
                     <p className="text-sm text-discord-muted mt-1 opacity-70">L'administration analyse votre profil et proposera une date d'entretien.</p>
                  )}
                </div>
              </div>

              {/* Étape 3 : Convocation (Salon) */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className={clsx("flex items-center justify-center w-6 h-6 rounded-full border-4 border-[var(--discord-dark)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-2rem] md:left-1/2", 
                  myApplication.vocal_channel_name ? "bg-discord-blurple text-white" : "bg-white/10 text-discord-muted"
                )}>
                  {myApplication.vocal_channel_name ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-white/30" />}
                </div>
                <div className={clsx("w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-xl transition-all",
                  myApplication.vocal_channel_name ? "border-discord-blurple/30 bg-discord-blurple/10" : "border-transparent bg-white/[0.02]"
                )}>
                  <h3 className={clsx("font-bold text-lg", myApplication.vocal_channel_name ? "text-discord-blurple" : "text-discord-muted")}>Convocation</h3>
                  {myApplication.vocal_channel_name ? (
                     <p className="text-sm text-discord-muted mt-1">
                       Veuillez vous rendre dans le vocal <strong className="text-white bg-black/30 px-2 py-0.5 rounded">#{myApplication.vocal_channel_name}</strong> à l'heure prévue.
                     </p>
                  ) : (
                     <p className="text-sm text-discord-muted mt-1 opacity-70">Le salon vocal vous sera communiqué peu avant l'entretien.</p>
                  )}
                </div>
              </div>

              {/* Étape 4 : Résultat */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className={clsx("flex items-center justify-center w-6 h-6 rounded-full border-4 border-[var(--discord-dark)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-2rem] md:left-1/2", 
                  myApplication.status === 'accepted' ? "bg-discord-success text-white" : 
                  myApplication.status === 'refused' ? "bg-discord-error text-white" : "bg-white/10 text-discord-muted"
                )}>
                  {['accepted', 'refused'].includes(myApplication.status) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-white/30" />}
                </div>
                <div className={clsx("w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border shadow-xl transition-all",
                  myApplication.status === 'accepted' ? "border-discord-success/30 bg-discord-success/10" : 
                  myApplication.status === 'refused' ? "border-discord-error/30 bg-discord-error/10" : "border-transparent bg-white/[0.02]"
                )}>
                  <h3 className={clsx("font-bold text-lg", 
                    myApplication.status === 'accepted' ? "text-discord-success" : 
                    myApplication.status === 'refused' ? "text-discord-error" : "text-discord-muted"
                  )}>Résultat de la candidature</h3>
                  {myApplication.status === 'accepted' ? (
                     <p className="text-sm text-white font-medium mt-1">
                       Félicitations ! Vous êtes accepté au poste de {myApplication.target_role}. Vos rôles vous ont été attribués.
                     </p>
                  ) : myApplication.status === 'refused' ? (
                     <p className="text-sm text-discord-muted mt-1">
                       Malheureusement, votre candidature n'a pas été retenue pour cette session.
                     </p>
                  ) : (
                     <p className="text-sm text-discord-muted mt-1 opacity-70">En attente de la délibération finale.</p>
                  )}
                </div>
              </div>

            </div>
            
            {['accepted', 'refused'].includes(myApplication.status) && (
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
        </div>
      )}

      {/* Accordions */}
      {!myApplication && (
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-sm font-black text-discord-muted uppercase tracking-widest mb-6 flex items-center justify-between">
          <span>Postes Disponibles</span>
          {loadingEffectifs && <Loader2 className="w-4 h-4 animate-spin" />}
        </h2>
        
        <div className="space-y-4">
          {dynamicRoles.length === 0 && !loadingEffectifs && (
            <div className="p-8 text-center glass-card">
              <p className="text-discord-muted font-medium">Aucun poste n'est actuellement ouvert au recrutement.</p>
            </div>
          )}
          {dynamicRoles.map(role => {
            const Icon = role.icon
            const isExpanded = expandedId === role.id

            return (
              <div 
                key={role.id}
                className={clsx(
                  "rounded-2xl transition-all duration-300 overflow-hidden border",
                  isExpanded ? "bg-white/5 border-white/10 shadow-xl" : "bg-white/[0.02] border-transparent hover:bg-white/5 cursor-pointer"
                )}
              >
                {/* Header (Clickable) */}
                <div 
                  className="px-6 py-5 flex items-center justify-between select-none"
                  onClick={() => toggleExpand(role.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-20", `bg-${role.color}/20 text-${role.color}`)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{role.title}</h3>
                      <p className="text-sm font-bold text-discord-success">Poste Ouvert</p>
                    </div>
                  </div>
                  <ChevronDown className={clsx("w-6 h-6 text-discord-muted transition-transform duration-300", isExpanded && "rotate-180")} />
                </div>

                {/* Content (Expanded) */}
                <div 
                  className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-white/5 mb-6" />
                      
                      {/* Description & Requis */}
                      <div className="mb-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Le Rôle</h4>
                        <p className="text-discord-muted font-medium mb-6 leading-relaxed">
                          {role.description}
                        </p>

                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Pré-requis</h4>
                        <ul className="space-y-3">
                          {role.requis.map((req: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 text-${role.color}`} />
                              <span className="text-discord-muted font-medium">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Application Form */}
                      <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                        <h4 className="text-lg font-black text-white mb-6">Formulaire de Candidature</h4>
                        
                        {!ready || !profile ? (
                          <div className="text-center py-8">
                            <p className="text-discord-muted mb-4 font-medium">Vous devez vous connecter avec votre compte Discord pour pouvoir postuler.</p>
                            <button onClick={handleLogin} className="btn bg-discord-blurple text-white hover:bg-discord-blurple/80">
                              Se connecter avec Discord
                            </button>
                          </div>
                        ) : successMsg ? (
                          <div className="p-4 rounded-xl bg-discord-success/10 border border-discord-success/30 text-discord-success font-bold text-center">
                            {successMsg}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Prénom RP *</label>
                                <input 
                                  type="text" 
                                  value={rpFirstname}
                                  onChange={e => setRpFirstname(e.target.value)}
                                  className="glass-input w-full" 
                                  placeholder="Ex: John" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Nom RP *</label>
                                <input 
                                  type="text" 
                                  value={rpLastname}
                                  onChange={e => setRpLastname(e.target.value)}
                                  className="glass-input w-full" 
                                  placeholder="Ex: Doe" 
                                />
                              </div>
                            </div>

                            {role.id === 'Professeur' && (
                              <div>
                                <label className="block text-xs font-bold text-discord-muted uppercase mb-2">Matière(s) Souhaitée(s) *</label>
                                <div className="flex flex-wrap gap-2">
                                  {effectifs.personnel?.find((p: any) => p.category === 'Professeurs')?.items
                                    ?.filter((subj: any) => subj.max === null || (subj.current || 0) < subj.max)
                                    .map((subj: any) => (
                                      <button
                                        key={subj.name}
                                        onClick={() => toggleMatiere(subj.name)}
                                        className={clsx(
                                          "px-3 py-1.5 rounded-lg text-sm font-bold transition-all border",
                                          selectedMatieres.includes(subj.name)
                                            ? "bg-discord-blurple/20 text-discord-blurple border-discord-blurple/50"
                                            : "bg-white/5 text-discord-muted border-white/5 hover:bg-white/10"
                                        )}
                                      >
                                        {subj.name}
                                      </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Lettre de Motivation</label>
                              <textarea 
                                value={motivation}
                                onChange={e => setMotivation(e.target.value)}
                                className="glass-input w-full min-h-[100px] py-2" 
                                placeholder="Expliquez pourquoi vous souhaitez rejoindre l'équipe..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">Vos Disponibilités</label>
                              <input 
                                type="text" 
                                value={disponibilites}
                                onChange={e => setDisponibilites(e.target.value)}
                                className="glass-input w-full" 
                                placeholder="Ex: Tous les soirs après 18h, le week-end..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-discord-muted uppercase mb-1">CV ou Ressources (Optionnel)</label>
                              <div className="flex items-center gap-4">
                                <label className="btn bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer text-sm">
                                  <Upload className="w-4 h-4" />
                                  Joindre un fichier
                                  <input 
                                    type="file" 
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    className="hidden" 
                                    onChange={e => e.target.files && setCvFile(e.target.files[0])}
                                  />
                                </label>
                                {cvFile && (
                                  <span className="text-sm font-bold text-discord-success truncate flex-1">
                                    {cvFile.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-discord-muted mt-1">Formats acceptés : PDF, Images, Word.</p>
                            </div>

                            {errorMsg && (
                              <div className="text-discord-error text-sm font-bold">{errorMsg}</div>
                            )}

                            <button 
                              onClick={() => handleSubmit(role.id)}
                              disabled={isSubmitting}
                              className={`w-full btn mt-4 bg-${role.color} hover:bg-${role.color}/80 text-white`}
                            >
                              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer ma candidature'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
