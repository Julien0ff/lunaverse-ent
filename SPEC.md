# ENT LunaVerse — Specification Document

## Project Overview

**Project Name:** ENT LunaVerse
**Type:** School RP Discord ENT (Pronote Replacement)
**Stack:** Next.js 14 · TypeScript · Supabase · Tailwind CSS · discord.js
**Auth:** Discord OAuth2 via Supabase
**Target:** Membres du serveur RP Discord LunaVerse

---

## Environment Variables

```env
# Discord OAuth2
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=

# Discord Bot
DISCORD_BOT_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        ← OBLIGATOIRE pour créer les profils / bypass RLS

# Configuration
NEXT_PUBLIC_AUTHORIZED_ROLE_ID=   ← Discord Role ID autorisé à accéder à l'ENT
```

---

## Database Schema (Supabase)

### `profiles`
| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | = auth.users.id |
| `discord_id` | VARCHAR | Discord user ID |
| `username` | VARCHAR | Discord display name |
| `avatar_url` | VARCHAR | CDN Discord |
| `balance` | DECIMAL | Solde en € |
| `last_daily` | TIMESTAMP | Dernier daily |
| `last_salary` | TIMESTAMP | Dernier salaire |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

### `roles`
| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR | `admin`, `prof`, `eleve`, etc. |
| `discord_role_id` | VARCHAR | Discord role ID |
| `salary_amount` | DECIMAL | Salaire hebdo (équipe péda) |
| `pocket_money` | DECIMAL | Argent de poche hebdo (élèves) |
| `color` | VARCHAR | Hex color |

### `user_roles`
| Colonne | Type |
|---|---|
| `user_id` | UUID FK → profiles |
| `role_id` | UUID FK → roles |
| `assigned_at` | TIMESTAMP |

### `transactions`
| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `from_user_id` | UUID FK | null si don système |
| `to_user_id` | UUID FK | null si perte |
| `amount` | DECIMAL | |
| `type` | VARCHAR | `transfer`, `daily`, `salary`, `casino`, `purchase`, `admin` |
| `description` | TEXT | |
| `created_at` | TIMESTAMP | |

### `posts`
| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `content` | TEXT | Markdown Discord |
| `channel_id` | VARCHAR | Discord channel pour auto-post |
| `message_id` | VARCHAR | Discord message ID |
| `created_at` | TIMESTAMP | |

### `shop_items`
| Colonne | Type |
|---|---|
| `id` | UUID PK |
| `name` | VARCHAR |
| `description` | TEXT |
| `price` | DECIMAL |
| `category` | VARCHAR (`food`,`drink`,`snack`,`clothing`,`luxury`,`special`,`other`) |
| `is_available` | BOOLEAN |

### `purchases`
| Colonne | Type |
|---|---|
| `user_id` | UUID FK |
| `item_id` | UUID FK |
| `quantity` | INTEGER |
| `total_price` | DECIMAL |
| `created_at` | TIMESTAMP |

### `casino_games`
| Colonne | Type |
|---|---|
| `id` | UUID PK |
| `name` | VARCHAR |
| `description` | TEXT |
| `min_bet` | DECIMAL |
| `max_bet` | DECIMAL |

### `casino_history`
| Colonne | Type |
|---|---|
| `user_id` | UUID FK |
| `game_id` | UUID FK |
| `bet_amount` | DECIMAL |
| `win_amount` | DECIMAL |
| `is_win` | BOOLEAN |
| `created_at` | TIMESTAMP |

---

## Supabase RLS Policies recommandées

```sql
-- profiles : lecture publique si authentifié, écriture seulement via service role
CREATE POLICY "Users can read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- casino_games & shop_items : lecture publique si authentifié
CREATE POLICY "Read casino games" ON casino_games FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read shop items" ON shop_items FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Auth Flow

1. Clic "Se connecter avec Discord"
2. Redirect OAuth Discord (`supabase.auth.signInWithOAuth`)
3. Retour vers `/dashboard` avec session dans cookies (`createBrowserClient`)
4. `AuthContext` appelle `POST /api/auth/profile` (service role → upsert profil)
5. Profil chargé + rôles récupérés

---

## Application Pages

| Route | Description |
|---|---|
| `/` | Page de connexion Discord |
| `/dashboard` | Vue d'ensemble, solde, transactions récentes |
| `/bank` | Transferts, daily, salaire, historique |
| `/social` | Posts Markdown Discord, likes, commentaires |
| `/casino` | Slots, dés, pile/face |
| `/shop` | Articles par catégorie, achats |
| `/profile` | Profil Discord, rôles RP, stats |
| `/admin` | Gestion users, argent, casino, boutique, rôles (**admin only**) |

---

## API Routes

| Route | Méthode | Description |
|---|---|---|
| `/api/auth/profile` | POST | Upsert profil (service role) |
| `/api/bank/transactions` | GET | Historique transactions |
| `/api/bank/transactions` | POST | Transfer / daily / salary |
| `/api/casino/games` | GET | Liste jeux |
| `/api/casino/play` | POST | Jouer |
| `/api/shop/items` | GET | Liste articles |
| `/api/shop/purchase` | POST | Acheter |
| `/api/social/posts` | GET/POST | Posts |
| `/api/profile/stats` | GET | Stats profil |
| `/api/admin/users` | GET | Tous les utilisateurs |
| `/api/admin/give-money` | POST | Don d'argent |
| `/api/admin/casino` | POST/DELETE | CRUD jeux casino |
| `/api/admin/shop` | POST/PATCH/DELETE | CRUD articles boutique |
| `/api/admin/roles` | GET | Liste rôles |

---

## Salary System

- **Lundi à minuit** : cron (ou appel manuel) déclenche `POST /api/bank/transactions` avec `{ action: 'salary' }`
- **Élèves** : reçoivent `pocket_money` du rôle lié
- **Équipe pédagogique** : reçoivent `salary_amount`
- **Statuts** : `en_attente` → `distribué` → dans l'historique des transactions

---

## Discord Bot Commands

| Commande | Description |
|---|---|
| `/solde` | Voir son solde |
| `/envoie <user> <montant>` | Transférer de l'argent |
| `/daily` | Réclamer le daily (50€) |
| `/historique` | Voir l'historique |
| `/slots <mise>` | Machine à sous |
| `/dice <mise> <high/low>` | Dés |
| `/flip <mise> <heads/tails>` | Pile ou face |
| `/boutique` | Voir la boutique |
| `/buy <article>` | Acheter |
| `/addrole <user> <role>` | Assigner un rôle (admin) |
| `/give <user> <montant>` | Donner de l'argent (admin) |
