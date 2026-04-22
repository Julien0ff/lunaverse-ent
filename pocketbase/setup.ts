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

  // Collection IDs will be stored here
  const ids: Record<string, string> = {}

  // 1. Create or get profiles collection
  try {
    const profiles = await pb.collections.create({
      name: 'profiles',
      type: 'base',
      schema: [
        { name: 'discord_id', type: 'text', required: true, unique: true },
        { name: 'username', type: 'text', required: true },
        { name: 'avatar_url', type: 'url' },
        { name: 'balance', type: 'number', default: 100 },
        { name: 'last_daily', type: 'date' },
        { name: 'last_salary', type: 'date' },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id = id',
      deleteRule: '@request.auth.id = id',
    })
    ids.profiles = profiles.id
    console.log('✓ Created profiles collection')
  } catch (e: any) {
    if (e.response?.data?.name?.code === 'multiple') {
      console.log('⚠ profiles collection already exists')
      const existing = await pb.collections.getList(1, 1, { filter: 'name="profiles"' })
      ids.profiles = existing.items[0].id
    } else {
      console.log('⚠ profiles collection error:', e.response?.data || e.message)
      try {
        const existing = await pb.collections.getList(1, 1, { filter: 'name="profiles"' })
        ids.profiles = existing.items[0].id
        console.log('✓ Found existing profiles collection')
      } catch (e2) {
        console.error('Could not find profiles collection:', e2)
      }
    }
  }

  // 2. Create or get roles collection
  try {
    const roles = await pb.collections.create({
      name: 'roles',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'discord_role_id', type: 'text' },
        { name: 'salary_amount', type: 'number', default: 0 },
        { name: 'pocket_money', type: 'number', default: 0 },
        { name: 'color', type: 'text', default: '#5865F2' },
      ],
    })
    ids.roles = roles.id
    console.log('✓ Created roles collection')
  } catch (e: any) {
    console.log('⚠ roles collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="roles"' })
      ids.roles = existing.items[0].id
      console.log('✓ Found existing roles collection')
    } catch (e2) {
      console.error('Could not find roles collection:', e2)
    }
  }

  // 3. Create or get shop_items collection
  try {
    const shopItems = await pb.collections.create({
      name: 'shop_items',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number', required: true },
        { name: 'category', type: 'select', values: ['drinks', 'snacks', 'cigarettes', 'other'] },
        { name: 'image_url', type: 'url' },
        { name: 'is_available', type: 'bool', default: true },
      ],
    })
    ids.shop_items = shopItems.id
    console.log('✓ Created shop_items collection')
  } catch (e: any) {
    console.log('⚠ shop_items collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="shop_items"' })
      ids.shop_items = existing.items[0].id
      console.log('✓ Found existing shop_items collection')
    } catch (e2) {
      console.error('Could not find shop_items collection:', e2)
    }
  }

  // 4. Create or get casino_games collection
  try {
    const casinoGames = await pb.collections.create({
      name: 'casino_games',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'min_bet', type: 'number', default: 1 },
        { name: 'max_bet', type: 'number', default: 1000 },
        { name: 'multiplier_min', type: 'number', default: 1 },
        { name: 'multiplier_max', type: 'number', default: 10 },
      ],
    })
    ids.casino_games = casinoGames.id
    console.log('✓ Created casino_games collection')
  } catch (e: any) {
    console.log('⚠ casino_games collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="casino_games"' })
      ids.casino_games = existing.items[0].id
      console.log('✓ Found existing casino_games collection')
    } catch (e2) {
      console.error('Could not find casino_games collection:', e2)
    }
  }

  // 5. Create or get user_roles collection
  try {
    const userRoles = await pb.collections.create({
      name: 'user_roles',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: false, maxSelect: 1 },
        { name: 'role', type: 'relation', required: true, collectionId: ids.roles, cascadeDelete: false, maxSelect: 1 },
        { name: 'assigned_at', type: 'date' },
      ],
    })
    ids.user_roles = userRoles.id
    console.log('✓ Created user_roles collection')
  } catch (e: any) {
    console.log('⚠ user_roles collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="user_roles"' })
      ids.user_roles = existing.items[0].id
      console.log('✓ Found existing user_roles collection')
    } catch (e2) {
      console.error('Could not find user_roles collection:', e2)
    }
  }

  // 6. Create or get transactions collection
  try {
    const transactions = await pb.collections.create({
      name: 'transactions',
      type: 'base',
      schema: [
        { name: 'from_user', type: 'relation', collectionId: ids.profiles, cascadeDelete: false, maxSelect: 1 },
        { name: 'to_user', type: 'relation', collectionId: ids.profiles, cascadeDelete: false, maxSelect: 1 },
        { name: 'amount', type: 'number', required: true },
        { name: 'type', type: 'select', required: true, values: ['transfer', 'daily', 'salary', 'shop', 'casino', 'pocket_money'] },
        { name: 'description', type: 'text' },
      ],
    })
    ids.transactions = transactions.id
    console.log('✓ Created transactions collection')
  } catch (e: any) {
    console.log('⚠ transactions collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="transactions"' })
      ids.transactions = existing.items[0].id
      console.log('✓ Found existing transactions collection')
    } catch (e2) {
      console.error('Could not find transactions collection:', e2)
    }
  }

  // 7. Create or get posts collection
  try {
    const posts = await pb.collections.create({
      name: 'posts',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: true, maxSelect: 1 },
        { name: 'content', type: 'text', required: true },
        { name: 'image_url', type: 'url' },
        { name: 'channel_id', type: 'text' },
        { name: 'message_id', type: 'text' },
      ],
    })
    ids.posts = posts.id
    console.log('✓ Created posts collection')
  } catch (e: any) {
    console.log('⚠ posts collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="posts"' })
      ids.posts = existing.items[0].id
      console.log('✓ Found existing posts collection')
    } catch (e2) {
      console.error('Could not find posts collection:', e2)
    }
  }

  // 8. Create or get comments collection
  try {
    const comments = await pb.collections.create({
      name: 'comments',
      type: 'base',
      schema: [
        { name: 'post', type: 'relation', required: true, collectionId: ids.posts, cascadeDelete: true, maxSelect: 1 },
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: true, maxSelect: 1 },
        { name: 'content', type: 'text', required: true },
      ],
    })
    ids.comments = comments.id
    console.log('✓ Created comments collection')
  } catch (e: any) {
    console.log('⚠ comments collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="comments"' })
      ids.comments = existing.items[0].id
      console.log('✓ Found existing comments collection')
    } catch (e2) {
      console.error('Could not find comments collection:', e2)
    }
  }

  // 9. Create or get likes collection
  try {
    const likes = await pb.collections.create({
      name: 'likes',
      type: 'base',
      schema: [
        { name: 'post', type: 'relation', required: true, collectionId: ids.posts, cascadeDelete: true, maxSelect: 1 },
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: true, maxSelect: 1 },
      ],
    })
    ids.likes = likes.id
    console.log('✓ Created likes collection')
  } catch (e: any) {
    console.log('⚠ likes collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="likes"' })
      ids.likes = existing.items[0].id
      console.log('✓ Found existing likes collection')
    } catch (e2) {
      console.error('Could not find likes collection:', e2)
    }
  }

  // 10. Create or get purchases collection
  try {
    const purchases = await pb.collections.create({
      name: 'purchases',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: true, maxSelect: 1 },
        { name: 'item', type: 'relation', required: true, collectionId: ids.shop_items, cascadeDelete: false, maxSelect: 1 },
        { name: 'quantity', type: 'number', default: 1 },
        { name: 'total_price', type: 'number', required: true },
      ],
    })
    ids.purchases = purchases.id
    console.log('✓ Created purchases collection')
  } catch (e: any) {
    console.log('⚠ purchases collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="purchases"' })
      ids.purchases = existing.items[0].id
      console.log('✓ Found existing purchases collection')
    } catch (e2) {
      console.error('Could not find purchases collection:', e2)
    }
  }

  // 11. Create or get casino_history collection
  try {
    const casinoHistory = await pb.collections.create({
      name: 'casino_history',
      type: 'base',
      schema: [
        { name: 'user', type: 'relation', required: true, collectionId: ids.profiles, cascadeDelete: true, maxSelect: 1 },
        { name: 'game', type: 'relation', required: true, collectionId: ids.casino_games, cascadeDelete: false, maxSelect: 1 },
        { name: 'bet_amount', type: 'number', required: true },
        { name: 'win_amount', type: 'number', default: 0 },
        { name: 'is_win', type: 'bool', default: false },
      ],
    })
    ids.casino_history = casinoHistory.id
    console.log('✓ Created casino_history collection')
  } catch (e: any) {
    console.log('⚠ casino_history collection error:', e.response?.data || e.message)
    try {
      const existing = await pb.collections.getList(1, 1, { filter: 'name="casino_history"' })
      ids.casino_history = existing.items[0].id
      console.log('✓ Found existing casino_history collection')
    } catch (e2) {
      console.error('Could not find casino_history collection:', e2)
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
    }
  } catch (e: any) {
    console.log('⚠ Could not add roles:', e.message)
  }

  // Add default shop items
  try {
    const shopCount = await pb.collection('shop_items').getList(1, 1)
    if (shopCount.totalItems === 0) {
      const items = [
        { name: 'Coca-Cola', description: 'Boisson gazeuse', price: 3, category: 'drinks' },
        { name: 'Sprite', description: 'Boisson gazeuse citron', price: 3, category: 'drinks' },
        { name: 'Fanta', description: 'Boisson gazeuse orange', price: 3, category: 'drinks' },
        { name: 'Eau', description: 'Bouteille d\'eau 50cl', price: 2, category: 'drinks' },
        { name: 'Café', description: 'Boisson chaude', price: 2.5, category: 'drinks' },
        { name: 'Chips', description: 'Sachet de chips', price: 4, category: 'snacks' },
        { name: 'Barre chocolatée', description: 'Chocolate bar', price: 3.5, category: 'snacks' },
        { name: 'Bonbons', description: 'Sachet de bonbons', price: 2, category: 'snacks' },
        { name: 'Gâteau', description: 'Gâteau industriel', price: 3, category: 'snacks' },
        { name: 'Cigarettes', description: 'Paquet de cigarettes', price: 12, category: 'cigarettes' },
        { name: 'Téléphone', description: 'Smartphone', price: 500, category: 'other' },
      ]
      for (const item of items) {
        await pb.collection('shop_items').create(item)
      }
      console.log('✓ Added default shop items')
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
    }
  } catch (e: any) {
    console.log('⚠ Could not add casino games:', e.message)
  }

  console.log('\n✅ Setup complete!')
}

main().catch(console.error)
