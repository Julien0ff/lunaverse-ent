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
        text: `Compte Pronote (${data.accountName || data.username}) associé avec succès !`,
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
      setFeedbackMsg({
        type: 'success',
        text: `Synchronisation réussie ! (${data.coursesCount} cours traités, ${data.homeworksCount} devoirs)`,
      })
      await loadPronoteStatus()
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la synchronisation.' })
    } finally {
      setSyncLoading(false)
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
      setFeedbackMsg({ type: 'success', text: 'Compte Pronote déconnecté.' })
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
                status?.isConnected ? 'bg-discord-success/20 text-discord-success' : 'bg-amber-500/20 text-amber-500'
              )}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Liaison Pronote Directe</h3>
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                    status?.isConnected
                      ? 'bg-discord-success/20 text-discord-success border border-discord-success/30'
                      : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  )}
                >
                  {status?.isConnected ? 'Connecté' : 'Non associé'}
                </span>
              </div>
              <p className="text-xs text-discord-muted mt-0.5">
                {status?.isConnected
                  ? `Compte : ${status.accountName || status.username} (${status.url})`
                  : 'Associez votre compte Pronote pour activer la synchronisation automatique de l\'EDT et des devoirs.'}
              </p>
            </div>
          </div>

          {status?.isConnected && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncNow}
                disabled={syncLoading}
                className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-discord-blurple/20 transition-all"
              >
                {syncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Synchroniser maintenant
              </button>
              <button
                onClick={handleDisconnect}
                className="btn bg-white/5 hover:bg-discord-error/20 text-discord-muted hover:text-discord-error p-2.5 rounded-xl border border-white/10 transition-colors"
                title="Déconnecter le compte Pronote"
              >
                <Unlink size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Message de notification */}
        {feedbackMsg && (
          <div
            className={clsx(
              'p-4 rounded-xl text-sm flex items-center gap-3 animate-fadeIn',
              feedbackMsg.type === 'success'
                ? 'bg-discord-success/15 border border-discord-success/30 text-discord-success'
                : 'bg-discord-error/15 border border-discord-error/30 text-discord-error'
            )}
          >
            {feedbackMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{feedbackMsg.text}</span>
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
              <span className="text-[10px] uppercase font-bold text-discord-muted block">Classes Mappées</span>
              <p className="text-sm font-semibold text-discord-blurple mt-1">3GA ↔ 3ea, 3PM, 2PRO1, 2GT1, Options</p>
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
