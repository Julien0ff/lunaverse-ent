import { config } from 'dotenv'
config({ path: '.env.local' })

import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ChannelType } from 'discord.js'
import { createClient } from '@supabase/supabase-js'
// Memory fallback for settings if table doesn't exist yet
const memorySettings = new Map<string, any>()

export async function getServerSetting(key: string, defaultValue: any = null) {
  try {
    const { data, error } = await supabase
      .from('server_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error) throw error
    if (data) return data.value
  } catch (e) {
    if (memorySettings.has(key)) return memorySettings.get(key)
  }
  return defaultValue
}

export async function setServerSetting(key: string, value: any) {
  try {
    const { error } = await supabase
      .from('server_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) throw error
  } catch (e) {
    memorySettings.set(key, value)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Service role key — bypasses all RLS for bot operations
const supabase = createClient(supabaseUrl, serviceKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Discord colors
const BLURPLE = 0x5865F2
const SUCCESS = 0x57F287
const ERROR = 0xED4245
const WARNING = 0xFEE75C

// Role IDs
const ROLE_ELEVE = '1487571354323648582'
const ROLE_NOVA = '1487572001542508626'
const ROLE_NEBULEUSE = '1487571897364254841'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,   // Required for status sync (enable in Discord Dev Portal > Bot > Privileged Intents)
  ],
})

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName('solde')
    .setDescription('Voir votre solde actuel'),

  new SlashCommandBuilder()
    .setName('envoie')
    .setDescription('Envoyer de largent à un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur').setDescription('Lutilisateur').setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('montant').setDescription('Le montant à envoyer').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Réclamer votre récompense quotidienne'),


  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Jouer aux machines à sous')
    .addNumberOption(option =>
      option.setName('mise').setDescription('La mise').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('flip')
    .setDescription('Jouer à pile ou face')
    .addNumberOption(option =>
      option.setName('mise').setDescription('La mise').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('choix').setDescription('pile ou face').setRequired(true)
        .addChoices(
          { name: 'Pile', value: 'pile' },
          { name: 'Face', value: 'face' }
        )
    ),

  new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Jouer aux dés')
    .addNumberOption(option =>
      option.setName('mise').setDescription('La mise').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('choix').setDescription('haut ou bas').setRequired(true)
        .addChoices(
          { name: 'Haut (>50)', value: 'haut' },
          { name: 'Bas (<=50)', value: 'bas' }
        )
    ),

  new SlashCommandBuilder()
    .setName('boutique')
    .setDescription('Voir la boutique'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un article')
    .addStringOption(option =>
      option.setName('article').setDescription('Le nom de larticle').setRequired(true).setAutocomplete(true)
    )
    .addNumberOption(option =>
      option.setName('quantite').setDescription('La quantité').setRequired(false)
    ),


  new SlashCommandBuilder()
    .setName('historique')
    .setDescription('Voir vos dernières transactions'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Voir le classement des plus riches'),

  new SlashCommandBuilder()
    .setName('salaire')
    .setDescription('Percevoir votre salaire hebdomadaire (si disponible)'),

  new SlashCommandBuilder()
    .setName('give')
    .setDescription('[ADMIN] Donner de l\'argent à un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addNumberOption(o => o.setName('montant').setDescription('Montant en €').setRequired(true)),

  new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('[ADMIN] Assigner un rôle RP à un utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('L\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('role').setDescription('Nom du rôle dans la DB').setRequired(true)),

  new SlashCommandBuilder()
    .setName('inventaire')
    .setDescription('Voir vos achats'),

  new SlashCommandBuilder()
    .setName('utiliser')
    .setDescription('Utiliser un article de votre inventaire')
    .addStringOption(option =>
      option.setName('article').setDescription('Le nom de l\'article').setRequired(true).setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName('set-channel-code')
    .setDescription('[ADMIN] Configurer le système d\'inscription RP')
    .addChannelOption(o => o.setName('salon_inscription').setDescription('Où envoyer le bouton').setRequired(true))
    .addChannelOption(o => o.setName('salon_admin').setDescription('Où recevoir les candidatures').setRequired(true))
    .addChannelOption(o => o.setName('salon_reponses').setDescription('Où ping les joueurs acceptés').setRequired(true)),

  new SlashCommandBuilder()
    .setName('couple')
    .setDescription('Demander quelqu\'un en couple')
    .addUserOption(o => o.setName('utilisateur').setDescription('La personne à demander').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Faire un bisou à quelqu\'un')
    .addUserOption(o => o.setName('utilisateur').setDescription('La cible de votre bisou').setRequired(true)),

  new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Faire un câlin à quelqu\'un')
    .addUserOption(o => o.setName('utilisateur').setDescription('La cible de votre câlin').setRequired(true)),

  new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Voir votre profil RP ou celui d\'un autre utilisateur')
    .addUserOption(o => o.setName('utilisateur').setDescription('Profil à afficher').setRequired(false)),

  new SlashCommandBuilder()
    .setName('setcantine')
    .setDescription('[ADMIN] Configurer le salon et les horaires de la cantine')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon de la cantine').setRequired(true))
    .addStringOption(o => o.setName('heure_debut').setDescription('Heure de début (ex: 11:30)').setRequired(true))
    .addStringOption(o => o.setName('heure_fin').setDescription('Heure de fin (ex: 13:30)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('deploycantine')
    .setDescription('[ADMIN] Envoyer l\'embed pour scanner la carte de cantine'),

  new SlashCommandBuilder()
    .setName('setprofil_setup')
    .setDescription('[ADMIN] Configurer le salon validant les photos Pronote')
    .addChannelOption(o => o.setName('salon_admin').setDescription('Le salon admin').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setfeed')
    .setDescription('[ADMIN] Configurer le salon du réseau social')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon où envoyer les posts').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setmenu')
    .setDescription('[ADMIN] Configurer le salon du menu de la cantine')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon où envoyer et maj le menu').setRequired(true)),

  new SlashCommandBuilder()
    .setName('market')
    .setDescription('Voir les objets actuellement en vente sur Luna Market'),

  new SlashCommandBuilder()
    .setName('set_channel_house')
    .setDescription('[ADMIN] Configurer le salon pour les demandes de maison')
    .addChannelOption(o => o.setName('salon').setDescription('Le salon où envoyer le bouton').setRequired(true)),

  new SlashCommandBuilder()
    .setName('set_house_category')
    .setDescription('[ADMIN] Configurer la catégorie où créer les salons de maison')
    .addChannelOption(o => o.setName('categorie').setDescription('La catégorie Discord').addChannelTypes(ChannelType.GuildCategory).setRequired(true)),

  new SlashCommandBuilder()
    .setName('maison_setup')
    .setDescription('[ADMIN] Envoyer l\'embed pour demander une maison'),

  new SlashCommandBuilder()
    .setName('dormir')
    .setDescription('Se reposer dans sa maison (Restaure la fatigue)'),

  new SlashCommandBuilder()
    .setName('frigo')
    .setDescription('Ouvrir le frigo de sa maison (Restaure la faim/soif)'),
]

// Helper functions
async function getProfile(discordId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle()

  if (error) return null
  return data
}

/**
 * Returns true if the Discord user is an admin.
 * Checks two sources (in order):
 *  1. ADMIN_DISCORD_IDS env var (comma-separated Discord IDs) — bootstrap
 *  2. user_roles table in Supabase (role name === 'admin')
 */
async function isAdmin(discordId: string, interaction?: any): Promise<boolean> {
  // 1. Env var bootstrap (super-admins hardcoded)
  const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (envAdmins.includes(discordId)) return true

  // 2. Role or Permission check (Administrator or specific role)
  if (interaction?.guild) {
    const member = await interaction.guild.members.fetch(discordId).catch(() => null)
    if (member) {
      if (member.permissions.has(PermissionFlagsBits.Administrator)) return true
      if (member.roles.cache.has('1264659843667591259')) return true
    }
  }

  // 2. DB check
  const profile = await getProfile(discordId)
  if (!profile) return false

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', profile.id)

  return (userRoles || []).some((ur: any) => ur.role?.name === 'admin')
}

async function updateBalance(profileId: string, amount: number) {
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', profileId)
    .single()

  if (!currentProfile) return null

  const { data, error } = await supabase
    .from('profiles')
    .update({ balance: Number(currentProfile.balance) + amount })
    .eq('id', profileId)
    .select()
    .single()

  if (error) return null
  return data
}


// Synchronization function: status and roles
async function syncDiscordData() {
  console.log('🔄 Starting Discord-to-Supabase synchronization...')

  const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)

  // Fetch ALL roles from Supabase (uses discord_role_id for matching)
  const { data: allRoles } = await supabase.from('roles').select('id, name, discord_role_id')
  const dbRoles: { id: string; name: string; discord_role_id: string }[] = allRoles || []
  console.log(`📋 Roles in DB: ${dbRoles.map(r => `${r.name} (${r.discord_role_id})`).join(', ') || 'none'}`)

  // Build a quick lookup: discord_role_id → { id, name }
  const roleByDiscordId = Object.fromEntries(
    dbRoles.filter(r => r.discord_role_id).map(r => [r.discord_role_id, r])
  )
  // Also by name for admin injection
  const roleByName = Object.fromEntries(dbRoles.map(r => [r.name, r.id]))

  for (const guild of Array.from(client.guilds.cache.values())) {
    try {
      const members = await guild.members.fetch({ withPresences: true })
      console.log(`📡 Syncing ${members.size} members from guild: ${guild.name}`)

      for (const member of Array.from(members.values())) {
        if (member.user.bot) continue

        const status = member.presence?.status || 'offline'

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('discord_id', member.id)
          .maybeSingle()

        if (!profile) continue

        // 1. Update profile status
        await supabase
          .from('profiles')
          .update({
            discord_status: status,
            status_updated_at: new Date().toISOString(),
            username: member.user.username,
            avatar_url: member.user.displayAvatarURL(),
            nickname_rp: member.nickname || member.user.username
          })
          .eq('id', profile.id)

        // 2. Sync Admin role (ENV super-admins)
        if (envAdmins.includes(member.id) && roleByName['admin']) {
          await supabase.from('user_roles').upsert(
            { user_id: profile.id, role_id: roleByName['admin'] },
            { onConflict: 'user_id,role_id' }
          )
        }

        // 3. Dynamically sync ALL roles from Supabase that have a discord_role_id
        //    → checks if member has that Discord role → upserts into user_roles
        for (const [discordRoleId, dbRole] of Object.entries(roleByDiscordId)) {
          if (member.roles.cache.has(discordRoleId)) {
            await supabase.from('user_roles').upsert(
              { user_id: profile.id, role_id: dbRole.id },
              { onConflict: 'user_id,role_id' }
            )
            console.log(`  ✅ ${member.user.username} → '${dbRole.name}' synced (discord role ${discordRoleId})`)
          }
        }
      }
    } catch (err) {
      console.error(`❌ Error syncing guild ${guild.name}:`, err)
    }
  }
  console.log('✅ Synchronization complete.')
}

// ── Single-member sync helper ─────────────────────────────────────
// Reusable for guildMemberAdd + Realtime profile INSERT events
async function syncMember(member: any) {
  if (member.user?.bot) return

  const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean)

  const { data: allRoles } = await supabase.from('roles').select('id, name, discord_role_id')
  const dbRoles = allRoles || []
  const roleByDiscordId = Object.fromEntries(
    dbRoles.filter((r: any) => r.discord_role_id).map((r: any) => [r.discord_role_id, r])
  )
  const roleByName = Object.fromEntries(dbRoles.map((r: any) => [r.name, r.id]))

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('discord_id', member.id)
    .maybeSingle()

  if (!profile) {
    console.log(`  ⏳ No profile found for ${member.user?.username || member.id} — waiting for ENT login.`)
    return
  }

  const status = member.presence?.status || 'offline'

  await supabase.from('profiles').update({
    discord_status: status,
    status_updated_at: new Date().toISOString(),
    username: member.user?.username || member.displayName,
    avatar_url: member.user?.displayAvatarURL?.() || member.displayAvatarURL?.() || null,
    nickname_rp: member.nickname || member.user?.username || member.displayName
  }).eq('id', profile.id)

  // Admin sync
  if (envAdmins.includes(member.id) && roleByName['admin']) {
    await supabase.from('user_roles').upsert(
      { user_id: profile.id, role_id: roleByName['admin'] },
      { onConflict: 'user_id,role_id' }
    )
  }

  // Role sync
  for (const [discordRoleId, dbRole] of Object.entries(roleByDiscordId)) {
    if (member.roles?.cache?.has(discordRoleId)) {
      await supabase.from('user_roles').upsert(
        { user_id: profile.id, role_id: (dbRole as any).id },
        { onConflict: 'user_id,role_id' }
      )
      console.log(`  ✅ ${member.user?.username || member.id} → '${(dbRole as any).name}' synced`)
    }
  }

  console.log(`  ✅ Member synced: ${member.user?.username || member.id}`)
}

// ── Welcome DM on new member join ─────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return
  console.log(`👋 New member joined: ${member.user.username} (${member.id})`)

  try {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🌌 Bienvenue sur LunaVerse !')
      .setColor(BLURPLE)
      .setDescription(
        `Salut **${member.user.username}** ! \n\n` +
        `Bienvenue dans l'univers **LunaVerse** — ton ENT nouvelle génération.\n\n` +
        `🔗 **Connecte-toi à l'ENT** pour débloquer toutes les fonctionnalités :\n` +
        `• 💰 Économie virtuelle & boutique\n` +
        `• 🎰 Casino & mini-jeux\n` +
        `• 🍴 Cantine & menus du week-end\n` +
        `• 📱 Réseau social & messagerie\n` +
        `• ❤️ Système de survie RP\n\n` +
        `Utilise la commande \`/solde\` pour vérifier ton solde, ou \`/daily\` pour ta récompense quotidienne !`
      )
      .setFooter({ text: 'LunaVerse — ENT RP Immersif' })
      .setTimestamp()

    await member.send({ embeds: [welcomeEmbed] }).catch(() => {
      console.log(`  ⚠️ Could not DM ${member.user.username} (DMs disabled)`)
    })

    // Try to sync if they already have a profile
    await syncMember(member)
  } catch (err) {
    console.error(`❌ Error welcoming ${member.user.username}:`, err)
  }
})

// Event handlers
client.on('ready', async () => {
  console.log(`Bot logged in as ${client.user?.tag}`)
  console.log('📡 Initializing Supabase Realtime synchronization...')

  // Register commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!)

  try {
    await rest.put(Routes.applicationCommands(client.user!.id), { body: commands })
    console.log('✅ Slash commands registered globally.')
  } catch (error) {
    console.error('❌ Error registering commands:', error)
  }

  // Initial sync
  await syncDiscordData()

  // ── Auto-salary cron: runs every minute, triggers on Monday at midnight ──────────
  setInterval(async () => {
    const now = new Date()
    // Monday = 1, 00:00–00:01
    if (now.getDay() !== 1 || now.getHours() !== 0 || now.getMinutes() > 1) return

    console.log('💳 Distributing weekly salaries...')
    try {
      // Get all profiles that haven't received salary in 6+ days
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 3600 * 1000)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, balance, last_salary')
        .or(`last_salary.is.null,last_salary.lt.${sixDaysAgo.toISOString()}`)

      for (const profile of (profiles || [])) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role:roles(salary_amount, pocket_money, name)')
          .eq('user_id', profile.id)

        let total = 0
        for (const ur of (userRoles || [])) {
          const role = (ur as any).role
          if (!role) continue
          total += Number(role.salary_amount || 0) + Number(role.pocket_money || 0)
        }

        if (total <= 0) continue

        await supabase.from('profiles').update({
          balance: Number(profile.balance) + total,
          last_salary: now.toISOString()
        }).eq('id', profile.id)

        await supabase.from('transactions').insert([{
          from_user_id: null, to_user_id: profile.id,
          amount: total, type: 'salary',
          description: 'Salaire hebdomadaire automatique (Lundi)'
        }])

        console.log(`  → ${profile.username}: +${total}€`)
      }
      console.log(`✅ Salary distribution done for ${(profiles || []).length} user(s).`)
    } catch (err) {
      console.error('❌ Salary cron error:', err)
    }
    // ── Salary Reminder J-5 (Wednesday noon) ──
    if (now.getDay() === 3 && now.getHours() === 12 && now.getMinutes() === 0) {
      console.log('💳 Sending J-5 salary reminder...')
      try {
        const { data: profiles } = await supabase.from('profiles').select('discord_id').not('discord_id', 'is', null)
        for (const p of profiles || []) {
          const member = await client.users.fetch(p.discord_id).catch(() => null)
          if (member) await member.send({ embeds: [new EmbedBuilder().setTitle('💸 J-5 avant la paie !').setDescription('Courage, plus que 5 jours avant le versement de votre salaire hébdomadaire !').setColor(0xFEE75C)] }).catch(() => null)
        }
      } catch (err) { console.error(err) }
    }

    // ── Physical State Degradation (Periodic Cron - Every Hour) ──
    if (now.getMinutes() === 0) {
      const hour = now.getHours();
      try {
        const isDynamic = await getServerSetting('global_dynamic_stats', true)
        const { data: profiles } = await supabase.from('profiles').select('id, discord_id, hunger, thirst, fatigue, hygiene, health');
        for (const p of profiles || []) {
          if (!isDynamic) {
            // Force reset to 100 if dynamic stats are disabled
            await supabase.from('profiles').update({ hunger: 100, thirst: 100, fatigue: 100, hygiene: 100 }).eq('id', p.id);
            continue;
          }

          let h = p.hunger ?? 100;
          let t = p.thirst ?? 100;
          let f = p.fatigue ?? 100;
          let y = p.hygiene ?? 100;
          let s = p.health ?? 100;

          // 1. Periodic Loss (Toutes les 6 heures)
          if (hour % 6 === 0) {
            h = Math.max(0, h - 25);
            t = Math.max(0, t - 30);
          }

          // 2. Daily Penalties (Minuit)
          if (hour === 0) {
            t = Math.max(0, t - 100);
            y = Math.max(0, y - 25);
          }

          // 3. Morning Reset (Fatigue = 100 à 08:00)
          if (hour === 8) {
            f = 100;
          }

          // 4. Critical Condition (Si faim ou soif < 50, Santé -10 toutes les 3 heures)
          if (hour % 3 === 0 && (h < 50 || t < 50)) {
            s = Math.max(0, s - 10);
          }

          // Apply updates
          await supabase.from('profiles').update({ 
            hunger: h, 
            thirst: t, 
            fatigue: f, 
            hygiene: y, 
            health: s 
          }).eq('id', p.id);

          // Critical state alerts (DM)
          if (h <= 10 || t <= 10 || f <= 10 || s <= 20) {
            const member = await client.users.fetch(p.discord_id).catch(() => null);
            if (member) {
              const warnings = [];
              if (h <= 10) warnings.push('⚠️ **Faim critique**, mangez quelque chose !');
              if (t <= 10) warnings.push('⚠️ **Soif critique**, hydratez-vous !');
              if (f <= 10) warnings.push('⚠️ **Fatigue extrême**, pensez à vous reposer.');
              if (s <= 20) warnings.push('🆘 **Santé critique**, votre survie est en jeu !');
              
              if (warnings.length > 0) {
                await member.send({ 
                  embeds: [new EmbedBuilder().setTitle('❤️ État physique critique').setDescription(warnings.join('\n')).setColor(0xED4245)] 
                }).catch(() => null);
              }
            }
          }
        }
      } catch (err) { console.error('Error degrading physical stats', err); }
    }

    // ── Daily Reward Reminder ──
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, discord_id, last_daily').not('discord_id', 'is', null)
      for (const p of profiles || []) {
        const last = p.last_daily ? new Date(p.last_daily) : new Date(0)
        const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60)
        
        // Only remind exactly at 24h and 48h to avoid spamming every minute
        if (Math.floor(diff) === 24 && now.getMinutes() === 0) {
          const embed = new EmbedBuilder().setTitle('🎁 Récompense Quotidienne Disponible !').setColor(BLURPLE)
            .setDescription('Votre récompense de **50€** est prête. Cliquez sur le bouton ci-dessous pour la récupérer !')
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('daily_claim').setLabel('Réclamer 50€').setStyle(ButtonStyle.Primary).setEmoji('💰')
          )
          await sendDM(p.id, embed, [row])
        }
      }
    } catch {}

    // ── Notification Auto-cleanup (Every day at midnight) ──
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('🧹 Cleaning up old notifications...')
      try {
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 3600 * 1000)
        const { error } = await supabase
          .from('notifications')
          .delete()
          .lt('created_at', fifteenDaysAgo.toISOString())
        if (error) throw error
        console.log('✅ Cleanup complete.')
      } catch (err) { console.error('Cleanup error:', err) }
    }

    // ── Canteen Reminders (J-5 and J-1) ──
    // We check menus for (today + 1) and (today + 5)
    try {
      const tomorrow = (now.getDay() + 1) % 7
      const inFiveDays = (now.getDay() + 5) % 7

      if (now.getHours() === 10 && now.getMinutes() === 0) {
        const { data: menus } = await supabase.from('canteen_menus').select('*').or(`day_of_week.eq.${tomorrow},day_of_week.eq.${inFiveDays}`)
        if (menus && menus.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id').not('discord_id', 'is', null)
          for (const m of menus) {
            const isTomorrow = m.day_of_week === tomorrow
            const label = isTomorrow ? 'Demain' : 'Dans 5 jours'
            const embed = new EmbedBuilder().setTitle(`🍴 Menu de la Cantine (${label})`).setColor(WARNING)
              .setDescription(`**${m.starter || 'Entrée'}**\n**${m.main}**\n**${m.dessert || 'Dessert'}**`)
              .setFooter({ text: `Horaires: ${m.time_start} - ${m.time_end}` })
            
            for (const p of profiles || []) {
              await sendDM(p.id, embed)
            }
          }
        }
      }
    } catch {}

    // ── Process Pending Transactions ─────────────────────────
    try {
      const { data: pendingTxs } = await supabase
        .from('transactions')
        .select('*, from_user:profiles!from_user_id(username, nickname_rp)')
        .like('description', 'PENDING:%')
      
      for (const tx of pendingTxs || []) {
        const createdDate = new Date(tx.created_at)
        const now = new Date()
        // Process after 45 seconds (to ensure it feels like "around 1 min" or slightly less for better UX)
        if (now.getTime() - createdDate.getTime() > 45_000) {
          if (tx.to_user_id && tx.amount > 0) {
            const { data: recipient } = await supabase.from('profiles').select('balance, username').eq('id', tx.to_user_id).single()
            if (recipient) {
              const newBalance = Math.round((recipient.balance + tx.amount) * 100) / 100
              await supabase.from('profiles').update({ balance: newBalance }).eq('id', tx.to_user_id)
              
              // Mark as completed
              const cleanDesc = tx.description.replace('PENDING: ', '')
              await supabase.from('transactions').update({ description: cleanDesc }).eq('id', tx.id)
              
              // Notify recipient
              const senderName = tx.from_user?.nickname_rp || tx.from_user?.username || 'Un utilisateur'
              const embed = new EmbedBuilder()
                .setTitle('💸 Virement Reçu')
                .setColor(0x57F287) // Success Green
                .setDescription(`**${senderName}** vous a envoyé **${tx.amount}€** via virement bancaire.`)
                .setTimestamp()
              
              await sendDM(tx.to_user_id, embed)
              console.log(`✅ Processed pending transfer: ${tx.id} (${tx.amount}€ to ${recipient.username})`)
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to process pending transactions:', err)
    }

  }, 60_000) // check every minute

  // ── Realtime social sync ──────────────────────────────────────────
  console.log(`📡 Bot is in ${client.guilds.cache.size} guild(s):`)
  client.guilds.cache.forEach(g => console.log(`   → ${g.name} (${g.id})`))
  console.log(`📡 Listening for social activity...`)

    supabase
      .channel('ent-global-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload: any) => {
        try {
          const comment = payload.new
          const { data: post } = await supabase.from('posts').select('user_id').eq('id', comment.post_id).single()
          if (!post) return

          if (post.user_id !== comment.user_id) {
            const { data: cUser } = await supabase.from('profiles').select('username').eq('id', comment.user_id).single()
            const embed = new EmbedBuilder().setTitle('💬 Nouveau Commentaire').setColor(BLURPLE)
              .setDescription(`**${cUser?.username || 'Anonyme'}** a commenté votre post.\n\n_"${comment.content}"_`)
              .setTimestamp()
            await sendDM(post.user_id, embed)
          }
        } catch (err) { console.error('social comment relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, async (payload: any) => {
        try {
          const like = payload.new
          const { data: post } = await supabase.from('posts').select('user_id').eq('id', like.post_id).single()
          if (post && post.user_id !== like.user_id) {
            const { data: lUser } = await supabase.from('profiles').select('username').eq('id', like.user_id).single()
            const embed = new EmbedBuilder().setTitle('❤️ Nouveau Like').setColor(ERROR)
              .setDescription(`**${lUser?.username || 'Quelqu\'un'}** a aimé votre post !`)
              .setTimestamp()
            await sendDM(post.user_id, embed)
          }
        } catch (err) { console.error('like relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        try {
          const msg = payload.new
          const { data: sender } = await supabase.from('profiles').select('username').eq('id', msg.sender_id).maybeSingle()
          const embed = new EmbedBuilder().setTitle('💬 Nouveau Message Privé').setColor(BLURPLE)
            .setDescription(`Vous avez reçu un message de **${sender?.username || 'Inconnu'}** sur l'ENT.`)
          await sendDM(msg.receiver_id, embed)
        } catch (err) { console.error('msg relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friends' }, async (payload: any) => {
        try {
          const rel = payload.new
          if (rel.status === 'pending') {
            const { data: sender } = await supabase.from('profiles').select('username').eq('id', rel.user1_id).maybeSingle()
            const embed = new EmbedBuilder().setTitle('🫂 Demande d\'ami').setColor(SUCCESS)
              .setDescription(`**${sender?.username || 'Quelqu\'un'}** souhaite devenir votre ami sur l'ENT.`)
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId(`friend_accept|${rel.id}`).setLabel('Accepter').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`friend_decline|${rel.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger)
            )
            await sendDM(rel.user2_id, embed, [row])
          }
        } catch (err) { console.error('friend relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async (payload: any) => {
        try {
          const tx = payload.new
          let embed = null
          if (tx.type === 'tax') {
            embed = new EmbedBuilder().setTitle('💸 Taxe Prélevée').setColor(ERROR)
              .setDescription(`Un prélèvement de **${tx.amount}€** a été effectué pour vos taxes.\n_Motif: ${tx.description}_`)
          } else if (tx.type === 'salary') {
            embed = new EmbedBuilder().setTitle('💰 Salaire Reçu').setColor(SUCCESS)
              .setDescription(`Votre salaire de **${tx.amount}€** a été versé !`)
          } else if (tx.type === 'daily') {
            embed = new EmbedBuilder().setTitle('📅 Récompense Quotidienne').setColor(BLURPLE)
              .setDescription(`Vouz avez récupéré vos **${tx.amount}€** quotidiens !`)
          } else if (tx.type === 'casino') {
            const isWin = tx.description.toLowerCase().includes('gagné')
            embed = new EmbedBuilder().setTitle(isWin ? '🎰 Casino : VICTOIRE !' : '🎰 Casino : PERDU').setColor(isWin ? SUCCESS : ERROR)
              .setDescription(`Résultat : **${tx.description}**`)
          } else if (tx.type === 'transfer' && tx.to_user_id) {
            const { data: sender } = await supabase.from('profiles').select('username').eq('id', tx.from_user_id).maybeSingle()
            embed = new EmbedBuilder().setTitle('💸 Argent reçu !').setColor(SUCCESS)
              .setDescription(`**${sender?.username || 'Un utilisateur'}** vous a envoyé **${tx.amount}€**.\n_Motif: ${tx.description || 'Non précisé'}_`)
          } else if (tx.type === 'canteen') {
            embed = new EmbedBuilder().setTitle('🍱 Cantine LunaVerse').setColor(0xF97316)
              .setDescription(`Transaction : **${tx.amount}€**\n_Détails: ${tx.description}_`)
          }
          if (embed && tx.to_user_id) await sendDM(tx.to_user_id, embed)
          else if (embed && tx.from_user_id && tx.type === 'tax') await sendDM(tx.from_user_id, embed)
        } catch (err) { console.error('tx relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dating_swipes' }, async (payload: any) => {
        try {
          const swipe = payload.new
          if (!swipe.liked) return
          const { data: mutual } = await supabase.from('dating_swipes').select('id').eq('swiper_id', swipe.swiped_id).eq('swiped_id', swipe.swiper_id).eq('liked', true).single()
          if (mutual) {
            const embed = new EmbedBuilder().setTitle('💘 Nouveau Match !').setColor(0xFF69B4)
              .setDescription('C\'est un match ! Vous et un autre utilisateur vous plaisez mutuellement.')
            await sendDM(swipe.swiper_id, embed)
            await sendDM(swipe.swiped_id, embed)
          }
        } catch (err) { console.error('dating relay fail', err) }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'canteen_menus' }, async () => {
        try { await updateCanteenMenuMessage() } catch (err) { console.error('canteen sync fail', err) }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'houses' }, async (payload: any) => {
        try {
          const house = payload.new
          const oldHouse = payload.old
          
          // Only trigger if status changed to active and no channel exists yet
          if (house.status === 'active' && !house.discord_channel_id) {
            const { data: owner } = await supabase.from('profiles').select('discord_id, username').eq('id', house.owner_id).single()
            if (!owner?.discord_id) return

            const categoryId = await getServerSetting('house_category_id')
            const guild = client.guilds.cache.first() // Assuming single guild bot for simplicity or find guild by member
            if (!guild) return

            const member = await guild.members.fetch(owner.discord_id).catch(() => null)
            if (!member) return

            // Create private channel
            const channelName = `🏠-${house.name.toLowerCase().replace(/\s+/g, '-')}`.substring(0, 32)
            const channel = await guild.channels.create({
              name: channelName,
              type: ChannelType.GuildText,
              parent: categoryId || null,
              permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // Hide for everyone
                { id: owner.discord_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }
              ]
            })

            // Update DB
            await supabase.from('houses').update({ discord_channel_id: channel.id }).eq('id', house.id)

            // Welcome message
            const embed = new EmbedBuilder()
              .setTitle(`🏠 Bienvenue dans votre maison : ${house.name}`)
              .setDescription(`Félicitations <@${owner.discord_id}>, votre demande de propriété a été acceptée !\n\n**Commandes utilisables ici :**\n• \`/dormir\` : Pour restaurer votre énergie (nécessite un Lit)\n• \`/frigo\` : Pour restaurer faim/soif (nécessite un Frigo)\n\nVous pouvez gérer les accès et vos meubles directement sur l'ENT.`)
              .setColor(SUCCESS)
              .setThumbnail(member.user.displayAvatarURL())

            await channel.send({ content: `<@${owner.discord_id}>`, embeds: [embed] })
          }

          // PERMISSION SYNC (on any update if channel exists)
          if (house.discord_channel_id) {
            const guild = client.guilds.cache.first()
            if (!guild) return
            const channel = await guild.channels.fetch(house.discord_channel_id).catch(() => null)
            if (channel && channel.isTextBased()) {
              const { data: owner } = await supabase.from('profiles').select('discord_id').eq('id', house.owner_id).single()
              const { data: members } = await supabase.from('profiles').select('discord_id').in('id', house.members || [])
              const { data: blacklist } = await supabase.from('profiles').select('discord_id').in('id', house.blacklist || [])
              const { data: adminRoles } = await supabase.from('roles').select('discord_role_id').eq('name', 'admin') // Assuming 'admin' is the staff role name

              const overwrites: any[] = [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }
              ]

              // Add Staff Access
              for (const admin of (adminRoles || [])) {
                if (admin.discord_role_id) {
                  overwrites.push({ id: admin.discord_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })
                }
              }

              if (owner?.discord_id) {
                overwrites.push({ id: owner.discord_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ManageMessages] })
              }

              for (const m of (members || [])) {
                if (m.discord_id) overwrites.push({ id: m.discord_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] })
              }

              for (const b of (blacklist || [])) {
                if (b.discord_id) overwrites.push({ id: b.discord_id, deny: [PermissionFlagsBits.ViewChannel] })
              }

              await (channel as any).permissionOverwrites.set(overwrites)
            }
          }
        } catch (err) { console.error('house sync relay fail', err) }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, async (payload: any) => {
        // A new user just logged into the ENT for the first time → sync their Discord roles
        try {
          const newProfile = payload.new
          if (!newProfile?.discord_id) return
          console.log(`🆕 New ENT profile created: ${newProfile.username} (${newProfile.discord_id}) — syncing roles...`)

          // Find the member in all guilds
          for (const guild of Array.from(client.guilds.cache.values())) {
            const member = await guild.members.fetch(newProfile.discord_id).catch(() => null)
            if (member) {
              await syncMember(member)
              break
            }
          }
        } catch (err) { console.error('new profile sync fail', err) }
      })
      .subscribe((status: string, err?: Error) => {
        if (err) console.error('📡 Realtime subscription error:', err)
        console.log(`📡 Realtime subscription status: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log('🚀 Bot is now listening for all updates!')
        }
      })

}) // end client.on('ready')

// Helper for DM notification
async function sendDM(profileId: string, embed: EmbedBuilder, components: any[] = []) {
  try {
    const { data: profile } = await supabase.from('profiles').select('discord_id, notifications_enabled').eq('id', profileId).maybeSingle()
    if (profile?.discord_id && profile.notifications_enabled !== false) {
      const user = await client.users.fetch(profile.discord_id).catch(() => null)
      if (user) await user.send({ embeds: [embed], components: (components as any) }).catch(() => null)
    }
  } catch (err) { console.error('DM fail', err) }
}

// ── Canteen Menu Sync Function ─────────────────────────────────────
export async function updateCanteenMenuMessage() {
  try {
    const channelId = await getServerSetting('discord_canteen_menu_channel_id')
    if (!channelId) return

    const channel = await client.channels.fetch(channelId).catch(() => null)
    if (!channel || !channel.isTextBased()) return

    // Calculate dates for this weekend (Saturday and Sunday)
    const now = new Date()
    const day = now.getDay()
    const diffToSaturday = 6 - day
    const saturday = new Date(now)
    saturday.setDate(now.getDate() + diffToSaturday)
    const sunday = new Date(saturday)
    sunday.setDate(saturday.getDate() + 1)

    const satStr = saturday.toISOString().split('T')[0]
    const sunStr = sunday.toISOString().split('T')[0]

    // Fetch menus for >= today
    const today = new Date()
    today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]

    const { data: menus } = await supabase
      .from('canteen_menus')
      .select('*')
      .gte('menu_date', todayStr)
      .order('menu_date', { ascending: true })
      .order('time_start', { ascending: true })

    if (!menus) return

    // Filter weekend menus
    const weekendMenus = menus.filter(m => m.menu_date === satStr || m.menu_date === sunStr)
    // Find future menus (after this weekend)
    const futureMenus = menus.filter(m => m.menu_date > sunStr)

    const embed = new EmbedBuilder()
      .setTitle('🍽️ Menu de la Cantine (Week-end)')
      .setColor(0xF97316)
      .setTimestamp()

    if (weekendMenus.length === 0) {
      embed.setDescription('_Aucun menu prévu pour ce week-end._')
    } else {
      for (const m of weekendMenus) {
        // Parse date manually to avoid timezone shifts (YYYY-MM-DD)
        const [y, mon, d] = m.menu_date.split('-').map(Number)
        const dateObj = new Date(y, mon - 1, d)
        const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        const title = `Menu du ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`
        
        let desc = `**Horaire :** ${m.time_start.slice(0, 5)} - ${m.time_end.slice(0, 5)}\n\n`
        if (m.starter) desc += `🥗 **Entrée :** ${m.starter}\n`
        desc += `🍗 **Plat :** ${m.main}\n`
        if (m.side) desc += `🍟 **Accompagnement :** ${m.side}\n`
        if (m.dessert) desc += `🍰 **Dessert :** ${m.dessert}\n`
        if (m.drink) desc += `🥤 **Boisson :** ${m.drink}\n`
        if (m.note) desc += `\n*💡 ${m.note}*`
        
        embed.addFields({ name: title, value: desc, inline: false })
      }
    }

    const components = []
    const row = new ActionRowBuilder<ButtonBuilder>()

    if (futureMenus.length > 0) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('cantine_show_more')
          .setLabel('Menus suivants')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📅')
      )
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId('cantine_admin_refresh')
        .setLabel('Actualiser')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄')
    )

    components.push(row)

    const messageId = await getServerSetting('discord_canteen_menu_message_id')
    let message = null
    if (messageId) {
      message = await (channel as any).messages.fetch(messageId).catch(() => null)
    }

    if (message) {
      await message.edit({ embeds: [embed], components })
    } else {
      const newMessage = await (channel as any).send({ embeds: [embed], components })
      await setServerSetting('discord_canteen_menu_message_id', newMessage.id)
    }
  } catch (err) {
    console.error('Failed to update canteen menu message:', err)
  }
}


// ── Canteen messages control ─────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return

  try {
    const cantineId = await getServerSetting('cantine_channel_id')
    if (cantineId && message.channel.id === cantineId) {
      if (await isAdmin(message.author.id)) return // Admin can always write

      const startStr = await getServerSetting('cantine_start_time', '15:30')
      const endStr = await getServerSetting('cantine_end_time', '16:00')

      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // Parse "HH:mm"
      const [sH, sM] = startStr.split(':').map(Number)
      const startMinutes = (sH || 15) * 60 + (sM || 30)

      const [eH, eM] = endStr.split(':').map(Number)
      const endMinutes = (eH || 16) * 60 + (eM || 0)

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        await message.delete().catch(() => null)
        const m = await message.channel.send(`<@${message.author.id}>, la cantine est ouverte uniquement de ${startStr} à ${endStr}.`)
        setTimeout(() => m.delete().catch(() => null), 5000)
      }
    }
  } catch (e) {
    console.error('Error handling messageCreate for cantine', e)
  }
})

// ── Presence sync : store Discord status in Supabase ─────────────────────────
client.on('presenceUpdate', async (_old, newPresence) => {
  if (!newPresence.userId || !newPresence.guild) return
  const status = newPresence.status || 'offline' // 'online' | 'idle' | 'dnd' | 'offline'
  const discordId = newPresence.userId

  try {
    // Try to find the profile by discord_id and update status
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle()

    if (profile) {
      try {
        await supabase
          .from('profiles')
          .update({ discord_status: status, status_updated_at: new Date().toISOString() })
          .eq('id', profile.id)
      } catch { /* ignore if column doesn't exist yet */ }
    }
  } catch { }
})

// ── Auto role sync on Discord role change ──────────────────────────────────────
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const discordId = newMember.id
  if (newMember.user.bot) return

  // Only process if roles actually changed
  const oldRoleIds = new Set(oldMember.roles.cache.keys())
  const newRoleIds = new Set(newMember.roles.cache.keys())
  const changed = Array.from(newRoleIds).some(id => !oldRoleIds.has(id)) || Array.from(oldRoleIds).some(id => !newRoleIds.has(id))
  if (!changed) return

  try {
    const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', discordId).maybeSingle()
    if (!profile) return

    const { data: allRoles } = await supabase.from('roles').select('id, name, discord_role_id')
    const dbRoles: { id: string; name: string; discord_role_id: string }[] = allRoles || []
    const roleByDiscordId = Object.fromEntries(dbRoles.filter(r => r.discord_role_id).map(r => [r.discord_role_id, r]))

    for (const [discordRoleId, dbRole] of Object.entries(roleByDiscordId)) {
      if (newMember.roles.cache.has(discordRoleId)) {
        await supabase.from('user_roles').upsert(
          { user_id: profile.id, role_id: dbRole.id },
          { onConflict: 'user_id,role_id' }
        )
      } else if (oldMember.roles.cache.has(discordRoleId)) {
        // Role was removed
        await supabase.from('user_roles')
          .delete()
          .eq('user_id', profile.id)
          .eq('role_id', dbRole.id)
      }
    }
    console.log(`🔄 Auto-synced roles for ${newMember.user.username}`)
  } catch (err) {
    console.error('guildMemberUpdate sync error:', err)
  }
})

client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused()
    if (interaction.commandName === 'buy' || interaction.commandName === 'utiliser') {
      try {
        const profile = await getProfile(interaction.user.id)
        if (interaction.commandName === 'utiliser' && profile) {
          // Autocomplete from purchases
          const { data: purchases } = await supabase
            .from('purchases')
            .select('item:shop_items(id, name)')
            .eq('user_id', profile.id)

          const f = focusedValue.toLowerCase()
          const matched = (purchases || [])
            .map((p: any) => p.item)
            .filter((item: any) => item && item.name && item.name.toLowerCase().includes(f))

          // Remove duplicates
          const uniqueNames = Array.from(new Set(matched.map(i => i.name)))
          await interaction.respond(
            uniqueNames.slice(0, 25).map((name: any) => ({ name, value: name }))
          )
        } else {
          const { data: items } = await supabase
            .from('shop_items')
            .select('id, name, price')
            .eq('is_available', true)
            .ilike('name', `%${focusedValue}%`)
            .limit(25)
          if (items) await interaction.respond(items.map(item => ({ name: `${item.name} (${item.price}€)`, value: item.id })))
        }
      } catch (error) { console.error('Autocomplete error:', error) }
    }
    return
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'house_request_modal') {
      const profile = await getProfile(interaction.user.id)
      if (!profile) return interaction.reply({ content: '❌ Erreur profil.', ephemeral: true })

      const name = interaction.fields.getTextInputValue('name')
      
      const { data: existing } = await supabase.from('houses').select('id').eq('owner_id', profile.id).maybeSingle()
      if (existing) return interaction.reply({ content: '❌ Vous avez déjà une maison ou une demande en cours.', ephemeral: true })

      const { error } = await supabase.from('houses').insert([{ owner_id: profile.id, name, status: 'pending' }])
      if (error) return interaction.reply({ content: '❌ Erreur lors de l\'enregistrement.', ephemeral: true })

      await interaction.reply({ content: `✅ Votre demande pour la maison **"${name}"** a été envoyée ! Elle sera validée prochainement par l'administration.`, ephemeral: true })
      return
    }

    if (interaction.customId === 'modal_profil_edit_infos') {
      const targetProfile = await getProfile(interaction.user.id)
      if (!targetProfile) {
        await interaction.reply({ content: '❌ Erreur profil.', ephemeral: true })
        return
      }
      const dob = interaction.fields.getTextInputValue('dob')
      const sexe = interaction.fields.getTextInputValue('sexe')
      const desc = interaction.fields.getTextInputValue('desc')

      await supabase.from('profiles').update({
        dob: dob || targetProfile.dob,
        sexe: sexe || targetProfile.sexe,
        description: desc || targetProfile.description
      }).eq('id', targetProfile.id)

      await interaction.reply({ content: '✅ Vos informations ont été mises à jour.', ephemeral: true })
      return
    }

    if (interaction.customId === 'modal_profil_photo_only' || interaction.customId === 'modal_profil_photo_pronote') {
      const targetProfile = await getProfile(interaction.user.id)
      if (!targetProfile) {
        await interaction.reply({ content: '❌ Erreur profil.', ephemeral: true })
        return
      }
      const url = interaction.fields.getTextInputValue('url')

      // S'assurer que le lien est basique
      if (!url.startsWith('http')) {
        await interaction.reply({ content: '❌ Merci de mettre un lien d\'image valide (http...).', ephemeral: true })
        return
      }

      await supabase.from('profiles').update({ pronote_avatar_url: url }).eq('id', targetProfile.id)

      if (interaction.customId === 'modal_profil_photo_only') {
        await interaction.reply({ content: '✅ Votre photo de profil a été modifiée uniquement pour l\'ENT RP.', ephemeral: true })
      } else {
        // Send request to PRONOTE Admin channel
        const pChanId = await getServerSetting('pronote_admin_id')
        if (!pChanId) {
          await interaction.reply({ content: '✅ Photo modifiée. ❌ Impossible d\'envoyer à Pronote: Salon staff non configuré.', ephemeral: true })
          return
        }
        const chan = await client.channels.fetch(pChanId).catch(() => null)
        if (!chan || !chan.isTextBased()) {
          await interaction.reply({ content: '✅ Photo modifiée. ❌ Salon admin pronote introuvable.', ephemeral: true })
          return
        }

        const embed = new EmbedBuilder()
          .setTitle('Demande d\'ajout Pronote')
          .setDescription(`<@${interaction.user.id}> souhaite utiliser cette photo pour son Pronote.`)
          .setImage(url)
          .setColor(WARNING)

        const btnAcc = new ButtonBuilder().setCustomId(`pronote_upload_accept|${interaction.user.id}`).setLabel('Accepter').setStyle(ButtonStyle.Success).setEmoji('1217171776220561409')
        const btnRef = new ButtonBuilder().setCustomId(`pronote_upload_refuse|${interaction.user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setEmoji('1262454063912452207')
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnAcc, btnRef)

        await (chan as any).send({ embeds: [embed], components: [row] })
        await interaction.reply({ content: '✅ Votre photo a été modifiée sur l\'ENT RP. La demande pour Pronote a été envoyée au staff !', ephemeral: true })
      }
      return
    }

    if (interaction.customId.startsWith('rp_enroll_modal|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 3) return
      const adminId = parts[1]
      const responsesId = parts[2]

      const prenom = interaction.fields.getTextInputValue('prenom')
      const nom = interaction.fields.getTextInputValue('nom')
      const dob = interaction.fields.getTextInputValue('age')
      const optionClub = interaction.fields.getTextInputValue('option_club') || 'Aucune'
      const desc = interaction.fields.getTextInputValue('desc') || 'Aucune'

      const embed = new EmbedBuilder()
        .setTitle('Nouvelle Inscription RP')
        .setColor(WARNING)
        .addFields(
          { name: 'Utilisateur', value: `<@${interaction.user.id}>` },
          { name: 'ID Discord', value: interaction.user.id },
          { name: 'Prénom RP', value: prenom, inline: true },
          { name: 'Nom RP', value: nom, inline: true },
          { name: 'Classe souhaitée', value: '_Non assignée_', inline: true },
          { name: 'Date de Naissance RP', value: dob, inline: true },
          { name: 'Option / Club', value: optionClub, inline: true },
          { name: 'Description', value: desc }
        )

      const btnAcc = new ButtonBuilder().setCustomId(`rp_accept|${interaction.user.id}|${responsesId}`).setLabel('Accepter').setStyle(ButtonStyle.Success).setEmoji('1217171776220561409')
      const btnRef = new ButtonBuilder().setCustomId(`rp_refuse|${interaction.user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setEmoji('1262454063912452207')
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnAcc, btnRef)

      const adminChannel = await client.channels.fetch(adminId).catch(() => null)
      if (adminChannel && adminChannel.isTextBased()) {
        await (adminChannel as any).send({ embeds: [embed], components: [row] })
        await interaction.reply({ content: '✅ Votre demande a été envoyée au staff !', ephemeral: true })
      } else {
        await interaction.reply({ content: '❌ Erreur de configuration: salon admin introuvable.', ephemeral: true })
      }
      return
    }

    if (interaction.customId.startsWith('rp_accept_modal|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 5) return
      const targetUserId = parts[1]
      const responsesId = parts[2]
      const messageId = parts[3]
      const fClasse = parts[4]

      const pronoteId = interaction.fields.getTextInputValue('pronote_id')
      const pronotePass = interaction.fields.getTextInputValue('pronote_pass')

      try {
        if (!interaction.channel) {
          await interaction.reply({ content: 'Erreur: Impossible de lire le salon.', ephemeral: true })
          return
        }
        const msg = await interaction.channel.messages.fetch(messageId)
        if (msg && msg.embeds.length > 0) {
          const embed = msg.embeds[0]
          const fPrenom = embed.fields.find(f => f.name === 'Prénom RP')?.value
          const fNom = embed.fields.find(f => f.name === 'Nom RP')?.value

          if (fPrenom && fNom && fClasse) {
            const guild = interaction.guild
            if (guild) {
              const member = await guild.members.fetch(targetUserId).catch(() => null)
              if (member) {
                // Formatting: Class・Prénom NOM (NOM in uppercase)
                const newNick = `${fClasse}・${fPrenom} ${fNom.toUpperCase()}`.substring(0, 32)
                let nickError = false
                await member.setNickname(newNick).catch(err => {
                  console.error('Nickname issue:', err)
                  nickError = true
                })

                // Save nickname_rp to Supabase profile
                try {
                  const targetProfile = await getProfile(targetUserId)
                  if (targetProfile) {
                    await supabase.from('profiles').update({ nickname_rp: newNick }).eq('id', targetProfile.id)
                  }
                } catch { }

                if (nickError) {
                  await interaction.followUp({
                    content: `- **Alcohol Stat Definition**: Confirmed 100 = Sober.
- **Reset Timing**: Confirmed 08:00 AM.
- **Midnight Penalty**: Confirmed for Thirst (-100).
rId}>.\nC'est généralement dû à une hiérarchie de rôles trop basse (le bot ne peut pas renommer les administrateurs ou les personnes ayant un rôle supérieur au sien).`,
                    ephemeral: true
                  }).catch(() => null)
                }

                // --- Role automation ---
                try {
                  const rolesToAdd = [ROLE_ELEVE]
                  if (fClasse === 'NOV') rolesToAdd.push(ROLE_NOVA)
                  if (fClasse === 'NÉB') rolesToAdd.push(ROLE_NEBULEUSE)

                  await member.roles.add(rolesToAdd)
                } catch (roleErr) {
                  console.error('Role addition issue:', roleErr)
                }
                // -----------------------
              }
            }
          }

          await msg.edit({
            components: [],
            content: `✅ Accepté par <@${interaction.user.id}>`,
            embeds: [EmbedBuilder.from(msg.embeds[0]).spliceFields(4, 1, { name: 'Classe assignée', value: `**${fClasse}**`, inline: true })]
          })
        }
      } catch (e) {
        console.error('Error handling accept modal', e)
        await interaction.reply({ content: 'Erreur lors de l\'acceptation.', ephemeral: true })
        return
      }

      const rChan = await client.channels.fetch(responsesId).catch(() => null)
      if (rChan && rChan.isTextBased()) {
        const infoEmbed = new EmbedBuilder()
          .setTitle('🎉 Ton compte a été créé !')
          .setDescription(`<@${targetUserId}>, ton inscription a été validée par <@${interaction.user.id}>.\nClique sur le bouton ci-dessous pour récupérer tes identifiants (accessible uniquement par toi).`)
          .setColor(SUCCESS)

        const btnRec = new ButtonBuilder()
          .setCustomId(`rp_rec|${targetUserId}|${pronoteId}|${pronotePass}`)
          .setLabel('Récupérer mes codes')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('1293639591797985350')
        const rowRec = new ActionRowBuilder<ButtonBuilder>().addComponents(btnRec)

        await (rChan as any).send({ content: `<@${targetUserId}>`, embeds: [infoEmbed], components: [rowRec] })
      }

      // Check if we already sent a followUp (due to nickError) to avoid double response issues if possible
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'L\'utilisateur a été accepté et les codes envoyés.', ephemeral: true })
      } else {
        // If we already followed up for the nick error, we can just edit the reply or send another follow-up
        await interaction.followUp({ content: '✅ L\'inscription est terminée.', ephemeral: true }).catch(() => null)
      }
      return
    }
  }

  if (interaction.isButton()) {
    // ── Friendship & Daily Reward DM Buttons ──
    if (interaction.customId.startsWith('friend_accept|')) {
      const parts = interaction.customId.split('|')
      const id = parts[1]
      const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', id)
      if (error) return interaction.reply({ content: '❌ Erreur.', ephemeral: true })
      await interaction.update({ content: '✅ Vous avez accepté la demande d\'ami !', embeds: [], components: [] })
      return
    }

    if (interaction.customId.startsWith('friend_decline|')) {
      const parts = interaction.customId.split('|')
      const id = parts[1]
      await supabase.from('friends').delete().eq('id', id)
      await interaction.update({ content: '❌ Vous avez décliné la demande d\'ami.', embeds: [], components: [] })
      return
    }

    if (interaction.customId === 'cantine_show_more') {
      const today = new Date()
      today.setHours(0,0,0,0)
      
      const day = today.getDay()
      const diffToSaturday = 6 - day
      const saturday = new Date(today)
      saturday.setDate(today.getDate() + diffToSaturday)
      const sunday = new Date(saturday)
      sunday.setDate(saturday.getDate() + 1)
      const sunStr = sunday.toISOString().split('T')[0]

      const { data: menus } = await supabase
        .from('canteen_menus')
        .select('*')
        .gt('menu_date', sunStr)
        .order('menu_date', { ascending: true })
        .order('time_start', { ascending: true })

      if (!menus || menus.length === 0) {
        return interaction.reply({ content: '_Aucun autre menu n\'est programmé pour le moment._', ephemeral: true })
      }

      const embed = new EmbedBuilder()
        .setTitle('📅 Menus des semaines prochaines')
        .setColor(0xF97316)
        .setDescription('_Ce menu est amené à changer_')
      
      for (const m of menus) {
        const dateObj = new Date(m.menu_date)
        const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        const title = `Menu du ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`
        
        let desc = `**Horaire :** ${m.time_start.slice(0, 5)} - ${m.time_end.slice(0, 5)}\n\n`
        if (m.starter) desc += `🥗 **Entrée :** ${m.starter}\n`
        desc += `🍗 **Plat :** ${m.main}\n`
        if (m.side) desc += `🍟 **Accompagnement :** ${m.side}\n`
        if (m.dessert) desc += `🍰 **Dessert :** ${m.dessert}\n`
        if (m.drink) desc += `🥤 **Boisson :** ${m.drink}\n`
        if (m.note) desc += `\n*💡 ${m.note}*`
        
        embed.addFields({ name: title, value: desc, inline: false })
      }

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    if (interaction.customId === 'daily_claim') {
      const profile = await getProfile(interaction.user.id)
      if (!profile) return interaction.reply({ content: '❌ Profil non trouvé.', ephemeral: true })

      const lastDaily = profile.last_daily ? new Date(profile.last_daily) : null
      const now = new Date()
      if (lastDaily) {
        const hours = (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60)
        if (hours < 24) {
          const rem = Math.floor(24 - hours)
          return interaction.reply({ content: `⏳ Patientez encore **${rem}h**.`, ephemeral: true })
        }
      }

      const amount = 50
      await supabase.from('profiles').update({ balance: Number(profile.balance) + amount, last_daily: now.toISOString() }).eq('id', profile.id)
      await supabase.from('transactions').insert([{ from_user_id: null, to_user_id: profile.id, amount, type: 'daily', description: 'Récompense Daily (Discord DM)' }])
      await interaction.update({ content: `🎉 Vous avez récupéré **${amount}€** !`, components: [] })
      return
    }
    if (interaction.customId === 'house_request_start') {
      const profile = await getProfile(interaction.user.id)
      if (!profile) return interaction.reply({ content: '❌ Vous devez être inscrit sur l\'ENT pour demander une maison.', ephemeral: true })

      const modal = new ModalBuilder()
        .setCustomId('house_request_modal')
        .setTitle('Demande de Maison')

      const tName = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Nom de votre maison / projet')
        .setPlaceholder('Ex: Villa de Julien / Bureau de l\'Union...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(tName))
      await interaction.showModal(modal)
      return
    }

    if (interaction.customId.startsWith('rp_enroll|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 3) return
      const adminId = parts[1]
      const responsesId = parts[2]

      const modal = new ModalBuilder()
        .setCustomId(`rp_enroll_modal|${adminId}|${responsesId}`)
        .setTitle('Inscription RP')

      const tPrenom = new TextInputBuilder().setCustomId('prenom').setLabel('Prénom RP').setStyle(TextInputStyle.Short).setRequired(true)
      const tNom = new TextInputBuilder().setCustomId('nom').setLabel('Nom RP').setStyle(TextInputStyle.Short).setRequired(true)
      const tAge = new TextInputBuilder().setCustomId('age').setLabel('Date de naissance RP').setStyle(TextInputStyle.Short).setRequired(true)
      const tOptionClub = new TextInputBuilder().setCustomId('option_club').setLabel('Option / Club').setPlaceholder('ex: Allemand, Cybersécurité...').setStyle(TextInputStyle.Short).setRequired(false)
      const tDesc = new TextInputBuilder().setCustomId('desc').setLabel('Description du personnage').setPlaceholder('Décris ton personnage RP, son histoire, sa personnalité, etc.').setStyle(TextInputStyle.Paragraph).setRequired(false)

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(tPrenom),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tNom),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tAge),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tOptionClub),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tDesc)
      )

      await interaction.showModal(modal)
      return
    }

    if (interaction.customId.startsWith('rp_accept|')) {
      if (!await isAdmin(interaction.user.id, interaction)) {
        await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
        return
      }
      const parts = interaction.customId.split('|')
      if (parts.length < 3) return
      const targetId = parts[1]
      const responsesId = parts[2]
      const messageId = interaction.message.id

      const sel = new StringSelectMenuBuilder()
        .setCustomId(`rp_class_sel|${targetId}|${responsesId}|${messageId}`)
        .setPlaceholder('Choisissez la classe de l\'élève')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Nova').setValue('NOV').setEmoji('🌟'),
          new StringSelectMenuOptionBuilder().setLabel('Nébuleuse').setValue('NÉB').setEmoji('🌌')
        )

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sel)
      await interaction.reply({ content: 'Avant de créer les accès, sélectionnez la classe de l\'élève :', components: [row], ephemeral: true })
      return
    }

    if (interaction.customId.startsWith('rp_refuse|')) {
      if (!await isAdmin(interaction.user.id, interaction)) {
        await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
        return
      }
      const targetId = interaction.customId.split('|')[1]
      try {
        const guild = interaction.guild
        if (guild) {
          const member = await guild.members.fetch(targetId).catch(() => null)
          if (member) {
            await member.send('❌ Votre demande d\'inscription RP a été refusée.').catch(() => null)
          }
        }
        await interaction.message.edit({ components: [], content: `❌ Refusé par <@${interaction.user.id}>` })
      } catch (e) { }

      await interaction.reply({ content: 'Candidature refusée.', ephemeral: true })
      return
    }

    if (interaction.customId.startsWith('rp_rec|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 4) return
      const targetId = parts[1]
      const pronoteId = parts[2]
      const pronotePass = parts.slice(3).join('|')

      if (interaction.user.id !== targetId) {
        await interaction.reply({ content: '❌ Ce bouton ne vous est pas destiné.', ephemeral: true })
        return
      }

      const embed = new EmbedBuilder()
        .setTitle('Vos Identifiants Pronote')
        .setColor(BLURPLE)
        .addFields(
          { name: 'Identifiant', value: `\`${pronoteId}\`` },
          { name: 'Mot de passe', value: `||${pronotePass}||` }
        )
        .setFooter({ text: 'Gardez ces informations confidentielles !' })

      await interaction.reply({ embeds: [embed], ephemeral: true })
      return
    }

    if (interaction.customId.startsWith('couple_accept|') || interaction.customId.startsWith('couple_refuse|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 3) return
      const targetId = parts[1] // The person who clicked the button (the one being asked)
      const senderId = parts[2]

      if (interaction.user.id !== targetId) {
        await interaction.reply({ content: '❌ Seule la personne concernée peut répondre !', ephemeral: true })
        return
      }

      if (interaction.customId.startsWith('couple_accept|')) {
        // Find existing profiles
        const { data: senderP } = await supabase.from('profiles').select('id, username').eq('discord_id', senderId).maybeSingle()
        const { data: targetP } = await supabase.from('profiles').select('id, username').eq('discord_id', targetId).maybeSingle()

        if (senderP && targetP) {
          try {
            await supabase.from('profiles').update({ partner_id: senderP.id, couple_since: new Date().toISOString() }).eq('id', targetP.id)
            await supabase.from('profiles').update({ partner_id: targetP.id, couple_since: new Date().toISOString() }).eq('id', senderP.id)
            await interaction.message.edit({ components: [], content: `💖 <@${targetId}> a accepté la demande de <@${senderId}> ! Vous êtes maintenant en couple !` })
            await interaction.reply({ content: 'Vous êtes maintenant en couple !', ephemeral: true })
          } catch (e) {
            await interaction.message.edit({ components: [], content: `💖 <@${targetId}> a accepté la demande de <@${senderId}> ! Vous êtes en couple ! (Note: Sauvegarde DB échouée)` })
            await interaction.reply({ content: 'Erreur lors de la sauvegarde.', ephemeral: true })
          }
        } else {
          await interaction.message.edit({ components: [], content: '❌ Erreur de base de données (Profils introuvables).' })
        }
      } else {
        await interaction.message.edit({ components: [], content: `💔 <@${targetId}> a refusé la demande de couple de <@${senderId}>...` })
        await interaction.reply({ content: 'Demande refusée.', ephemeral: true })
      }
      return
    }

    if (interaction.customId === 'profil_edit_infos') {
      const modal = new ModalBuilder()
        .setCustomId('modal_profil_edit_infos')
        .setTitle('Modifier vos informations RP')

      const tDob = new TextInputBuilder().setCustomId('dob').setLabel('Date de naissance (JJ/MM/AAAA)').setPlaceholder('Ex: 12/09/2005').setStyle(TextInputStyle.Short).setRequired(false)
      const tSexe = new TextInputBuilder().setCustomId('sexe').setLabel('Sexe').setPlaceholder('Masculin, Féminin, Autre...').setStyle(TextInputStyle.Short).setRequired(false)
      const tDesc = new TextInputBuilder().setCustomId('desc').setLabel('Description personnage').setPlaceholder('Petite bio...').setStyle(TextInputStyle.Paragraph).setRequired(false)

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(tDob),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tSexe),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tDesc)
      )
      await interaction.showModal(modal)
      return
    }

    if (interaction.customId === 'profil_edit_photo') {
      // Discord ne permet pas d'upload de fichier dans un SelectMenu ni directement sur un bouton simple
      // On va envoyer un message éphémère demandant à l'utilisateur d'utiliser la commande Slash pour la photo s'il n'y a pas d'option.
      // OU : On va lui donner un select menu pour choisir s'il veut l'ajouter à pronote.
      const sel = new StringSelectMenuBuilder()
        .setCustomId('profil_pronote_choice')
        .setPlaceholder('Voulez-vous répercuter la photo sur Pronote ?')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Oui, demander au Staff Pronote').setValue('yes').setEmoji('✅'),
          new StringSelectMenuOptionBuilder().setLabel('Non, uniquement sur mon profil').setValue('no').setEmoji('❌')
        )
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sel)
      await interaction.reply({ content: 'Pour changer votre photo, vous devrez d\'abord confirmer si elle s\'appliquera aussi à Pronote :', components: [row], ephemeral: true })
      return
    }

    if (interaction.customId === 'profil_settings') {
      const sel = new StringSelectMenuBuilder()
        .setCustomId('profil_visibility_choice')
        .setPlaceholder('Sélectionnez la visibilité de votre profil')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Public (Visible par tous)').setValue('public').setEmoji('🌍'),
          new StringSelectMenuOptionBuilder().setLabel('Privé (Réservé aux admins/vous)').setValue('private').setEmoji('🔒')
        )
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(sel)
      await interaction.reply({ content: 'Préférences Profil. Choisissez qui peut voir votre profil RP via `/profil` :', components: [row], ephemeral: true })
      return
    }

    if (interaction.customId === 'cantine_scan') {
      const targetProfile = await getProfile(interaction.user.id)
      if (!targetProfile) {
        await interaction.reply({ content: '❌ Erreur: Profil introuvable. Avez-vous un identifiant ENT ?', ephemeral: true })
        return
      }
      if (targetProfile.canteen_subscription === 'weekly' || targetProfile.canteen_subscription === 'monthly') {
        await interaction.reply({ content: '✅ **Accès Autorisé**. Votre abonnement cantine est valide. Bon appétit !', ephemeral: true })
      } else {
        await interaction.reply({ content: '❌ **Accès Refusé**. Vous n\'avez pas d\'abonnement cantine. Scannez de nouveau ou rechargez votre Carte LunaVerse sur l\'ENT.', ephemeral: true })
      }
      return
    }

    if (interaction.customId === 'cantine_admin_refresh') {
      if (!await isAdmin(interaction.user.id, interaction)) {
        await interaction.reply({ content: '❌ Seuls les administrateurs peuvent rafraîchir le menu.', ephemeral: true })
        return
      }
      await interaction.reply({ content: '🔄 Mise à jour du menu en cours...', ephemeral: true })
      await updateCanteenMenuMessage()
      return
    }

    if (interaction.customId === 'cantine_show_more') {
      const menus = await supabase.from('canteen_menus').select('*').gte('menu_date', new Date().toISOString().split('T')[0]).order('menu_date', { ascending: true })
      const upcoming = (menus.data || []).filter(m => {
        const sat = new Date(); sat.setDate(sat.getDate() + (6 - sat.getDay()))
        const sun = new Date(); sun.setDate(sun.getDate() + (7 - sun.getDay()))
        const d = m.menu_date
        return d > sun.toISOString().split('T')[0]
      })

      if (upcoming.length === 0) {
        await interaction.reply({ content: '📅 Aucun autre menu n\'est programmé pour le moment.', ephemeral: true })
        return
      }

      const embeds = upcoming.slice(0, 5).map(m => {
        const [y, mon, d] = m.menu_date.split('-').map(Number)
        const dateStr = new Date(y, mon - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        return new EmbedBuilder()
          .setTitle(`Menu du ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`)
          .setColor(0xF97316)
          .setDescription(`**Horaire :** ${m.time_start.slice(0, 5)} - ${m.time_end.slice(0, 5)}\n\n` + 
            (m.starter ? `🥗 **Entrée :** ${m.starter}\n` : '') +
            `🍖 **Plat :** ${m.main}\n` +
            (m.side ? `🍚 **Accompagnement :** ${m.side}\n` : '') +
            (m.dessert ? `🍰 **Dessert :** ${m.dessert}\n` : '') +
            (m.drink ? `🥤 **Boisson :** ${m.drink}\n` : '') +
            (m.note ? `\n*💡 ${m.note}*` : ''))
      })

      await interaction.reply({ embeds, ephemeral: true })
      return
    }

    // Pronote Staff workflow buttons
    if (interaction.customId.startsWith('pronote_upload_')) {
      // format: pronote_upload_accept|USER_ID  or _refuse|USER_ID or _done|USER_ID
      const parts = interaction.customId.split('|')
      if (parts.length < 2) return
      const action = parts[0].replace('pronote_upload_', '')
      const targetUserId = parts[1]

      if (!await isAdmin(interaction.user.id, interaction)) {
        await interaction.reply({ content: '❌ Vous n\'êtes pas autorisé à valider les photos.', ephemeral: true })
        return
      }

      if (action === 'accept') {
        await interaction.message.edit({
          content: `⏳ <@${targetUserId}> demande validée par <@${interaction.user.id}>. En attente de mise en place sur Pronote...`,
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId(`pronote_upload_done|${targetUserId}`).setLabel('Fait').setStyle(ButtonStyle.Success).setEmoji('✅')
            )
          ]
        })
        await interaction.reply({ content: 'Demande acceptée.', ephemeral: true })
      } else if (action === 'refuse') {
        await interaction.message.edit({ components: [], content: `❌ Photo de <@${targetUserId}> refusée par <@${interaction.user.id}>.` })
        const targetMember = await interaction.guild?.members.fetch(targetUserId).catch(() => null)
        if (targetMember) await targetMember.send('❌ Votre changement de photo Pronote a été refusé par le staff.').catch(() => null)
        await interaction.reply({ content: 'Demande refusée.', ephemeral: true })
      } else if (action === 'done') {
        await interaction.message.edit({ components: [], content: `✅ Photo de <@${targetUserId}> ajoutée sur Pronote par <@${interaction.user.id}>.` })
        const targetMember = await interaction.guild?.members.fetch(targetUserId).catch(() => null)
        if (targetMember) await targetMember.send('✅ Votre nouvelle photo de profil RP a été mise à jour sur Pronote avec succès !').catch(() => null)
        await interaction.reply({ content: 'L\'utilisateur a été notifié !', ephemeral: true })
      }
      return
    }

  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith('rp_class_sel|')) {
      const parts = interaction.customId.split('|')
      if (parts.length < 4) return
      const targetId = parts[1]
      const responsesId = parts[2]
      const messageId = parts[3]
      const classe = interaction.values[0]

      const modal = new ModalBuilder()
        .setCustomId(`rp_accept_modal|${targetId}|${responsesId}|${messageId}|${classe}`)
        .setTitle(`Fiche ENT (${classe})`)

      const tId = new TextInputBuilder().setCustomId('pronote_id').setLabel('Identifiant').setStyle(TextInputStyle.Short).setRequired(true)
      const tPass = new TextInputBuilder().setCustomId('pronote_pass').setLabel('Mot de passe').setStyle(TextInputStyle.Short).setRequired(true)

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(tId),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tPass)
      )

      await interaction.showModal(modal)
      return
    }

    if (interaction.customId === 'profil_pronote_choice') {
      const choice = interaction.values[0]
      if (choice === 'no') {
        const modal = new ModalBuilder()
          .setCustomId('modal_profil_photo_only')
          .setTitle('Nouvelle photo de profil')
        const tUrl = new TextInputBuilder().setCustomId('url').setLabel('URL de l\'image').setStyle(TextInputStyle.Short).setRequired(true)
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(tUrl))
        await interaction.showModal(modal)
      } else {
        const modal = new ModalBuilder()
          .setCustomId('modal_profil_photo_pronote')
          .setTitle('Photo pour Profil & Pronote')
        const tUrl = new TextInputBuilder().setCustomId('url').setLabel('URL de l\'image').setStyle(TextInputStyle.Short).setRequired(true)
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(tUrl))
        await interaction.showModal(modal)
      }
      return
    }

    if (interaction.customId === 'profil_visibility_choice') {
      const choice = interaction.values[0] // 'public' | 'private'
      const targetProfile = await getProfile(interaction.user.id)
      if (targetProfile) {
        await supabase.from('profiles').update({ status_visibility: choice }).eq('id', targetProfile.id)
        await interaction.reply({ content: `✅ Visibilité du profil mise à jour sur \`${choice}\`.`, ephemeral: true })
      } else {
        await interaction.reply({ content: '❌ Erreur de profil.', ephemeral: true })
      }
      return
    }
  }

  if (!interaction.isChatInputCommand()) return

  const { commandName, user } = interaction

  try {
    switch (commandName) {
      case 'set-channel-code': {
        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('🚫 Accès refusé').setDescription('Vous ne disposez pas des permissions admin.')] })
          return
        }

        const sInscription = interaction.options.getChannel('salon_inscription')
        const sAdmin = interaction.options.getChannel('salon_admin')
        const sReponses = interaction.options.getChannel('salon_reponses')

        if (!sInscription || !sAdmin || !sReponses) {
          await interaction.reply('Paramètres invalides.')
          return
        }

        const embed = new EmbedBuilder()
          .setTitle('🎓 Inscription RP - ENT LunaVerse')
          .setAuthor({
            name: interaction.guild?.name || 'Serveur',
            iconURL: interaction.guild?.iconURL() || undefined
          })
          .setDescription(`> ⬇️  **Cliquez sur le bouton** ci-dessous pour remplir votre** formulaire d'inscription RP** 🔥 pour __obtenir vos accès PRONOTE  <:pronote:1317623827630653573> .__\n\n> <:warningyellow:1375475607822930062>  Passez le **test d'entrée pour devenir élève** et être affecté(e) à une classe ! C'est obligatoire 😉\n*10 questions avec des questions assez simples ! La __possibilité de tricher RP__ (70% de réussir à tricher sans qu'on vous voit)*`)
          .setColor(0x000049)
          .setImage('https://i.ibb.co/cXRfH1ST/Luna-Verse-RP-1.png')

        const btn = new ButtonBuilder()
          .setCustomId(`rp_enroll|${sAdmin.id}|${sReponses.id}`)
          .setLabel('Je m\'inscris !')
          .setEmoji('1259611750966366239')
          .setStyle(ButtonStyle.Primary)

        const btn2 = new ButtonBuilder()
          .setLabel('Test d\'entrée')
          .setEmoji('1329902269428142130')
          .setStyle(ButtonStyle.Link)
          .setURL('https://test-eleve-inscription.netlify.app/quiz.html')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn, btn2)

        try {
          await (sInscription as any).send({ embeds: [embed], components: [row] })
          await interaction.reply({ content: `✅ Panel d'inscription envoyé dans <#${sInscription.id}>. Les réponses iront dans <#${sAdmin.id}> et les validations dans <#${sReponses.id}>.`, ephemeral: true })
        } catch (error) {
          console.error('Error sending enrollment panel:', error)
          await interaction.reply({ content: '❌ Erreur lors de l\'envoi du panel. Vérifiez les permissions du bot dans ce salon.', ephemeral: true })
        }
        break
      }

      case 'setcantine': {
        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
          return
        }
        const sCantine = interaction.options.getChannel('salon')
        const hDebut = interaction.options.getString('heure_debut')
        const hFin = interaction.options.getString('heure_fin')

        await setServerSetting('cantine_channel_id', sCantine?.id)
        await setServerSetting('cantine_start_time', hDebut)
        await setServerSetting('cantine_end_time', hFin)

        await interaction.reply({ content: `✅ Cantine configurée dans <#${sCantine?.id}> de ${hDebut} à ${hFin}.`, ephemeral: true })
        break
      }

      case 'deploycantine': {
        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
          return
        }
        const cId = await getServerSetting('cantine_channel_id')
        if (!cId) {
          await interaction.reply({ content: 'Erreur: Salon cantine non configuré. Utilisez /setcantine d\'abord.', ephemeral: true })
          return
        }
        const chan = await client.channels.fetch(cId).catch(() => null)
        if (!chan || !chan.isTextBased()) {
          await interaction.reply({ content: 'Erreur: Impossible de trouver le salon de la cantine.', ephemeral: true })
          return
        }

        const cEmbed = new EmbedBuilder()
          .setTitle('🍽️ Cantine LunaVerse')
          .setDescription('Cliquez sur le bouton ci-dessous pour présenter votre **Carte Cantine** à l\'entrée du self.')
          .setColor(0xF97316)

        const cBtn = new ButtonBuilder()
          .setCustomId('cantine_scan')
          .setLabel('Scanner ma carte')
          .setEmoji('💳')
          .setStyle(ButtonStyle.Primary)

        const cRow = new ActionRowBuilder<ButtonBuilder>().addComponents(cBtn)
        await (chan as any).send({ embeds: [cEmbed], components: [cRow] })
        await interaction.reply({ content: '✅ Embed de la cantine déployé.', ephemeral: true })
        break
      }

      case 'setprofil_setup': {
        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
          return
        }
        const sPRON = interaction.options.getChannel('salon_admin')
        await setServerSetting('pronote_admin_id', sPRON?.id)
        await interaction.reply({ content: `✅ Demandes Pronote envoyées désormais dans <#${sPRON?.id}>.`, ephemeral: true })
        break
      }


      case 'setmenu': {
        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
          return
        }
        const sMenu = interaction.options.getChannel('salon')
        await setServerSetting('discord_canteen_menu_channel_id', sMenu?.id)
        // Reset the message ID so it creates a new one in the new channel
        await setServerSetting('discord_canteen_menu_message_id', null)
        await interaction.reply({ content: `✅ Salon du menu de la cantine configuré sur <#${sMenu?.id}>.`, ephemeral: true })
        await updateCanteenMenuMessage()
        break
      }

      case 'profil': {
        const uTarget = interaction.options.getUser('utilisateur') || user;
        const targetProfile = await getProfile(uTarget.id)

        if (!targetProfile) {
          await interaction.reply({ content: '❌ Ce joueur n\'est pas inscrit dans la base.', ephemeral: true })
          return
        }

        // Compute Age
        let ageTexte = 'Inconnu'
        if (targetProfile.dob) {
          const parts = targetProfile.dob.split('/')
          if (parts.length === 3) {
            const dobDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
            if (!isNaN(dobDate.getTime())) {
              const diffMs = Date.now() - dobDate.getTime()
              const ageDate = new Date(diffMs)
              ageTexte = `${Math.abs(ageDate.getUTCFullYear() - 1970)} ans`
            }
          }
        }

        // Find user role matching
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role:roles(name)')
          .eq('user_id', targetProfile.id)

        const roleNames = (userRoles || []).map((ur: any) => ur.role?.name).join(', ') || 'Inconnu'

        const isSelf = uTarget.id === user.id
        const isPrivate = targetProfile.status_visibility === 'private'

        if (!isSelf && isPrivate && !await isAdmin(user.id, interaction)) {
          await interaction.reply({ content: '🔒 Ce profil est privé.', ephemeral: true })
          return
        }

        const embed = new EmbedBuilder()
          .setAuthor({ name: `Profil de ${targetProfile.username || uTarget.username}`, iconURL: uTarget.displayAvatarURL() })
          .setThumbnail(targetProfile.pronote_avatar_url || uTarget.displayAvatarURL())
          .setColor(0x5865F2)
          .addFields(
            { name: '👤 Prénom/Nom RP (Surnom)', value: targetProfile.nickname_rp || 'Inconnu', inline: true },
            { name: '🎂 Âge', value: ageTexte + (targetProfile.dob ? ` (${targetProfile.dob})` : ''), inline: true },
            { name: '🚻 Sexe', value: targetProfile.sexe || 'Non paramétré', inline: true },
            { name: '💼 Rôle / Classe', value: roleNames, inline: true },
            { name: '❤️ Relation', value: targetProfile.partner_id ? 'En couple' : 'Célibataire', inline: true },
            { name: '📝 Description', value: targetProfile.description || 'Aucune description.', inline: false }
          )

        const row = new ActionRowBuilder<ButtonBuilder>()
        if (isSelf) {
          row.addComponents(
            new ButtonBuilder().setCustomId('profil_edit_infos').setLabel('Modifier mes infos').setStyle(ButtonStyle.Primary).setEmoji('📝'),
            new ButtonBuilder().setCustomId('profil_edit_photo').setLabel('Changer de photo').setStyle(ButtonStyle.Secondary).setEmoji('📸'),
            new ButtonBuilder().setCustomId('profil_settings').setLabel('Préférences').setStyle(ButtonStyle.Secondary).setEmoji('⚙️')
          )
        }

        await interaction.reply({
          embeds: [embed],
          components: isSelf ? [row] : [],
          ephemeral: targetProfile.status_visibility === 'private' || isSelf // Default ephemeral for self or private
        })
        break
      }

      case 'solde': {
        const profile = await getProfile(user.id)
        if (!profile) {
          await interaction.reply('Vous nestez pas enregistré dans le système.')
          return
        }
        await interaction.reply(`Votre solde: **${Number(profile.balance).toFixed(2)}€**`)
        break
      }

      case 'envoie': {
        const targetUser = interaction.options.getUser('utilisateur')
        const amount = interaction.options.getNumber('montant')

        if (!targetUser || !amount || amount <= 0) {
          await interaction.reply('Paramètres invalides.')
          return
        }

        const senderProfile = await getProfile(user.id)
        const targetProfile = await getProfile(targetUser.id)

        if (!senderProfile || !targetProfile) {
          await interaction.reply('Un des utilisateurs nexiste pas dans le système.')
          return
        }

        if (Number(senderProfile.balance) < amount) {
          await interaction.reply('Solde insuffisant.')
          return
        }

        // Use a simple transaction logic (Supabase doesn't have multi-table transactions in the client-side library easily, would need a RPC)
        // For now, we'll do sequential updates
        const transferAmount = Math.round(Number(amount) * 100) / 100
        await supabase.from('profiles').update({ balance: Math.round((Number(senderProfile.balance) - transferAmount) * 100) / 100 }).eq('id', senderProfile.id)
        await supabase.from('profiles').update({ balance: Math.round((Number(targetProfile.balance) + transferAmount) * 100) / 100 }).eq('id', targetProfile.id)

        // Create transaction record
        await supabase.from('transactions').insert([
          {
            from_user_id: senderProfile.id,
            to_user_id: targetProfile.id,
            amount: transferAmount,
            type: 'transfer',
            description: `Transfert vers ${targetUser.username}`,
          }
        ])

        await interaction.reply(`Vous avez envoyé **${transferAmount}€** à ${targetUser.username}.`)
        break
      }

      case 'daily': {
        const profile = await getProfile(user.id)
        if (!profile) {
          await interaction.reply('Vous nestes pas enregistré.')
          return
        }

        if (profile.last_daily) {
          const lastClaim = new Date(profile.last_daily)
          const now = new Date()
          const hours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)

          if (hours < 24) {
            const remainingHours = Math.floor(24 - hours)
            const remainingMinutes = Math.floor((24 - hours - remainingHours) * 60)
            await interaction.reply(`Vous devez attendre encore **${remainingHours}h ${remainingMinutes}min**.`)
            return
          }
        }

        const dailyAmount = 50
        await supabase.from('profiles').update({
          balance: Number(profile.balance) + dailyAmount,
          last_daily: new Date().toISOString()
        }).eq('id', profile.id)

        await supabase.from('transactions').insert([
          {
            from_user_id: null,
            to_user_id: profile.id,
            amount: dailyAmount,
            type: 'daily',
            description: 'Récompense quotidienne',
          }
        ])

        await interaction.reply(`Vous avez reçu **${dailyAmount}€** de récompense quotidienne !`)
        break
      }



      case 'historique': {
        try {
          const profile = await getProfile(user.id)
          if (!profile) {
            await interaction.reply('Vous nestez pas enregistré.')
            return
          }

          const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
            .order('created_at', { ascending: false })
            .limit(5)

          if (!transactions || transactions.length === 0) {
            await interaction.reply('Aucune transaction récente.')
            return
          }

          const txList = transactions
            .map(tx => {
              const amount = tx.from_user_id === profile.id ? `-${tx.amount}€` : `+${tx.amount}€`
              const date = new Date(tx.created_at).toLocaleDateString('fr-FR')
              return `[${date}] ${tx.description}: **${amount}**`
            })
            .join('\n')

          await interaction.reply(`**Dernières transactions:**\n${txList}`)
        } catch (error) {
          console.error('History error:', error)
          await interaction.reply('Erreur lors de la récupération de lhistorique.')
        }
        break
      }

      case 'slots': {
        const bet = interaction.options.getNumber('mise')

        if (!bet || bet <= 0) {
          await interaction.reply('Mise invalide.')
          return
        }

        const profile = await getProfile(user.id)
        if (!profile || Number(profile.balance) < bet) {
          await interaction.reply('Solde insuffisant.')
          return
        }

        const symbols = ['🍒', '🍋', '🍇', '💎', '⭐', '🎰']
        const result = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ]

        const unique = Array.from(new Set(result))
        let multiplier = 0

        if (unique.length === 1) {
          multiplier = 10
        } else if (unique.length === 2) {
          multiplier = 2
        }

        const isWin = multiplier > 0
        const winAmount = Math.round(bet * multiplier * 100) / 100
        const newBalance = Math.round((Number(profile.balance) - bet + winAmount) * 100) / 100

        await supabase.from('profiles').update({ balance: newBalance }).eq('id', profile.id)
        await supabase.from('casino_history').insert([{ user_id: profile.id, game_id: null, bet_amount: bet, win_amount: winAmount, is_win: isWin }])
        await supabase.from('transactions').insert([{ from_user_id: isWin ? null : profile.id, to_user_id: isWin ? profile.id : null, amount: isWin ? winAmount - bet : bet, type: 'casino', description: `Slots (${result.join('|')}) — ${isWin ? `Gagné ${winAmount}€` : `Perdu ${bet}€`}` }])

        const embed = new EmbedBuilder()
          .setTitle('🎰 Machine à Sous')
          .setColor(isWin ? SUCCESS : ERROR)
          .setDescription(`## ${result.join(' ')}`)
          .addFields(
            { name: 'Mise', value: `${bet}€`, inline: true },
            { name: isWin ? '💰 Gain' : '💸 Perte', value: isWin ? `+${winAmount}€` : `-${bet}€`, inline: true },
            { name: '💳 Nouveau solde', value: `${newBalance.toFixed(2)}€`, inline: true }
          )
          .setFooter({ text: isWin ? '🎉 Félicitations !' : '😢 Meilleure chance la prochaine fois !' })

        await interaction.reply({ embeds: [embed] })
        break
      }

      case 'dice': {
        const bet = interaction.options.getNumber('mise')
        const choice = interaction.options.getString('choix')

        if (!bet || bet <= 0 || !choice) {
          await interaction.reply('Mise ou choix invalide.')
          return
        }

        const profile = await getProfile(user.id)
        if (!profile || Number(profile.balance) < bet) {
          await interaction.reply('Solde insuffisant.')
          return
        }

        const roll = Math.floor(Math.random() * 100) + 1
        const isHigh = roll > 50
        const isWin = (choice === 'haut' && isHigh) || (choice === 'bas' && !isHigh)

        const winAmount2 = isWin ? Math.round(bet * 2 * 100) / 100 : 0
        const newBalance2 = Math.round((Number(profile.balance) - bet + winAmount2) * 100) / 100

        await supabase.from('profiles').update({ balance: newBalance2 }).eq('id', profile.id)
        await supabase.from('transactions').insert([{ from_user_id: isWin ? null : profile.id, to_user_id: isWin ? profile.id : null, amount: isWin ? winAmount2 - bet : bet, type: 'casino', description: `Dés: ${roll} (${choice}) — ${isWin ? `Gagné ${winAmount2}€` : `Perdu ${bet}€`}` }])

        const embedDice = new EmbedBuilder()
          .setTitle('🎲 Dés')
          .setColor(isWin ? SUCCESS : ERROR)
          .setDescription(`Le dé est tombé sur **${roll}** — ${roll > 50 ? 'Haut' : 'Bas'}`)
          .addFields(
            { name: 'Votre choix', value: choice === 'haut' ? 'Haut (>50)' : 'Bas (≤50)', inline: true },
            { name: isWin ? '💰 Gain' : '💸 Perte', value: isWin ? `+${winAmount2}€` : `-${bet}€`, inline: true },
            { name: '💳 Nouveau solde', value: `${newBalance2.toFixed(2)}€`, inline: true }
          )

        await interaction.reply({ embeds: [embedDice] })
        break
      }

      case 'flip': {
        const bet = interaction.options.getNumber('mise')
        const choice = interaction.options.getString('choix')

        if (!bet || bet <= 0 || !choice) {
          await interaction.reply('Mise ou choix invalide.')
          return
        }

        const profile = await getProfile(user.id)
        if (!profile || Number(profile.balance) < bet) {
          await interaction.reply('Solde insuffisant.')
          return
        }

        const result = Math.random() < 0.5 ? 'pile' : 'face'
        const isWin = choice === result

        const winAmountFlip = isWin ? Math.round(bet * 2 * 100) / 100 : 0
        const newBalanceFlip = Math.round((Number(profile.balance) - bet + winAmountFlip) * 100) / 100

        await supabase.from('profiles').update({ balance: newBalanceFlip }).eq('id', profile.id)
        await supabase.from('transactions').insert([{ from_user_id: isWin ? null : profile.id, to_user_id: isWin ? profile.id : null, amount: isWin ? winAmountFlip - bet : bet, type: 'casino', description: `Flip: ${result} (${choice}) — ${isWin ? `Gagné ${winAmountFlip}€` : `Perdu ${bet}€`}` }])

        const embedFlip = new EmbedBuilder()
          .setTitle('🪙 Pile ou Face')
          .setColor(isWin ? SUCCESS : ERROR)
          .setDescription(result === 'pile' ? '🔵 **PILE**' : '🟡 **FACE**')
          .addFields(
            { name: 'Votre choix', value: choice === 'pile' ? 'Pile' : 'Face', inline: true },
            { name: isWin ? '💰 Gain' : '💸 Perte', value: isWin ? `+${winAmountFlip}€` : `-${bet}€`, inline: true },
            { name: '💳 Nouveau solde', value: `${newBalanceFlip.toFixed(2)}€`, inline: true }
          )

        await interaction.reply({ embeds: [embedFlip] })
        break
      }

      case 'boutique': {
        const { data: items } = await supabase
          .from('shop_items')
          .select('*')
          .eq('is_available', true)
          .order('price')

        if (!items || items.length === 0) {
          await interaction.reply('La boutique est vide.')
          return
        }

        const groupedByCategory = items.reduce((acc: any, item) => {
          if (!acc[item.category]) acc[item.category] = []
          acc[item.category].push(item)
          return acc
        }, {})

        const categoryEmojis: Record<string, string> = {
          food: '🍔', drink: '🥤', snack: '🍿', clothing: '👕', special: '⭐', luxury: '💎', other: '📦'
        }

        const embed = new EmbedBuilder()
          .setTitle('🛒 Boutique LunaVerse')
          .setColor(BLURPLE)
          .setFooter({ text: 'Utilisez /buy pour acheter • /inventaire pour vos achats' })

        for (const [cat, catItems] of Object.entries(groupedByCategory)) {
          const emoji = categoryEmojis[cat] || '📦'
          const list = (catItems as any[]).map(item => `**${item.name}** — ${Number(item.price).toFixed(2)}€`).join('\n')
          embed.addFields({ name: `${emoji} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`, value: list })
        }

        await interaction.reply({ embeds: [embed] })
        break
      }

      case 'buy': {
        const itemId = interaction.options.getString('article')
        const quantity = interaction.options.getNumber('quantite') || 1

        if (!itemId) {
          await interaction.reply('Article invalide.')
          return
        }

        try {
          const { data: item } = await supabase.from('shop_items').select('*').eq('id', itemId).single()
          const profile = await getProfile(user.id)

          if (!item || !profile) {
            await interaction.reply('Article ou utilisateur introuvable.')
            return
          }

          const totalPrice = Math.round(Number(item.price) * quantity * 100) / 100
          if (Number(profile.balance) < totalPrice) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('💸 Solde insuffisant').setDescription(`Prix total: **${totalPrice}€** · Votre solde: **${Number(profile.balance).toFixed(2)}€**`)] })
            return
          }

          const newBal = Math.round((Number(profile.balance) - totalPrice) * 100) / 100
          await supabase.from('profiles').update({ balance: newBal }).eq('id', profile.id)
          await supabase.from('purchases').insert([{ user_id: profile.id, item_id: item.id, quantity, total_price: totalPrice }])
          await supabase.from('transactions').insert([{ from_user_id: profile.id, to_user_id: null, amount: totalPrice, type: 'shop', description: `Achat: ${quantity}x ${item.name}` }])

          await interaction.reply({ embeds: [new EmbedBuilder().setColor(SUCCESS).setTitle('✅ Achat réussi !').setDescription(`**${quantity}x ${item.name}** pour **${totalPrice}€**\n💳 Nouveau solde: **${newBal.toFixed(2)}€**\n\n_Utilisez \`/utiliser ${item.name}\` pour l'utiliser !_`)] })
        } catch (error) {
          console.error('Buy error:', error)
          await interaction.reply('Une erreur est survenue lors de l\'achat.')
        }
        break
      }

      case 'inventaire': {
        const profile = await getProfile(user.id)
        if (!profile) { await interaction.reply('❌ Non enregistré.'); return }

        const { data: purchases } = await supabase
          .from('purchases')
          .select('quantity, total_price, created_at, item:shop_items(name, category)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(15)

        if (!purchases || purchases.length === 0) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(WARNING).setTitle('🎒 Inventaire vide').setDescription('Vous n\'avez encore rien acheté. Utilisez `/boutique` puis `/buy` !')] })
          return
        }

        const list = purchases.map((p: any) => {
          const item = Array.isArray(p.item) ? p.item[0] : p.item
          return `**${item?.name || '?'}** x${p.quantity} — _${new Date(p.created_at).toLocaleDateString('fr-FR')}_`
        }).join('\n')

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(BLURPLE).setTitle('🎒 Votre Inventaire').setDescription(list).setFooter({ text: 'Utilisez /utiliser <article> pour l\'utiliser' })] })
        break
      }

      case 'leaderboard': {
        const { data: topUsers } = await supabase
          .from('profiles')
          .select('username, balance, nickname_rp')
          .order('balance', { ascending: false })
          .limit(10)

        const embed = new EmbedBuilder()
          .setTitle('🏆 Classement LunaVerse (Top 10)')
          .setColor(BLURPLE)
          .setTimestamp()

        if (topUsers && topUsers.length > 0) {
          const list = topUsers.map((u, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
            return `${medal} **${u.nickname_rp || u.username}** — ${u.balance.toLocaleString()}€`
          }).join('\n')
          embed.setDescription(list)
        } else {
          embed.setDescription('Aucune donnée disponible.')
        }

        await interaction.reply({ embeds: [embed] })
        break
      }

      case 'market': {
        const { data: listings } = await supabase
          .from('market_listings')
          .select('*, profile:profiles(username, nickname_rp)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10)

        const embed = new EmbedBuilder()
          .setTitle('🛒 Luna Market • En vente')
          .setColor(0xFEE75C)
          .setTimestamp()
          .setFooter({ text: 'Accédez au Marché sur l\'ENT pour acheter' })

        if (listings && listings.length > 0) {
          const list = listings.map(l => {
            const seller = l.profile?.nickname_rp || l.profile?.username || 'Inconnu'
            return `📦 **${l.title}** — ${l.price}€\n👤 Vendeur: ${seller}\n`
          }).join('\n')
          embed.setDescription(list)

          const btn = new ButtonBuilder()
            .setLabel('Voir sur l\'ENT')
            .setURL(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://lunaverse-ent.vercel.app'}/market`)
            .setStyle(ButtonStyle.Link)
          
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn)
          await interaction.reply({ embeds: [embed], components: [row] })
        } else {
          embed.setDescription('Aucun objet en vente actuellement.')
          await interaction.reply({ embeds: [embed] })
        }
        break
      }

      case 'utiliser': {
        const articleName = interaction.options.getString('article')
        if (!articleName) { await interaction.reply('Article invalide.'); return }

        const profile = await getProfile(user.id)
        if (!profile) { await interaction.reply('❌ Non enregistré.'); return }

        // Fetch all purchases and find the item locally
        const { data: purchases } = await supabase
          .from('purchases')
          .select('id, quantity, item:item_id(id, name, category, description)')
          .eq('user_id', profile.id)

        if (!purchases || purchases.length === 0) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('❌ Inventaire vide').setDescription('Vous ne possédez aucun article.')] })
          return
        }

        const purchase = (purchases as any[]).find((p: any) => {
          const i = Array.isArray(p.item) ? p.item[0] : p.item
          return i && i.name.toLowerCase() === articleName.toLowerCase() && p.quantity > 0
        })

        if (!purchase) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('❌ Article introuvable').setDescription(`Vous ne possédez pas **${articleName}** ou vous l'avez épuisé. Vérifiez votre inventaire avec \`/inventaire\`.`)] })
          return
        }

        const item = Array.isArray(purchase.item) ? purchase.item[0] : purchase.item

        // Item Effect Mapping
        const itemEffects: Record<string, { faim?: number, soif?: number, fatigue?: number, sante?: number, alcool?: number }> = {
          'barre chocolatée': { faim: 15, fatigue: 10 },
          'bonbons haribo': { faim: 10, sante: -10, soif: -10 },
          'burger lunaverse': { faim: 40, sante: -10 },
          'chips lays': { faim: 20 },
          'cornet de frites': { faim: 20 },
          'croissant': { faim: 10 },
          'croque monsieur': { faim: 30 },
          'madeleine': { faim: 10 },
          'pizza margherita': { faim: 35 },
          'salade césar': { faim: 40 },
          'sandwich jambon-beurre': { faim: 30 },
          'wrap poulet': { faim: 40 },
          'bière': { soif: -20, alcool: -30 },
          'dom pérignon': { soif: -20, alcool: -30 },
          'coca-cola': { soif: 10, fatigue: 15 },
          'eau minérale': { soif: 50 },
          'jus d’orange': { soif: 40 },
          'red bull': { soif: 25 },
          'smoothie fruits': { soif: 40 },
          'doliprane': { sante: 30 },
          'café': { fatigue: 30 },
        };

        const effects = itemEffects[articleName.toLowerCase()];
        let effectLog = '';

        if (effects) {
          const newStats = {
            hunger: Math.min(100, Math.max(0, (profile.hunger ?? 100) + (effects.faim || 0))),
            thirst: Math.min(100, Math.max(0, (profile.thirst ?? 100) + (effects.soif || 0))),
            fatigue: Math.min(100, Math.max(0, (profile.fatigue ?? 100) + (effects.fatigue || 0))),
            health: Math.min(100, Math.max(0, (profile.health ?? 100) + (effects.sante || 0))),
            alcohol: Math.min(100, Math.max(0, (profile.alcohol ?? 0) + (effects.alcool || 0))),
          };

          await supabase.from('profiles').update(newStats).eq('id', profile.id);

          const changes = [];
          if (effects.faim) changes.push(`${effects.faim > 0 ? '+' : ''}${effects.faim} Faim`);
          if (effects.soif) changes.push(`${effects.soif > 0 ? '+' : ''}${effects.soif} Soif`);
          if (effects.fatigue) changes.push(`${effects.fatigue > 0 ? '+' : ''}${effects.fatigue} Énergie`);
          if (effects.sante) changes.push(`${effects.sante > 0 ? '+' : ''}${effects.sante} Santé`);
          if (effects.alcool) changes.push(`${effects.alcool > 0 ? '+' : ''}${effects.alcool} Sobriété`);
          
          if (changes.length > 0) {
            effectLog = `\n\n**Effets :** ${changes.join(' | ')}`;
          }
        }

        const rpMessages: Record<string, string> = {
          'food': `🍽️ *${interaction.user.displayName} déguste **${item.name}** avec appétit.*`,
          'drink': `🥤 *${interaction.user.displayName} boit **${item.name}** d'une traite.*`,
          'snack': `🍿 *${interaction.user.displayName} grignote **${item.name}** discrètement en cours.*`,
          'clothing': `👕 *${interaction.user.displayName} enfile **${item.name}** avec style.*`,
          'special': `✨ *${interaction.user.displayName} utilise **${item.name}**...*`,
          'luxury': `💎 *${interaction.user.displayName} exhibe fièrement **${item.name}**.*`,
          'cigarettes': `🚬 *${interaction.user.displayName} allume **${item.name}** et souffle une bouffée de fumée.*`,
        }

        const catLower = (item.category || '').toLowerCase()
        const rpMsg = rpMessages[catLower] || `*${interaction.user.displayName} utilise **${item.name}**.*`

        // Deduct item
        if (purchase.quantity > 1) {
          await supabase.from('purchases').update({ quantity: purchase.quantity - 1 }).eq('id', purchase.id)
        } else {
          await supabase.from('purchases').delete().eq('id', purchase.id)
        }

        await interaction.reply({ content: rpMsg + effectLog, allowedMentions: { parse: [] } })
        break
      }

      case 'give': {
        const targetUser = interaction.options.getUser('utilisateur')
        const amount = interaction.options.getNumber('montant')
        if (!targetUser || !amount) { await interaction.reply('Paramètres invalides.'); return }

        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('🚫 Accès refusé').setDescription('Vous ne disposez pas des permissions admin.')] })
          return
        }

        const targetProfile = await getProfile(targetUser.id)
        if (!targetProfile) { await interaction.reply('❌ Utilisateur introuvable dans la DB.'); return }

        const giveAmount = Math.round(Number(amount) * 100) / 100
        const newTargetBalance = Math.round((Number(targetProfile.balance) + giveAmount) * 100) / 100
        await supabase.from('profiles').update({ balance: newTargetBalance }).eq('id', targetProfile.id)
        await supabase.from('transactions').insert([{ from_user_id: null, to_user_id: targetProfile.id, amount: giveAmount, type: 'admin', description: `Don admin par ${user.username}` }])

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(SUCCESS).setTitle('💰 Don Admin').setDescription(`**${giveAmount}€** donnés à ${targetUser.username}.\nNouveau solde: **${newTargetBalance.toFixed(2)}€**`)] })
        break
      }

      case 'salaire': {
        const profile = await getProfile(user.id)
        if (!profile) { await interaction.reply('❌ Non enregistré.'); return }

        const lastSalary = profile.last_salary ? new Date(profile.last_salary) : null
        const now = new Date()
        const daysSince = lastSalary ? (now.getTime() - lastSalary.getTime()) / 86400000 : 8

        if (daysSince < 7) {
          const nextMonday = new Date(lastSalary!)
          nextMonday.setDate(nextMonday.getDate() + 7)
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(WARNING).setTitle('⏳ Salaire non disponible').setDescription(`Prochain salaire disponible le <t:${Math.floor(nextMonday.getTime() / 1000)}:D>.`)] })
          return
        }

        const { data: userRoles } = await supabase.from('user_roles').select('role:roles(salary_amount,pocket_money,name)').eq('user_id', profile.id)
        let total = 0
        const details: string[] = []
        for (const ur of (userRoles || [])) {
          const role = (ur as any).role
          if (!role) continue
          const sal = Number(role.salary_amount || 0)
          const pock = Number(role.pocket_money || 0)
          if (sal > 0) { total += sal; details.push(`💼 Salaire (${role.name}): +${sal}€`) }
          if (pock > 0) { total += pock; details.push(`🎒 Argent de poche (${role.name}): +${pock}€`) }
        }

        if (total === 0) { await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('❌ Aucun salaire').setDescription('Vous n\'avez pas de rôle avec salaire configuré.')] }); return }

        const profileBalance = Number(profile.balance)
        const newProfileBalance = Math.round((profileBalance + total) * 100) / 100
        await supabase.from('profiles').update({ balance: newProfileBalance, last_salary: now.toISOString() }).eq('id', profile.id)
        await supabase.from('transactions').insert([{ from_user_id: null, to_user_id: profile.id, amount: total, type: 'salary', description: 'Salaire hebdomadaire' }])

        await interaction.reply({ embeds: [new EmbedBuilder().setColor(SUCCESS).setTitle('💳 Salaire perçu !').setDescription(details.join('\n') + `\n\n**Total: ${total}€**\nNouveau solde: **${newProfileBalance.toFixed(2)}€**`)] })
        break
      }

      case 'addrole': {
        const targetUser = interaction.options.getUser('utilisateur')
        const roleName = interaction.options.getString('role')
        if (!targetUser || !roleName) { await interaction.reply('Paramètres invalides.'); return }

        if (!await isAdmin(user.id, interaction)) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(ERROR).setTitle('🚫 Accès refusé').setDescription('Vous ne disposez pas des permissions admin.')] })
          return
        }

        const targetProf = await getProfile(targetUser.id)
        if (!targetProf) {
          await interaction.reply('❌ Utilisateur introuvable dans la DB.\nL\'utilisateur doit d\'abord se connecter à l\'ENT.')
          return
        }

        const { data: role } = await supabase.from('roles').select('*').eq('name', roleName).maybeSingle()
        if (!role) {
          const { data: allRoles } = await supabase.from('roles').select('name')
          const list = (allRoles || []).map((r: any) => `\`${r.name}\``).join(', ') || 'Aucun (créez-en dans Supabase)'
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(WARNING).setTitle(`❌ Rôle "${roleName}" introuvable`).setDescription(`Rôles disponibles: ${list}`)] })
          return
        }

        await supabase.from('user_roles').upsert(
          { user_id: targetProf.id, role_id: role.id },
          { onConflict: 'user_id,role_id' }
        )

        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(role.color ? parseInt(role.color.replace('#', ''), 16) : SUCCESS)
            .setTitle('✅ Rôle assigné')
            .setDescription(`Rôle **${role.name}** assigné à ${targetUser.username}.${role.salary_amount > 0 ? `\n💼 Salaire: ${role.salary_amount}€/semaine` : ''}${role.pocket_money > 0 ? `\n🎒 Argent de poche: ${role.pocket_money}€/semaine` : ''}`)
            .setTimestamp()]
        })
        break
      }

      case 'couple': {
        const targetUser = interaction.options.getUser('utilisateur')
        if (!targetUser) return

        if (targetUser.id === user.id) {
          await interaction.reply({ content: 'Vous ne pouvez pas vous mettre en couple avec vous-même !', ephemeral: true })
          return
        }

        const btnAcc = new ButtonBuilder()
          .setCustomId(`couple_accept|${targetUser.id}|${user.id}`)
          .setLabel('Accepter')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💖')

        const btnRef = new ButtonBuilder()
          .setCustomId(`couple_refuse|${targetUser.id}|${user.id}`)
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('💔')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnAcc, btnRef)

        await interaction.reply({
          content: `<@${targetUser.id}>, <@${user.id}> souhaite se mettre en couple avec vous ! Acceptez-vous ?`,
          components: [row]
        })
        break
      }

      case 'kiss': {
        const targetUser = interaction.options.getUser('utilisateur')
        if (!targetUser) return

        // Use an external API for GIF or static ones
        const gifs = [
          'https://media.tenor.com/F02UpQTF8MAAAAAC/kiss.gif',
          'https://media.tenor.com/v4UrQdkgwDkAAAAC/kiss.gif',
          'https://media.tenor.com/w1FUlRj6O40AAAAC/anime-kiss.gif'
        ]
        const gif = gifs[Math.floor(Math.random() * gifs.length)]

        const embed = new EmbedBuilder()
          .setColor(0xffc0cb)
          .setDescription(`💖 <@${user.id}> fait un bisou à <@${targetUser.id}> !`)
          .setImage(gif)

        await interaction.reply({ embeds: [embed] })
        break
      }

      case 'hug': {
        const targetUser = interaction.options.getUser('utilisateur')
        if (!targetUser) return

        const gifs = [
          'https://media.tenor.com/kCZjTqCKiggAAAAC/hug.gif',
          'https://media.tenor.com/7AOsEUH6h-QAAAAC/hug-anime.gif',
          'https://media.tenor.com/1T1B8HcWalQAAAAC/anime-hug.gif'
        ]
        const gif = gifs[Math.floor(Math.random() * gifs.length)]

        const embed = new EmbedBuilder()
          .setColor(0xffc0cb)
          .setDescription(`🤗 <@${user.id}> fait un câlin à <@${targetUser.id}> !`)
          .setImage(gif)

        await interaction.reply({ embeds: [embed] })
        break
      }

      case 'set_channel_house': {
        if (!await isAdmin(user.id, interaction)) return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
        const salon = interaction.options.getChannel('salon')
        await setServerSetting('house_request_channel', salon?.id)
        await interaction.reply({ content: `✅ Salon des demandes configuré sur <#${salon?.id}>.`, ephemeral: true })
        break
      }

      case 'set_house_category': {
        if (!await isAdmin(user.id, interaction)) return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
        const cat = interaction.options.getChannel('categorie')
        await setServerSetting('house_category_id', cat?.id)
        await interaction.reply({ content: `✅ Catégorie des maisons configurée sur **${cat?.name}**.`, ephemeral: true })
        break
      }

      case 'maison_setup': {
        if (!await isAdmin(user.id, interaction)) return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true })
        const channelId = await getServerSetting('house_request_channel')
        const channel = await client.channels.fetch(channelId).catch(() => null)
        if (!channel || !channel.isTextBased()) return interaction.reply({ content: '❌ Salon non configuré ou invalide.', ephemeral: true })

        const embed = new EmbedBuilder()
          .setTitle('🏠 Demande de Propriété • LunaVerse')
          .setDescription('Souhaitez-vous obtenir une résidence privée sur LunaVerse ?\n\n**Avantages :**\n• Salon Discord privé & exclusif\n• Gestion des accès (Whitelist)\n• Aménagements RP (Lit, Frigo...)\n\nCliquez sur le bouton ci-dessous pour faire votre demande.')
          .setColor(BLURPLE)
          .setImage('https://i.ibb.co/3ykG2W9/house-banner.png')

        const btn = new ButtonBuilder()
          .setCustomId('house_request_start')
          .setLabel('Demander une Maison')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏠')

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn)
        await (channel as any).send({ embeds: [embed], components: [row] })
        await interaction.reply({ content: '✅ Embed déployé.', ephemeral: true })
        break
      }

      case 'dormir': {
        const profile = await getProfile(user.id)
        if (!profile) return interaction.reply({ content: '❌ Profil introuvable.', ephemeral: true })
        
        const { data: house } = await supabase.from('houses').select('*').eq('discord_channel_id', interaction.channelId).maybeSingle()
        if (!house) return interaction.reply({ content: '❌ Cette commande n\'est utilisable que dans votre salon de maison privé.', ephemeral: true })

        // Check if has bed furnishings
        if (!house.furnishings?.bed) return interaction.reply({ content: '❌ Vous n\'avez pas encore de **Lit** dans votre maison ! Achetez-le sur l\'ENT.', ephemeral: true })

        await supabase.from('profiles').update({ fatigue: 100 }).eq('id', profile.id)
        await interaction.reply({ content: `😴 <@${user.id}> s'installe confortablement dans son lit et récupère toute son énergie !` })
        break
      }

      case 'frigo': {
        const profile = await getProfile(user.id)
        if (!profile) return interaction.reply({ content: '❌ Profil introuvable.', ephemeral: true })
        
        const { data: house } = await supabase.from('houses').select('*').eq('discord_channel_id', interaction.channelId).maybeSingle()
        if (!house) return interaction.reply({ content: '❌ Cette commande n\'est utilisable que dans votre salon de maison privé.', ephemeral: true })

        // Check if has fridge furnishings
        if (!house.furnishings?.fridge) return interaction.reply({ content: '❌ Vous n\'avez pas encore de **Réfrigérateur** ! Achetez-le sur l\'ENT.', ephemeral: true })

        await supabase.from('profiles').update({ hunger: 100, thirst: 100 }).eq('id', profile.id)
        await interaction.reply({ content: `❄️ <@${user.id}> ouvre son frigo et prend un bon repas frais. Faim et Soif restaurées !` })
        break
      }
    }
  } catch (error) {
    console.error('Error handling command:', error)
    if (interaction.isRepliable()) await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true }).catch(() => null)
  }
})

// Login
client.login(process.env.DISCORD_BOT_TOKEN)
