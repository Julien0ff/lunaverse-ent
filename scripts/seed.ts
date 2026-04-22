// Load .env.local first
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Casino Games ──────────────────────────────────────────────────────────────
const casinoGames = [
    {
        name: 'Machine à Sous',
        description: 'Alignez 3 symboles identiques pour gagner gros ! Trois identiques = x10, deux identiques = x2.',
        min_bet: 10,
        max_bet: 500,
        multiplier_min: 0,
        multiplier_max: 10,
    },
    {
        name: 'Pile ou Face',
        description: 'Simple et classique. Choisissez pile ou face et doublez votre mise !',
        min_bet: 5,
        max_bet: 1000,
        multiplier_min: 0,
        multiplier_max: 2,
    },
    {
        name: 'Dés (Haut/Bas)',
        description: 'Un dé de 1 à 100. Pariez sur Haut (>50) ou Bas (≤50) et doublez votre mise.',
        min_bet: 5,
        max_bet: 1000,
        multiplier_min: 0,
        multiplier_max: 2,
    },
    {
        name: 'Roulette',
        description: 'Pariez sur Rouge ou Noir. La bille tombe sur un chiffre de 1 à 36 + le 0 (avantage maison). Paiement x1.9.',
        min_bet: 10,
        max_bet: 2000,
        multiplier_min: 0,
        multiplier_max: 1.9,
    },
    {
        name: 'Blackjack',
        description: 'Battez le croupier sans dépasser 21. Blackjack naturel paie x2.5 !',
        min_bet: 20,
        max_bet: 5000,
        multiplier_min: 0,
        multiplier_max: 2.5,
    },
]

// ─── Shop Items ────────────────────────────────────────────────────────────────
const shopItems = [
    // ── Boissons ──
    { name: 'Coca-Cola', description: 'Canette de Coca-Cola fraîche. Le classique indémodable.', price: 2, category: 'drink', is_available: true },
    { name: 'Eau minérale', description: 'Bouteille d\'eau minérale 50cl. Reste hydraté !', price: 1, category: 'drink', is_available: true },
    { name: 'Jus d\'orange', description: 'Jus d\'orange pressé 33cl. Plein de vitamines.', price: 2.5, category: 'drink', is_available: true },
    { name: 'Café', description: 'Café noir bien serré. Pour tenir jusqu\'à la fin des cours.', price: 1.5, category: 'drink', is_available: true },
    { name: 'Red Bull', description: 'Energy drink pour les nuits de révision. 250ml.', price: 3.5, category: 'drink', is_available: true },
    { name: 'Smoothie Fruits', description: 'Smoothie maison aux fruits de saison. 25cl.', price: 4, category: 'drink', is_available: true },
    { name: 'Bière (Pression)', description: 'Bref... une mousse bien méritée après les cours. 25cl.', price: 4, category: 'drink', is_available: true },

    // ── Nourriture ──
    { name: 'Sandwich Jambon-Beurre', description: 'Le classique de la boulangerie. Baguette tradition.', price: 4.5, category: 'food', is_available: true },
    { name: 'Pizza Margherita', description: 'Part de pizza maison. Tomate, mozzarella, basilic.', price: 6, category: 'food', is_available: true },
    { name: 'Burger LunaVerse', description: 'Notre burger signature : steak, cheddar, salade, sauce secrète.', price: 9, category: 'food', is_available: true },
    { name: 'Wrap Poulet', description: 'Wrap au poulet grillé, légumes frais et sauce yaourt.', price: 7, category: 'food', is_available: true },
    { name: 'Croque-Monsieur', description: 'Croque-Monsieur chaud. Incontournable du midi.', price: 5, category: 'food', is_available: true },
    { name: 'Salade César', description: 'Poulet, parmesan, croûtons, sauce César maison.', price: 8, category: 'food', is_available: true },
    { name: 'Cornet de Frites', description: 'Frites dorées et croustillantes, sauce au choix.', price: 3.5, category: 'food', is_available: true },

    // ── Snacks ──
    { name: 'Chips Lays', description: 'Paquet de chips nature 30g. Pour grignoter en cours.', price: 1.5, category: 'snack', is_available: true },
    { name: 'Barre chocolatée', description: 'Kit Kat / Twix / Snickers (au hasard). Surprise !', price: 1.5, category: 'snack', is_available: true },
    { name: 'Bonbons Haribo', description: 'Mini sachet de bonbons. Les Goldbears bien sûr.', price: 1, category: 'snack', is_available: true },
    { name: 'Madeleine', description: 'Madeleine moelleuse de la cantine. Fade mais réconfortante.', price: 0.5, category: 'snack', is_available: true },
    { name: 'Croissant', description: 'Croissant au beurre. Idéal pour le petit-déj RP.', price: 2, category: 'snack', is_available: true },

    // ── Cigarettes / Lifestyle ──
    { name: 'Paquet de clopes', description: 'Un paquet de cigarettes. Pour les élèves qui font des pauses.', price: 12, category: 'clothing', is_available: true },
    { name: 'Briquet', description: 'Briquet BIC. Essentiel si t\'as les clopes.', price: 2, category: 'clothing', is_available: true },

    // ── Vêtements / Accessoires ──
    { name: 'Hoodie LunaVerse', description: 'Hoodie à capuche aux couleurs de LunaVerse. Taille unique.', price: 35, category: 'clothing', is_available: true },
    { name: 'Casquette RP', description: 'Casquette brodée LunaVerse. Flex assuré.', price: 20, category: 'clothing', is_available: true },
    { name: 'Sac à dos', description: 'Sac à dos basique pour transporter tes affaires de cours.', price: 25, category: 'clothing', is_available: true },

    // ── Spéciaux ──
    { name: 'Billet de Lottery', description: 'Tente ta chance ! 1 chance sur 10 de gagner 500€. Ou rien.', price: 10, category: 'special', is_available: true },
    { name: 'VIP Pass 24h', description: 'Accès VIP pendant 24h. Badge doré sur votre profil.', price: 100, category: 'special', is_available: true },
    { name: 'Passe-droit RP', description: 'Un "passe-droit" RP. Le principal regarde ailleurs... 1 fois.', price: 200, category: 'special', is_available: false },

    // ── Luxe ──
    { name: 'Bouteille de Dom Pérignon', description: 'Champagne haut de gamme. Pour fêter les grandes occasions.', price: 150, category: 'luxury', is_available: true },
    { name: 'Montre de luxe', description: 'Montre en or. "C\'est une Rolex RP, elle vaut rien IRL."', price: 500, category: 'luxury', is_available: true },
    { name: 'Voiture de sport RP', description: 'Une Ferrari RP. Elle reste dans le parking mais t\'as la vibe.', price: 5000, category: 'luxury', is_available: true },
]

