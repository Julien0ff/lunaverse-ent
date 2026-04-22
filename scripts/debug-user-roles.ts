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

async function debug() {
  const lines: string[] = []
  lines.push(`Checking Discord ID: ${DISCORD_ID}`)

  const { data: profile, error: pe } = await supabase
    .from('profiles').select('id, discord_id, username').eq('discord_id', DISCORD_ID).maybeSingle()

  if (pe) lines.push(`Profile error: ${pe.message}`)
  if (!profile) {
    lines.push('NO PROFILE FOUND for this discord_id')
  } else {
    lines.push(`Profile: id=${profile.id} username=${profile.username}`)

    const { data: userRoles, error: ure } = await supabase
      .from('user_roles').select('role_id, role:roles(name, discord_role_id)').eq('user_id', profile.id)

    if (ure) lines.push(`user_roles error: ${ure.message}`)
    if (!userRoles || userRoles.length === 0) {
      lines.push('NO user_roles found for this profile id')
    } else {
      lines.push(`user_roles (${userRoles.length}):`)
      userRoles.forEach((ur: any) => lines.push(`  role=${ur.role?.name} discord_role_id=${ur.role?.discord_role_id}`))
    }
  }

  const { data: allRoles } = await supabase.from('roles').select('name, discord_role_id, can_connect')
  lines.push(`All roles (${allRoles?.length}):`)
  allRoles?.forEach((r: any) => lines.push(`  ${r.name} | ${r.discord_role_id} | can_connect=${r.can_connect}`))

  writeFileSync('debug-output.txt', lines.join('\n'))
  console.log('Written to debug-output.txt')
  process.exit(0)
}

debug().catch(e => { console.error(e.message); process.exit(1) })
