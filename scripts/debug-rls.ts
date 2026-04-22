import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DISCORD_ID = '1064801165201641592'

async function fix() {
  const lines: string[] = []

  // 1. Find profile
  const { data: profile } = await supabase
    .from('profiles').select('id, discord_id, username').eq('discord_id', DISCORD_ID).maybeSingle()
  lines.push(`Profile: ${JSON.stringify(profile)}`)
  if (!profile) { lines.push('NO PROFILE!'); writeFileSync('debug-rls.txt', lines.join('\n')); process.exit(1) }

  // 2. Find all roles
  const { data: allRoles } = await supabase.from('roles').select('id, name, discord_role_id')
  lines.push(`\nRoles in DB: ${allRoles?.map((r: any) => `${r.name}(${r.id})`).join(', ')}`)

  // 3. Count user_roles
  const { data: existing, error: existingErr } = await supabase
    .from('user_roles').select('*').eq('user_id', profile.id)
  lines.push(`\nExisting user_roles for user ${profile.id}: ${existing?.length ?? 0}`)
  if (existingErr) lines.push(`Error: ${existingErr.message}`)

  // 4. Manually insert the admin role
  const adminRole = allRoles?.find((r: any) => r.name === 'admin')
  if (adminRole) {
    const { error } = await supabase.from('user_roles').upsert(
      { user_id: profile.id, role_id: adminRole.id },
      { onConflict: 'user_id,role_id' }
    )
    lines.push(`\nInsert admin role: ${error ? 'ERROR: ' + error.message : 'OK'}`)
  }

  // 5. Verify
  const { data: after } = await supabase
    .from('user_roles').select('role:roles(name)').eq('user_id', profile.id)
  lines.push(`\nuser_roles after insert: ${after?.map((ur: any) => ur.role?.name).join(', ') || 'none'}`)

  writeFileSync('debug-rls.txt', lines.join('\n'))
  console.log('Written to debug-rls.txt')
  process.exit(0)
}

fix().catch(e => { console.error(e.message); process.exit(1) })
