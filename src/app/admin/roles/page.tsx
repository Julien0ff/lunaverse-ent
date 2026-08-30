'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Pencil, Save, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Role {
  id: string
  name: string
  discord_role_id: string
  color: string
  can_connect: boolean
  salary_amount: number
  pocket_money: number
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRole) return
    setSaving(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole)
      })

      if (res.ok) {
        setEditingRole(null)
        fetchRoles()
      } else {
        const err = await res.json()
        setErrorMsg(err.error || 'Erreur lors de la sauvegarde.')
      }
    } catch (e) {
      setErrorMsg('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Users className="text-discord-blurple w-8 h-8" />
            Rôles & Salaires
          </h2>
          <p className="text-discord-muted mt-2">Gérez les accès à l'ENT et les revenus des rôles Discord.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest">Rôle</th>
                  <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-center">Accès ENT</th>
                  <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-right">Salaire/Jour</th>
                  <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-right">Argent de poche/Jour</th>
                  <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || '#99aab5' }} />
                        <span className="font-bold text-white">{role.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={clsx(
                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                        role.can_connect ? "bg-discord-success/20 text-discord-success" : "bg-discord-error/20 text-discord-error"
                      )}>
                        {role.can_connect ? 'OUI' : 'NON'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-[#FEE75C]">{role.salary_amount.toLocaleString()} €</td>
                    <td className="p-4 text-right font-black text-[#FEE75C]">{role.pocket_money.toLocaleString()} €</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setEditingRole(role)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white inline-flex"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card max-w-lg w-full relative animate-slideUp">
            <button 
              onClick={() => setEditingRole(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-discord-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-white mb-2">Modifier le rôle</h3>
            <p className="text-discord-blurple font-bold mb-6 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingRole.color || '#99aab5' }} />
              {editingRole.name}
            </p>

            {errorMsg && <p className="text-discord-error text-sm font-bold bg-discord-error/10 p-3 rounded-lg mb-4">{errorMsg}</p>}
            
            <form onSubmit={handleSave} className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={editingRole.can_connect}
                  onChange={e => setEditingRole({...editingRole, can_connect: e.target.checked})}
                  className="w-5 h-5 rounded border-white/20 text-discord-blurple focus:ring-discord-blurple focus:ring-offset-gray-900 bg-black/50"
                />
                <div>
                  <p className="font-bold text-white text-sm">Autoriser la connexion à l'ENT</p>
                  <p className="text-xs text-discord-muted">Si coché, les membres ayant ce rôle pourront se connecter au site.</p>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Salaire/Jour (€)</label>
                  <input 
                    type="number" value={editingRole.salary_amount} 
                    onChange={e => setEditingRole({...editingRole, salary_amount: Number(e.target.value)})} 
                    className="input-field mt-1" min="0" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Argent de poche/Jour (€)</label>
                  <input 
                    type="number" value={editingRole.pocket_money} 
                    onChange={e => setEditingRole({...editingRole, pocket_money: Number(e.target.value)})} 
                    className="input-field mt-1" min="0" 
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" disabled={saving} className="btn btn-primary w-full">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-5 h-5" /> Sauvegarder</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
