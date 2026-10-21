'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Unlink,
  Sparkles,
  HelpCircle,
  Check,
} from 'lucide-react'
import clsx from 'clsx'

interface PronoteStatus {
  isConnected: boolean
  tokenExpired?: boolean
  lastError?: string | null
  lastErrorAt?: string | null
  url?: string
  username?: string
  accountName?: string
  kind?: number
  connectedAt?: string
  lastSyncedAt?: string | null
}

export default function AdminPronotePage() {
  const [loading, setLoading] = useState(true)

  // État Pronote Direct
  const [status, setStatus] = useState<PronoteStatus | null>(null)
  const [qrInput, setQrInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [pinUnlockInput, setPinUnlockInput] = useState('')
  const [verifyPinLoading, setVerifyPinLoading] = useState(false)
  const [pairingLoading, setPairingLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    loadPronoteStatus()
  }, [])

  const loadPronoteStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pronote/connect')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (e) {
      console.error('Erreur chargement statut Pronote:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePairing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrInput.trim() || !pinInput.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Veuillez saisir les données du QR Code et votre code PIN à 4 chiffres.' })
      return
    }

    setPairingLoading(true)
    setFeedbackMsg(null)
    try {
      const res = await fetch('/api/admin/pronote/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pair', qr: qrInput, pin: pinInput }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'association Pronote.")
      }
      setFeedbackMsg({
        type: 'success',
        text: `Compte Pronote (${data.accountName || data.username}) associé avec succès !${typeof data.coursesCount === 'number' && data.coursesCount > 0 ? ` (${data.coursesCount} cours, ${data.homeworksCount} devoirs synchronisés)` : ''}`,
      })
      setQrInput('')
      setPinInput('')
      await loadPronoteStatus()
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || "Erreur lors de l'appairage." })
    } finally {
      setPairingLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncLoading(true)
    setFeedbackMsg(null)
    try {
      const res = await fetch('/api/admin/pronote/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la synchronisation.')
      const errorDetails = Array.isArray(data.syncErrors) && data.syncErrors.length > 0
        ? ` — Erreurs détectées : ${data.syncErrors.slice(0, 2).join(' ; ')}`
        : ''
      setFeedbackMsg({
        type: data.syncErrors?.length && data.coursesCount === 0 ? 'error' : 'success',
        text: `Synchronisation terminée ! (${data.coursesCount} cours traités, ${data.homeworksCount} devoirs${data.newsSent ? `, ${data.newsSent} annonce(s)/sondage(s)` : ''}${typeof data.alertsSent === 'number' ? `, ${data.alertsSent} alerte(s) Discord` : ''})${errorDetails}`,
      })
      await loadPronoteStatus()
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la synchronisation.' })
    } finally {
      setSyncLoading(false)
    }
  }

  const handleVerifyPin = async () => {
    if (!pinUnlockInput.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Veuillez saisir votre code PIN à 4 chiffres.' })
      return
    }
    setVerifyPinLoading(true)
    setFeedbackMsg(null)
    try {
      const res = await fetch('/api/admin/pronote/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_pin', pin: pinUnlockInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la validation du code PIN.')
      setFeedbackMsg({
        type: data.sync?.syncErrors?.length && data.coursesCount === 0 ? 'error' : 'success',
        text: data.message || `Code PIN validé avec succès ! Synchronisation terminée (${data.sync?.coursesCount ?? 0} cours, ${data.sync?.homeworksCount ?? 0} devoirs${data.sync?.newsSent ? `, ${data.sync.newsSent} actualité(s)` : ''}).`,
      })
      setPinUnlockInput('')
      await loadPronoteStatus()
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la validation du code PIN.' })
    } finally {
      setVerifyPinLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter le compte Pronote de l\'ENT ?')) return
    try {
      await fetch('/api/admin/pronote/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      await loadPronoteStatus()
      setQrInput('')
      setPinInput('')
      setFeedbackMsg({ type: 'success', text: 'Compte Pronote déconnecté. Veuillez générer un nouveau QR Code sur Pronote.' })
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-discord-blurple" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-discord-blurple w-8 h-8" />
            Gestion Pronote & Synchronisation
          </h2>
          <p className="text-discord-muted">
            Synchronisation automatique de l'Emploi du Temps week-end (12h-19h30) et des Devoirs.
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn bg-white/5 hover:bg-white/10 text-discord-muted hover:text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-white/10 transition-all self-start md:self-auto"
        >
          <HelpCircle size={16} />
          {showHelp ? 'Masquer le guide' : 'Guide de connexion'}
        </button>
      </div>

      {/* Guide interactif */}
      {showHelp && (
        <div className="p-6 rounded-2xl bg-discord-blurple/10 border border-discord-blurple/30 space-y-4 animate-fadeIn">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-discord-blurple" />
            Comment connecter Pronote à l'ENT via le QR Code Mobile ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-discord-muted">
            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-discord-blurple/30 text-discord-blurple font-bold flex items-center justify-center">1</span>
              <p className="font-semibold text-white">Générer le QR Code</p>
              <p>Connectez-vous sur Pronote avec votre compte ayant accès aux cours (Espace Vie Scolaire, Direction ou Professeur). Cliquez sur le bouton mobile <strong className="text-white">"Code à flasher"</strong> en haut à droite.</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-discord-blurple/30 text-discord-blurple font-bold flex items-center justify-center">2</span>
              <p className="font-semibold text-white">Définir un code PIN</p>
              <p>Pronote vous demande de créer un code à 4 chiffres (ex: <code className="text-discord-blurple">1234</code>). Retenez ce code pour l'appairage !</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-discord-blurple/30 text-discord-blurple font-bold flex items-center justify-center">3</span>
              <p className="font-semibold text-white">Appairer l'ENT</p>
              <p>Collez le texte du QR Code et le code PIN ci-dessous. L'ENT génère un jeton permanent et maintient la synchronisation active 24h/24.</p>
            </div>
          </div>
        </div>
      )}

      {/* Carte Statut & Synchro Directe */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                'w-12 h-12 rounded-2xl flex items-center justify-center',
                status?.tokenExpired
                  ? 'bg-rose-500/20 text-rose-400'
                  : status?.isConnected
                  ? 'bg-discord-success/20 text-discord-success'
                  : 'bg-amber-500/20 text-amber-500'
              )}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">Liaison Pronote Directe</h3>
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                    status?.tokenExpired
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : status?.isConnected
                      ? 'bg-discord-success/20 text-discord-success border border-discord-success/30'
                      : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  )}
                >
                  {status?.tokenExpired ? 'Session expirée' : status?.isConnected ? 'Connecté' : 'Non associé'}
                </span>
                {status?.isConnected && !status?.tokenExpired && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 flex items-center gap-1">
                    ⚡ Auto-Synchro (10 min)
                  </span>
                )}
              </div>
              <p className="text-xs text-discord-muted mt-0.5">
                {status?.tokenExpired
                  ? '⚠️ Le jeton a expiré : veuillez déconnecter et réappairer pour relancer la synchronisation.'
                  : status?.isConnected
                  ? `Compte : ${status.accountName || status.username} (${status.url})`
                  : 'Associez votre compte Pronote pour activer la synchronisation automatique de l\'EDT et des devoirs.'}
              </p>
            </div>
          </div>

          {(status?.isConnected || status?.tokenExpired) && (
            <div className="flex items-center gap-3">
              {!status?.tokenExpired && (
                <button
                  onClick={handleSyncNow}
                  disabled={syncLoading}
                  className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-discord-blurple/20 transition-all"
                >
                  {syncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Synchroniser maintenant
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className={clsx(
                  "btn py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
                  status?.tokenExpired
                    ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                    : "bg-white/5 hover:bg-discord-error/20 text-discord-muted hover:text-discord-error border border-white/10"
                )}
                title="Déconnecter le compte Pronote"
              >
                <Unlink size={16} />
                {status?.tokenExpired ? 'Réappairer le compte' : 'Déconnecter'}
              </button>
            </div>
          )}
        </div>

        {/* Alerte si le jeton est expiré */}
        {status?.tokenExpired && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Jeton Pronote révoqué par le serveur Pronote</p>
                <p className="text-xs text-rose-300/80">
                  Pronote a invalidé la session mobile. Cliquez sur <strong>Réappairer le compte</strong>, générez un nouveau QR Code sur Pronote (« Code à flasher »), et validez pour remettre à jour l'EDT et les devoirs.
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 transition-colors shadow-lg shadow-rose-500/20"
            >
              Réappairer maintenant
            </button>
          </div>
        )}

        {/* Message de notification */}
        {feedbackMsg && (
          <div
            className={clsx(
              'p-4 rounded-xl text-sm flex items-center justify-between gap-3 animate-fadeIn flex-wrap',
              feedbackMsg.type === 'success'
                ? 'bg-discord-success/15 border border-discord-success/30 text-discord-success'
                : 'bg-discord-error/15 border border-discord-error/30 text-discord-error'
            )}
          >
            <div className="flex items-center gap-3">
              {feedbackMsg.type === 'success' ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
            {feedbackMsg.type === 'error' && (feedbackMsg.text.includes('expiré') || feedbackMsg.text.includes('révoqué') || feedbackMsg.text.includes('challenge') || feedbackMsg.text.includes('credentials')) && (
              <button
                onClick={async () => {
                  await handleDisconnect()
                  setFeedbackMsg({
                    type: 'error',
                    text: 'Compte déconnecté. Veuillez générer un nouveau QR Code sur Pronote et le coller ci-dessous avec votre code PIN.'
                  })
                }}
                className="px-3 py-1.5 rounded-lg bg-discord-error/30 hover:bg-discord-error/40 text-white font-bold text-xs transition-colors shrink-0"
              >
                Réassocier avec un nouveau QR Code
              </button>
            )}
          </div>
        )}

        {/* Détails si connecté */}
        {status?.isConnected ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-discord-muted block">Dernière synchronisation</span>
              <p className="text-sm font-semibold text-white mt-1">
                {status.lastSyncedAt
                  ? new Date(status.lastSyncedAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Jamais'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-discord-muted block">Plage Horaire LunaVerse</span>
              <p className="text-sm font-semibold text-white mt-1">Samedi & Dimanche (12h00 - 19h30)</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-discord-muted block">Classes Synchronisées</span>
              <p className="text-sm font-semibold text-discord-blurple mt-1">3GA (2GT1, 3PM, 2PRO1 masquées)</p>
            </div>

            {/* Validation Code PIN (Double authentification) */}
            <div className="sm:col-span-3 p-4 rounded-xl bg-discord-blurple/10 border border-discord-blurple/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-discord-blurple" />
                  Code PIN de confirmation (Double authentification)
                </span>
                <p className="text-xs text-discord-muted">
                  Si Pronote bloque les droits ou que la synchronisation remonte 0 cours/devoirs, entrez votre code PIN à 4 chiffres ici pour valider l'appareil auprès de Pronote.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Code PIN"
                  className="glass-input bg-white/5 border-white/10 text-white font-mono text-center tracking-widest text-sm w-28 py-2 focus:border-discord-blurple"
                  value={pinUnlockInput}
                  onChange={e => setPinUnlockInput(e.target.value)}
                />
                <button
                  onClick={handleVerifyPin}
                  disabled={verifyPinLoading}
                  className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 text-xs whitespace-nowrap shadow-md shadow-discord-blurple/20 transition-all"
                >
                  {verifyPinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check size={14} />}
                  Valider le PIN
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulaire d'appairage QR Code */
          <form onSubmit={handlePairing} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-discord-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={14} className="text-discord-blurple" />
                  Données du QR Code Pronote (JSON ou texte)
                </label>
                <textarea
                  rows={3}
                  className="glass-input w-full bg-white/5 border-white/10 text-white font-mono text-xs focus:border-discord-blurple resize-none"
                  placeholder='Exemple : {"login":"...","jeton":"...","url":"https://pronote.lunaverse.fr/mobile.viescolaire.html"}'
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                />
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-discord-muted uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-discord-blurple" />
                    Code PIN (4 chiffres)
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    className="glass-input w-full bg-white/5 border-white/10 text-white font-mono text-center tracking-widest text-lg focus:border-discord-blurple mt-2"
                    placeholder="1234"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pairingLoading}
                  className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-discord-blurple/25 transition-all mt-4 md:mt-0"
                >
                  {pairingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Association en cours...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Appairer l'ENT avec Pronote
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Important :</strong> Un QR code Pronote est à <u>usage unique</u> et n'est valable que <strong>10 minutes</strong>. Si vous avez déjà cliqué ou si le temps est écoulé, <strong>fermez la popup QR code sur Pronote et rouvrez-la</strong> pour en générer un nouveau.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
