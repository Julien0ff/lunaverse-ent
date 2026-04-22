import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'

async function main() {
  const pb = new PocketBase(PB_URL)
  
  // Try to authenticate as superuser
  try {
    await pb.collection('_superusers').authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'sultanledebile@gmail.com',
      process.env.PB_ADMIN_PASSWORD || '7ncCQ25t0ak-VRS'
    )
    console.log('✓ Authenticated as superuser')
  } catch (e) {
    console.log('Auth failed, trying admin auth...')
    // Try as admin
    try {
      await pb.admins.authWithPassword(
        process.env.PB_ADMIN_EMAIL || 'sultanledebile@gmail.com',
        process.env.PB_ADMIN_PASSWORD || '7ncCQ25t0ak-VRS'
      )
      console.log('✓ Authenticated as admin')
    } catch (e2) {
      console.error('Authentication failed:', e2)
      console.log('Continuing without admin auth...')
    }
  }

  // Add default roles if they don't exist
  try {
    const existingRoles = await pb.collection('roles').getList(1, 1)
    if (existingRoles.totalItems === 0) {
      console.log('Adding default roles...')
      await pb.collection('roles').create({ name: 'admin', discord_role_id: '', salary_amount: 0, pocket_money: 0, color: '#ED4245' })
      await pb.collection('roles').create({ name: 'prof', discord_role_id: '', salary_amount: 500, pocket_money: 0, color: '#57F287' })
      await pb.collection('roles').create({ name: 'eleve', discord_role_id: '', salary_amount: 0, pocket_money: 25, color: '#5865F2' })
      await pb.collection('roles').create({ name: 'cpe', discord_role_id: '', salary_amount: 600, pocket_money: 0, color: '#FEE75C' })
      console.log('✓ Added default roles')
    } else {
      console.log('⚠ Roles already exist')
    }
  } catch (e) {
    console.log('Could not add roles:', e)
  }

  // Add default shop items if they don't exist
  try {
    const existingItems = await pb.collection('shop_items').getList(1, 1)
    if (existingItems.totalItems === 0) {
      console.log('Adding default shop items...')
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
    } else {
      console.log('⚠ Shop items already exist')
    }
  } catch (e) {
    console.log('Could not add shop items:', e)
  }

  // Add default casino games if they don't exist
  try {
    const existingGames = await pb.collection('casino_games').getList(1, 1)
    if (existingGames.totalItems === 0) {
      console.log('Adding default casino games...')
      await pb.collection('casino_games').create({ name: 'Machines à sous', description: 'Tentez votre chance aux machines à sous', min_bet: 1, max_bet: 500, multiplier_min: 0.5, multiplier_max: 50 })
      await pb.collection('casino_games').create({ name: 'Dés', description: 'Devinez si le résultat sera haut ou bas', min_bet: 1, max_bet: 200, multiplier_min: 1.8, multiplier_max: 1.8 })
      await pb.collection('casino_games').create({ name: 'Pile ou Face', description: 'Simple comme pile ou face', min_bet: 1, max_bet: 100, multiplier_min: 1.9, multiplier_max: 1.9 })
      console.log('✓ Added default casino games')
    } else {
      console.log('⚠ Casino games already exist')
    }
  } catch (e) {
    console.log('Could not add casino games:', e)
  }

  console.log('\n✅ Default data setup complete!')
}

main().catch(console.error)
