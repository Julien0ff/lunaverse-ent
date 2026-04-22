
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function checkStatusCol() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error } = await supabase.from('profiles').select('id, username').limit(1).single()
  if (error || !profile) return

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ discord_status: 'online' })
    .eq('id', profile.id)

  if (updateError) {
    console.error('FAILED to update discord_status:', updateError.message)
  } else {
    console.log('SUCCESS: discord_status column exists.')
  }
}

checkStatusCol()
