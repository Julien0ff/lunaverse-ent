'use client'

import { useAuth } from '@/context/AuthContext'
import { Landmark, AlertTriangle, FileText, CheckCircle2, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

interface TaxDebt {
  id: string
  amount: number
  reason: string
  created_at: string
}

export default function Impots() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [debts, setDebts] = useState<TaxDebt[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    
    fetch('/api/taxes')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          // Only show real debts (positive amount)
          setDebts(data.items.filter((d: any) => Number(d.amount) > 0))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [profile?.id])

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount), 0)

  const handlePay = async () => {
    if (!profile?.id || debts.length === 0 || paying) return
    setPaying(true)
    setErrorMsg(null)

    try {
      const debtIds = debts.map(d => d.id)
      const res = await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtIds })
      })
      const data = await res.json()

      if (res.ok) {
        setDebts([]) // clear debts
        await refreshProfile()
      } else {
        setErrorMsg(data.error || 'Erreur lors du paiement')
      }
    } catch (e) {
      setErrorMsg('Erreur de connexion')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-slideIn">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
            <Landmark className="text-blue-500 w-10 h-10" />
            Finances Publiques
          </h1>
          <p className="text-discord-muted mt-2 uppercase tracking-widest text-xs font-bold">Direction des Impôts de LunaVerse</p>
        </div>
        <div className="glass-card px-6 py-3 border-blue-500/30">
          <p className="text-[10px] font-black uppercase text-discord-muted tracking-widest mb-1">Numéro Fiscal</p>
          <p className="font-mono text-white tracking-widest">{profile?.discord_id || '---'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Résumé de situation */}
        <div className="md:col-span-1 space-y-4">
          <div className={clsx(
            "glass-card p-6 border group transition-all relative overflow-hidden",
            totalDebt > 0 ? "border-discord-error/30" : "border-discord-success/30"
          )}>
            <div className={`absolute top-0 left-0 w-1 h-full ${totalDebt > 0 ? 'bg-discord-error' : 'bg-discord-success'}`} />
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" /> 
              Situation
            </h3>
            
            <p className="text-[10px] text-discord-muted uppercase tracking-[0.2em] mb-1">Montant à régler</p>
            <p className={`text-4xl font-black ${totalDebt > 0 ? 'text-discord-error' : 'text-discord-success'}`}>
              {totalDebt.toFixed(2)} €
            </p>
            
            {totalDebt > 0 ? (
              <div className="mt-6 flex items-start gap-2 p-3 bg-discord-error/10 text-discord-error rounded-xl text-xs font-bold">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                Vous avez des impôts ou amendes impayés. Veuillez régulariser votre situation au plus vite.
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-2 p-3 bg-discord-success/10 text-discord-success rounded-xl text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Vous êtes à jour.
              </div>
            )}
            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-discord-error/10 text-discord-error rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}
          </div>
          
          <button 
            onClick={handlePay}
            disabled={totalDebt === 0 || paying}
            className={clsx(
              "btn w-full py-4 text-lg",
              totalDebt > 0 ? "btn-error" : "btn-ghost opacity-50"
            )}
          >
            {paying ? "Paiement en cours..." : `Payer la totalité (${totalDebt.toFixed(2)} €)`}
          </button>
        </div>

        {/* Liste des Créances */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-white px-2">Avis d&apos;imposition détaillés</h3>
          
          {debts.length > 0 ? (
            <div className="space-y-3">
              {debts.map((debt, index) => (
                <div key={debt.id} className="glass-card hover:border-blue-500/30 transition-colors p-4 flex items-center gap-4 group cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate text-lg">{debt.reason}</h4>
                    <p className="text-xs text-discord-muted uppercase tracking-widest font-medium">Émis le {new Date(debt.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-discord-error">{debt.amount.toFixed(2)} €</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-discord-muted group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center opacity-70">
              <CheckCircle2 className="w-16 h-16 text-discord-success mb-4" />
              <p className="text-xl font-bold text-white mb-2">Aucun impôt dû</p>
              <p className="text-sm text-discord-muted">Vous avez payé toutes vos taxes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
