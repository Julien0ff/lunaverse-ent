// Load .env.local first
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const studentRoles = [
  {
    name: 'eleve',
    discord_role_id: '1487571354323648582',
    salary_amount: 0,
    pocket_money: 20,
    color: '#57F287',
    can_connect: true,
  },
  {
    name: 'nova',
    discord_role_id: '1487572001542508626',
    salary_amount: 0,
    pocket_money: 0,
    color: '#5865F2',
    can_connect: true,
  },
  {
    name: 'nebuleuse',
    discord_role_id: '1487571897364254841',
    salary_amount: 0,
    pocket_money: 0,
    color: '#EB459E',
    can_connect: true,
  },
]

async function addStudentRoles() {
  console.log('🎓 Adding student roles to Supabase...\n')

  const { data: existing } = await supabase.from('roles').select('name')
  const existingNames = (existing || []).map((r: any) => r.name)

  for (const role of studentRoles) {
    if (existingNames.includes(role.name)) {
      console.log(`⏭️  Skipped (already exists): ${role.name}`)
      continue
    }

    const { error } = await supabase.from('roles').insert([role])
    if (error) {
      console.error(`❌ Error inserting '${role.name}':`, error.message)
    } else {
      console.log(`✅ Role '${role.name}' inserted (discord_role_id: ${role.discord_role_id})`)
    }
  }

  console.log('\n🎉 Done! Restart the bot to trigger a full sync.')
  process.exit(0)
}

addStudentRoles().catch(err => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
