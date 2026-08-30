import os
import re

with open('src/app/admin/page.old.tsx', 'r') as f:
    content = f.read()

def get_tab_content(tab_name, next_tab_name):
    start = content.find(f"      {{tab === '{tab_name}' && (")
    if start == -1: return ""
    if next_tab_name:
        end = content.find(f"      {{tab === '{next_tab_name}' && (", start)
    else:
        end = content.find("    </div>\n  )\n}", start)
        
    jsx = content[start:end]
    jsx = jsx.replace(f"      {{tab === '{tab_name}' && (", "")
    jsx = jsx.rsplit("      )}", 1)[0]
    return jsx

tabs = [
    ('shop', 'roles', 'AdminShopPage', 'Boutique', 'Gérez les articles du Luna Market.'),
    ('roles', 'suggestions', 'AdminRolesPage', 'Rôles & Salaires', 'Gérez les rôles, les accès et les salaires.'),
    ('cantine', 'declarations', 'AdminCantinePage', 'Cantine', 'Programmez les menus de la cantine.'),
    ('declarations', 'absences', 'AdminDeclarationsPage', 'Déclarations', 'Gérez les incidents et déclarations de revenus.'),
    ('absences', 'maisons', 'AdminAbsencesPage', 'Absences', 'Gérez les absences des élèves.'),
    ('annonces', None, 'AdminAnnoncesPage', 'Annonces & EDT', 'Planifiez des annonces et des cours.'),
]

base_header = """'use client'
import { useState, useEffect } from 'react'
import { Plus, X, Search, Check, Loader2, AlertCircle, Trash2, Pencil, Send } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/context/AuthContext'

export default function {component}() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // NOTE: This is a placeholder migration. Some states might need manual fixing.
  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">{title}</h2>
        <p className="text-discord-muted">{desc}</p>
      </div>
      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}
"""

for tab_name, next_tab, comp, title, desc in tabs:
    jsx = get_tab_content(tab_name, next_tab)
    if not jsx: continue
    
    header = base_header.replace('{component}', comp).replace('{title}', title).replace('{desc}', desc)
    out = header + jsx + "\n    </div>\n  )\n}\n"
    
    with open(f"src/app/admin/{tab_name}/page.tsx", 'w') as f:
        f.write(out)

