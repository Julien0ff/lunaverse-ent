import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'sultanledebile@gmail.com'
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '7ncCQ25t0ak-VRS'

const pb = new PocketBase(PB_URL)

async function main() {
  // Authenticate as superuser (works with v0.36+)
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated as superuser')
  } catch (e: any) {
    console.error('Authentication failed:', e.message)
    process.exit(1)
  }

  // Get all collections
  const collections = await pb.collections.getList(1, 100)
  console.log(`Found ${collections.items.length} collections`)

  // Update each collection with fields
  const collectionsToUpdate: Record<string, any[]> = {
    profiles: [
      { name: 'discord_id', type: 'text', required: true, options: {} },
      { name: 'username', type: 'text', required: true, options: {} },
      { name: 'avatar_url', type: 'url', required: false, options: {} },
      { name: 'balance', type: 'number', required: false, options: {} },
      { name: 'last_daily', type: 'date', required: false, options: {} },
      { name: 'last_salary', type: 'date', required: false, options: {} },
    ],
    roles: [
      { name: 'name', type: 'text', required: true, options: {} },
      { name: 'discord_role_id', type: 'text', required: false, options: {} },
      { name: 'salary_amount', type: 'number', required: false, options: {} },
      { name: 'pocket_money', type: 'number', required: false, options: {} },
      { name: 'color', type: 'text', required: false, options: {} },
    ],
    shop_items: [
      { name: 'name', type: 'text', required: true, options: {} },
      { name: 'description', type: 'text', required: false, options: {} },
      { name: 'price', type: 'number', required: true, options: {} },
      { name: 'category', type: 'select', required: false, options: { values: ['drinks', 'snacks', 'cigarettes', 'other'] } },
      { name: 'image_url', type: 'url', required: false, options: {} },
      { name: 'is_available', type: 'bool', required: false, options: {} },
    ],
    casino_games: [
      { name: 'name', type: 'text', required: true, options: {} },
      { name: 'description', type: 'text', required: false, options: {} },
      { name: 'min_bet', type: 'number', required: false, options: {} },
      { name: 'max_bet', type: 'number', required: false, options: {} },
      { name: 'multiplier_min', type: 'number', required: false, options: {} },
      { name: 'multiplier_max', type: 'number', required: false, options: {} },
    ],
    posts: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'content', type: 'text', required: true, options: {} },
      { name: 'image_url', type: 'url', required: false, options: {} },
      { name: 'channel_id', type: 'text', required: false, options: {} },
      { name: 'message_id', type: 'text', required: false, options: {} },
    ],
    comments: [
      { name: 'post', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'content', type: 'text', required: true, options: {} },
    ],
    likes: [
      { name: 'post', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
    ],
    transactions: [
      { name: 'from_user', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'to_user', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'amount', type: 'number', required: true, options: {} },
      { name: 'type', type: 'select', required: true, options: { values: ['transfer', 'daily', 'salary', 'shop', 'casino', 'pocket_money'] } },
      { name: 'description', type: 'text', required: false, options: {} },
    ],
    purchases: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'item', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'quantity', type: 'number', required: false, options: {} },
      { name: 'total_price', type: 'number', required: true, options: {} },
    ],
    casino_history: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
      { name: 'game', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'bet_amount', type: 'number', required: true, options: {} },
      { name: 'win_amount', type: 'number', required: false, options: {} },
      { name: 'is_win', type: 'bool', required: false, options: {} },
    ],
    user_roles: [
      { name: 'user', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'role', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
      { name: 'assigned_at', type: 'date', required: false, options: {} },
    ],
  }

  // Get IDs for relation fields
  const idMap: Record<string, string> = {}
  for (const col of collections.items) {
    idMap[col.name] = col.id
  }

  // Update each collection
  for (const [name, fields] of Object.entries(collectionsToUpdate)) {
    const collection = collections.items.find((c: any) => c.name === name)
    if (!collection) {
      console.log(`⚠ Collection ${name} not found`)
      continue
    }

    console.log(`\n📦 Updating collection: ${name}`)

    // Update fields with proper collection IDs
    const updatedFields = fields.map((field: any) => {
      if (field.name === 'user' && (name === 'posts' || name === 'comments' || name === 'likes' || name === 'purchases' || name === 'casino_history')) {
        return { ...field, options: { ...field.options, collectionId: idMap.profiles } }
      }
      if (field.name === 'post' && (name === 'comments' || name === 'likes')) {
        return { ...field, options: { ...field.options, collectionId: idMap.posts } }
      }
      if (field.name === 'role' && name === 'user_roles') {
        return { ...field, options: { ...field.options, collectionId: idMap.roles } }
      }
      if (field.name === 'item' && name === 'purchases') {
        return { ...field, options: { ...field.options, collectionId: idMap.shop_items } }
      }
      if (field.name === 'game' && name === 'casino_history') {
        return { ...field, options: { ...field.options, collectionId: idMap.casino_games } }
      }
      if ((field.name === 'from_user' || field.name === 'to_user') && name === 'transactions') {
        return { ...field, options: { ...field.options, collectionId: idMap.profiles } }
      }
      return field
    })

    try {
      await pb.collections.update(collection.id, {
        schema: updatedFields
      })
      console.log(`✓ Updated ${name} with ${updatedFields.length} fields`)
    } catch (e: any) {
      console.log(`⚠ Error updating ${name}:`, e.response?.data || e.message)
    }
  }

  // Add default data
  console.log('\n📦 Adding default data...')
  
  // Add default roles
  try {
    const rolesCount = await pb.collection('roles').getList(1, 1)
    if (rolesCount.totalItems === 0) {
      await pb.collection('roles').create({ name: 'admin', discord_role_id: '', salary_amount: 0, pocket_money: 0, color: '#ED4245' })
      await pb.collection('roles').create({ name: 'prof', discord_role_id: '', salary_amount: 500, pocket_money: 0, color: '#57F287' })
      await pb.collection('roles').create({ name: 'eleve', discord_role_id: '', salary_amount: 0, pocket_money: 25, color: '#5865F2' })
      await pb.collection('roles').create({ name: 'cpe', discord_role_id: '', salary_amount: 600, pocket_money: 0, color: '#FEE75C' })
      console.log('✓ Added default roles')
    } else {
      console.log('⚠ Roles already exist')
    }
  } catch (e: any) {
    console.log('⚠ Could not add roles:', e.message)
  }

  // Add default shop items
  try {
    const shopCount = await pb.collection('shop_items').getList(1, 1)
    if (shopCount.totalItems === 0) {
      const items = [
        { name: 'Coca-Cola', description: 'Boisson gazeuse', price: 3, category: 'drinks', is_available: true },
        { name: 'Sprite', description: 'Boisson gazeuse citron', price: 3, category: 'drinks', is_available: true },
        { name: 'Fanta', description: 'Boisson gazeuse orange', price: 3, category: 'drinks', is_available: true },
        { name: 'Eau', description: 'Bouteille d\'eau 50cl', price: 2, category: 'drinks', is_available: true },
        { name: 'Café', description: 'Boisson chaude', price: 2.5, category: 'drinks', is_available: true },
        { name: 'Chips', description: 'Sachet de chips', price: 4, category: 'snacks', is_available: true },
        { name: 'Barre chocolatée', description: 'Chocolate bar', price: 3.5, category: 'snacks', is_available: true },
        { name: 'Bonbons', description: 'Sachet de bonbons', price: 2, category: 'snacks', is_available: true },
        { name: 'Gâteau', description: 'Gâteau industriel', price: 3, category: 'snacks', is_available: true },
        { name: 'Cigarettes', description: 'Paquet de cigarettes', price: 12, category: 'cigarettes', is_available: true },
        { name: 'Téléphone', description: 'Smartphone', price: 500, category: 'other', is_available: true },
      ]
      for (const item of items) {
        await pb.collection('shop_items').create(item)
      }
      console.log('✓ Added default shop items')
    } else {
      console.log('⚠ Shop items already exist')
    }
  } catch (e: any) {
    console.log('⚠ Could not add shop items:', e.message)
  }

  // Add default casino games
  try {
    const gamesCount = await pb.collection('casino_games').getList(1, 1)
    if (gamesCount.totalItems === 0) {
      await pb.collection('casino_games').create({ name: 'Machines à sous', description: 'Tentez votre chance aux machines à sous', min_bet: 1, max_bet: 500, multiplier_min: 0.5, multiplier_max: 50 })
      await pb.collection('casino_games').create({ name: 'Dés', description: 'Devinez si le résultat sera haut ou bas', min_bet: 1, max_bet: 200, multiplier_min: 1.8, multiplier_max: 1.8 })
      await pb.collection('casino_games').create({ name: 'Pile ou Face', description: 'Simple comme pile ou face', min_bet: 1, max_bet: 100, multiplier_min: 1.9, multiplier_max: 1.9 })
      console.log('✓ Added default casino games')
    } else {
      console.log('⚠ Casino games already exist')
    }
  } catch (e: any) {
    console.log('⚠ Could not add casino games:', e.message)
  }

  console.log('\n✅ Fields and data setup complete!')
}

main().catch(console.error)
