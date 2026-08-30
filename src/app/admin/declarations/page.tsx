'use client'

import { useState, useEffect } from 'react'
import { FileText, Check, X, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

interface Declaration {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'accepted' | 'refused'
  has_penalty: boolean
  created_at: string
  profiles: {
    username: string
    avatar_url: string
    balance: number
  }
}

export default function AdminDeclarationsPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchDeclarations()
  }, [])

  const fetchDeclarations = async () => {
    try {
      const res = await fetch('/api/admin/declarations')
      if (res.ok) {
        const data = await res.json()
        setDeclarations(data.declarations)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (declarationId: string, action: 'accept' | 'refuse', hasPenalty: boolean = false) => {
    if (action === 'refuse' && hasPenalty) {
      if (!confirm('Voulez-vous vraiment refuser ET appliquer une amende de 20% ?')) return
    } else if (action === 'refuse') {
      if (!confirm('Voulez-vous vraiment refuser cette déclaration (sans amende) ?')) return
    }

    setProcessing(declarationId)
    try {
      const res = await fetch('/api/admin/declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declarationId, action, hasPenalty })
      })

      if (res.ok) {
        fetchDeclarations()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors du traitement.')
      }
    } catch (e) {
      alert('Erreur réseau.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <FileText className="text-discord-blurple w-8 h-8" />
          Déclarations Fiscales
        </h2>
        <p className="text-discord-muted mt-2">Gérez les demandes de blanchiment et les déclarations d'argent.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="space-y-4">
          {declarations.length > 0 ? declarations.map(dec => (
            <div key={dec.id} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                  <Image src={dec.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt={dec.profiles?.username} width={48} height={48} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{dec.profiles?.username}</h3>
                  <p className="text-xs font-bold text-discord-muted uppercase tracking-widest">{new Date(dec.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="flex-1 md:px-8">
                <p className="text-sm text-gray-300 italic">"{dec.reason}"</p>
                <p className="text-lg font-black text-discord-success mt-1">{dec.amount.toLocaleString()} €</p>
              </div>

              <div className="flex items-center gap-2">
                {dec.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleAction(dec.id, 'accept')}
                      disabled={processing === dec.id}
                      className="p-3 bg-discord-success/10 hover:bg-discord-success/20 text-discord-success rounded-xl transition-colors font-bold flex items-center gap-2"
                    >
                      {processing === dec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accepter
                    </button>
                    <button 
                      onClick={() => handleAction(dec.id, 'refuse', false)}
                      disabled={processing === dec.id}
                      className="p-3 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-xl transition-colors font-bold"
                    >
                      Refuser
                    </button>
                    <button 
                      onClick={() => handleAction(dec.id, 'refuse', true)}
                      disabled={processing === dec.id}
                      className="p-3 bg-discord-error/10 hover:bg-discord-error/20 text-discord-error rounded-xl transition-colors font-bold flex items-center gap-2"
                      title="Refuser et appliquer une amende de 20%"
                    >
                      <AlertCircle className="w-4 h-4" /> Refuser + Amende
                    </button>
                  </>
                ) : (
                  <span className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest",
                    dec.status === 'accepted' ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
                  )}>
                    {dec.status === 'accepted' ? 'Acceptée' : (dec.has_penalty ? 'Refusée (Amende)' : 'Refusée')}
                  </span>
                )}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center glass-card">
              <p className="text-discord-muted font-medium">Aucune déclaration trouvée.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
