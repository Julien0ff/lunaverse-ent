import os

pages = ['shop', 'roles', 'cantine', 'declarations', 'absences', 'annonces', 'primes']

for page in pages:
    path = f'src/app/admin/{page}/page.tsx'
    if os.path.exists(path):
        with open(path, 'w') as f:
            f.write(f"""'use client'

export default function Admin{page.capitalize()}Page() {{
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">{page.capitalize()}</h2>
        <p className="text-discord-muted">Page en cours de migration...</p>
      </div>
      <div className="glass-card">
        <p className="text-discord-muted">Cette fonctionnalité est temporairement indisponible pendant la refonte de l'interface.</p>
      </div>
    </div>
  )
}}
""")