// ─── Default Roles ─────────────────────────────────────────────────────────────
const defaultRoles = [
    { name: 'admin', discord_role_id: 'SUPER_ADMIN_ROLE', can_connect: true, color: '#FF0000', salary_amount: 0, pocket_money: 0 },
    { name: 'staff', discord_role_id: 'STAFF_ROLE', can_connect: true, color: '#00FF00', salary_amount: 0, pocket_money: 0 },
]

async function seed() {
    console.log('🌱 Seeding LunaVerse database...\n')

    // ── Casino Games ──────────────────────────────────────────────────
    console.log('🎰 Inserting casino games...')
    const { data: existingGames } = await supabase.from('casino_games').select('name')
    const existingGameNames = (existingGames || []).map((g: any) => g.name)

    let gamesInserted = 0
    for (const game of casinoGames) {
        if (existingGameNames.includes(game.name)) {
            console.log(`  ⏭️  Skipped (already exists): ${game.name}`)
            continue
        }
        const { error } = await supabase.from('casino_games').insert([game])
        if (error) {
            console.error(`  ❌ Error inserting ${game.name}:`, error.message)
        } else {
            console.log(`  ✅ ${game.name} (${game.min_bet}€ → ${game.max_bet}€)`)
            gamesInserted++
        }
    }
    console.log(`\n🎰 ${gamesInserted} new game(s) inserted.\n`)

    // ── Shop Items ────────────────────────────────────────────────────
    console.log('🛒 Inserting shop items...')
    const { data: existingItems } = await supabase.from('shop_items').select('name')
    const existingItemNames = (existingItems || []).map((i: any) => i.name)

    let itemsInserted = 0
    for (const item of shopItems) {
        if (existingItemNames.includes(item.name)) {
            console.log(`  ⏭️  Skipped: ${item.name}`)
            continue
        }
        const { error } = await supabase.from('shop_items').insert([item])
        if (error) {
            console.error(`  ❌ Error inserting ${item.name}:`, error.message)
        } else {
            console.log(`  ✅ [${item.category}] ${item.name} — ${item.price}€`)
            itemsInserted++
        }
    }
    console.log(`\n🛒 ${itemsInserted} new item(s) inserted.`)
    
    // ── Roles ──────────────────────────────────────────────────────────
    console.log('\n🎭 Inserting default roles...')
    const { data: existingRoles } = await supabase.from('roles').select('name')
    const existingRoleNames = (existingRoles || []).map((r: any) => r.name)

    let rolesInserted = 0
    for (const role of defaultRoles) {
        if (existingRoleNames.includes(role.name)) {
            console.log(`  ⏭️  Skipped: ${role.name}`)
            continue
        }
        const { error } = await supabase.from('roles').insert([role])
        if (error) {
            console.error(`  ❌ Error inserting role ${role.name}:`, error.message)
        } else {
            console.log(`  ✅ ${role.name} — ${role.can_connect ? 'Authorized to connect' : 'Restricted'}`)
            rolesInserted++
        }
    }
    console.log(`\n🎭 ${rolesInserted} new role(s) inserted.`)

    console.log('\n🎉 Seed done!')
    process.exit(0)
}

seed().catch(err => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
})
