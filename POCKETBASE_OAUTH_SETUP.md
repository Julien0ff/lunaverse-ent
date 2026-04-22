# Configuration Discord OAuth2 pour LunaVerse ENT

## Étape 1: Configurer Discord Developer Portal

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Sélectionnez votre application (LunaVerse)
3. Allez dans **OAuth2** dans le menu de gauche
4. Sous **Redirects**, cliquez sur **Add Redirect** et ajoutez:
   - `http://localhost:3000/api/auth/discord`
5. Sous **Redirects**, cliquez sur **Add Redirect** et ajoutez aussi:
   - `http://127.0.0.1:8090/api/auth/oauth2-redirect` (pour PocketBase)
6. Sauvegardez les changements

## Étape 2: Configurer PocketBase (Optionnel mais recommandé)

1. Allez sur http://127.0.0.1:8090/_/
2. Connectez-vous avec votre admin
3. Allez dans **Paramètres** > **OAuth2**
4. Ajoutez Discord avec:
   - Client ID: `1478886237942321223`
   - Client Secret: `YDGMTzfUX9hN-tkJy54mVXhf1xx0QQvH`

## Étape 3: Mettre à jour .env.local

```
DISCORD_CLIENT_ID=1478886237942321223
DISCORD_CLIENT_SECRET=YDGMTzfUX9hN-tkJy54mVXhf1xx0QQvH
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord
```

Redémarrez le serveur Next.js après modification.
