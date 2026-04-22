# PocketBase Schema for ENT LunaVerse

## Collections à créer dans PocketBase

### 1. profiles
- `id` (auto) - UUID
- `discord_id` (text, unique) - ID Discord
- `username` (text) - Nom d'utilisateur
- `avatar_url` (url) - URL avatar
- `balance` (number, default: 100) - Solde bancaire
- `last_daily` (date) - Dernier daily réclamé
- `last_salary` (date) - Dernier salaire reçu
- `created` (auto)
- `updated` (auto)

### 2. roles
- `id` (auto) - UUID
- `name` (text) - Nom du rôle (admin, prof, eleve, cpe)
- `discord_role_id` (text) - ID du rôle Discord
- `salary_amount` (number, default: 0) - Salaire hebdomadaire
- `pocket_money` (number, default: 0) - Argent de poche hebdomadaire
- `color` (text, default: #5865F2) - Couleur hex
- `created` (auto)
- `updated` (auto)

### 3. user_roles (many-to-many via relation)
- `id` (auto) - UUID
- `user` (relation -> profiles) - Utilisateur
- `role` (relation -> roles) - Rôle
- `assigned_at` (date) - Date d'attribution
- `created` (auto)
- `updated` (auto)

### 4. transactions
- `id` (auto) - UUID
- `from_user` (relation -> profiles, nullable) - Expéditeur
- `to_user` (relation -> profiles, nullable) - Destinataire
- `amount` (number) - Montant
- `type` (select: transfer, daily, salary, shop, casino, pocket_money) - Type
- `description` (text) - Description
- `created` (auto)
- `updated` (auto)

### 5. posts
- `id` (auto) - UUID
- `user` (relation -> profiles) - Auteur
- `content` (text) - Contenu
- `image_url` (url, nullable) - Image
- `channel_id` (text, nullable) - ID canal Discord
- `message_id` (text, nullable) - ID message Discord
- `created` (auto)
- `updated` (auto)

### 6. comments
- `id` (auto) - UUID
- `post` (relation -> posts) - Post parent
- `user` (relation -> profiles) - Auteur
- `content` (text) - Contenu
- `created` (auto)
- `updated` (auto)

### 7. likes
- `id` (auto) - UUID
- `post` (relation -> posts) - Post liké
- `user` (relation -> profiles) - Utilisateur
- `created` (auto)
- `updated` (auto)

Règles API: limiter à un seul like par utilisateur par post (via @collection.unique)

### 8. shop_items
- `id` (auto) - UUID
- `name` (text) - Nom
- `description` (text) - Description
- `price` (number) - Prix
- `category` (select: drinks, snacks, cigarettes, other) - Catégorie
- `image_url` (url, nullable) - Image
- `is_available` (bool, default: true) - Disponibilité
- `created` (auto)
- `updated` (auto)

### 9. purchases
- `id` (auto) - UUID
- `user` (relation -> profiles) - Acheteur
- `item` (relation -> shop_items) - Article
- `quantity` (number, default: 1) - Quantité
- `total_price` (number) - Prix total
- `created` (auto)
- `updated` (auto)

### 10. casino_games
- `id` (auto) - UUID
- `name` (text) - Nom du jeu
- `description` (text) - Description
- `min_bet` (number, default: 1) - Mise minimum
- `max_bet` (number, default: 1000) - Mise maximum
- `multiplier_min` (number, default: 1) - Multiplicateur min
- `multiplier_max` (number, default: 10) - Multiplicateur max
- `created` (auto)
- `updated` (auto)

### 11. casino_history
- `id` (auto) - UUID
- `user` (relation -> profiles) - Joueur
- `game` (relation -> casino_games) - Jeu
- `bet_amount` (number) - Mise
- `win_amount` (number, default: 0) - Gain
- `is_win` (bool, default: false) - Victoire
- `created` (auto)
- `updated` (auto)

## Régles de sécurité (API Rules)

### profiles
- Lecture: `@request.auth.id != ""` (authentifié)
- Écriture: `@request.auth.id = id` (propriétaire uniquement)
- Admin: accès total

### roles
- Lecture: `@request.auth.id != ""`
- Écriture: `@request.auth.id != ""` (à limiter aux admins)

### user_roles
- Lecture: `@request.auth.id != ""`
- Écriture: `@request.auth.id != ""`

### transactions
- Lecture: `@request.auth.id = from_user.id || @request.auth.id = to_user.id`
- Écriture: `@request.auth.id != ""`

### posts, comments, likes
- Lecture: `@request.auth.id != ""`
- Écriture: `@request.auth.id = user.id`

### shop_items
- Lecture: `@request.auth.id != ""`
- Écriture: `@request.auth.id != ""` (admin)

### purchases
- Lecture: `@request.auth.id = user.id`
- Écriture: `@request.auth.id = user.id`

### casino_history
- Lecture: `@request.auth.id = user.id`
- Écriture: `@request.auth.id = user.id`

## Configuration OAuth2 Discord

Dans PocketBase Admin:
1. Paramètres > Auth providers
2. Ajouter Discord
3. Client ID: depuis Discord Developer Portal
4. Client Secret: depuis Discord Developer Portal
5. Redirect URL: `http://localhost:3000/api/auth/callback/discord`

## Données par défaut

### Rôles
- admin: salary 0, pocket 0, color #ED4245
- prof: salary 500, pocket 0, color #57F287
- eleve: salary 0, pocket 25, color #5865F2
- cpe: salary 600, pocket 0, color #FEE75C

### Jeux casino
- Machines à sous: min 1, max 500, mult 0.5-50
- Dés: min 1, max 200, mult 1.8
- Pile ou Face: min 1, max 100, mult 1.9

### Articles boutique
Boissons (3€): Coca-Cola, Sprite, Fanta, Eau (2€), Café (2.5€)
Snacks (2-4€): Chips, Barre chocolatée, Bonbons, Gâteau
Cigarettes (12€): Paquet
Autre: Téléphone (500€)
