# ENT LunaVerse 🌙

ENT scolaire RP pour le serveur Discord **LunaVerse** — Pronote-like avec banque, casino, boutique, réseau social et bot Discord intégré.

---

## 🚀 Lancement

### Prérequis
- Node.js 18+
- Un projet [Supabase](https://supabase.com) configuré
- Une application Discord (OAuth2 + Bot)

### Installation

```bash
npm install
```

### Variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
# Discord OAuth2
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord

# Discord Bot
DISCORD_BOT_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          ← Dans Supabase > Settings > API

# Configuration
NEXT_PUBLIC_AUTHORIZED_ROLE_ID=     ← ID du rôle Discord requis pour accéder à l'ENT
CRON_SECRET=ton_secret_cron          ← Optionnel, protège l'API de salaire
```

### Lancer le site web

```bash
npm run dev
# → http://localhost:3000
```

### Lancer le bot Discord

> Dans un **second terminal** (le bot et le site sont des processus séparés).

```bash
npm run bot
```

**⚠️ Avant de lancer le bot**, activez les **Privileged Gateway Intents** dans le [portail Discord](https://discord.com/developers/applications) :
- `SERVER MEMBERS INTENT`
- `PRESENCE INTENT`

---

## 📁 Structure du projet

```
src/
├── app/
│   ├── page.tsx              ← Login page (/)
│   ├── dashboard/            ← Tableau de bord
│   ├── bank/                 ← Banque
│   ├── casino/               ← Casino
│   ├── shop/                 ← Boutique
│   ├── social/               ← Réseau social
│   ├── profile/              ← Profil utilisateur
│   ├── admin/                ← Admin (rôle admin requis)
│   └── api/
│       ├── auth/profile      ← Upsert profil (service role)
│       ├── auth/roles        ← Rôles utilisateur (service role)
│       ├── bank/transactions ← Banque API
│       ├── casino/           ← Casino API
│       ├── shop/             ← Boutique API
│       ├── social/           ← Posts API
│       ├── profile/stats     ← Stats profil
│       ├── admin/            ← Admin APIs
│       └── cron/salary       ← 💰 Cron salaire hebdo
├── components/
│   ├── Sidebar.tsx
│   ├── AppShell.tsx
│   └── LoadingScreen.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── supabase.ts           ← Client navigateur (createBrowserClient)
│   ├── supabase-server.ts    ← Client serveur (createServerClient)
│   ├── supabase-admin.ts     ← Client admin (service role, bypass RLS)
│   └── discord-bot.ts        ← Bot Discord complet
└── middleware.ts             ← Rafraîchit les cookies Supabase
```

---

## 🤖 Bot Discord — Commandes

| Commande | Description |
|---|---|
| `/solde` | Voir son solde |
| `/envoie @user montant` | Transférer de l'argent |
| `/daily` | Récompense quotidienne (50€) |
| `/salaire` | Percevoir le salaire hebdomadaire |
| `/historique` | 5 dernières transactions |
| `/slots mise` | Machine à sous |
| `/dice mise high/low` | Dés |
| `/flip mise heads/tails` | Pile ou face |
| `/boutique` | Voir les articles disponibles |
| `/buy article` | Acheter un article |
| `/feed` | 5 derniers posts |
| `/give @user montant` | **[Admin]** Donner de l'argent |
| `/addrole @user role` | **[Admin]** Assigner un rôle RP |

### Rôles RP `/addrole`

Les rôles sont stockés dans la table `roles` de Supabase. Créez-les dans **Supabase > Table Editor > roles** :

| name | discord_role_id | salary_amount | pocket_money | color |
|---|---|---|---|---|
| `admin` | ID du rôle Discord admin | 0 | 0 | #ED4245 |
| `prof` | ID du rôle Discord prof | 500 | 0 | #5865F2 |
| `eleve` | ID du rôle Discord élève | 0 | 100 | #57F287 |
| `cpe` | ID du rôle Discord CPE | 400 | 0 | #FEE75C |

---

## 💰 Système de salaire

- **Automatique** : le bot distribue chaque **lundi à minuit** (vérif toutes les minutes)
- **Manuel** : commande `/salaire` sur Discord
- **API** : `POST /api/cron/salary` avec header `x-cron-secret: CRON_SECRET`

---

## 🔒 Supabase RLS — Politiques recommandées

Exécuter dans **Supabase > SQL Editor** :

```sql
-- Profils accessibles si authentifié
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_profile"  ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Casino et boutique : lecture si authentifié
ALTER TABLE casino_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_games" ON casino_games FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_items" ON shop_items FOR SELECT USING (auth.role() = 'authenticated');
```

> Les routes API utilisent `SUPABASE_SERVICE_ROLE_KEY` pour bypasser le RLS côté serveur.

---

## 🌐 Déploiement (Vercel)

1. `vercel --prod`
2. Ajouter les variables d'environnement dans Vercel
3. Configurer un **Cron Job Vercel** dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/salary",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

4. Le bot Discord tourne séparément (VPS, Railway, Fly.io...)
