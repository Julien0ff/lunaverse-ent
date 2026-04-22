
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function updateNickname() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error: getError } = await supabase.from('profiles').select('id, username').limit(1).single()
  if (getError || !profile) {
    console.error('Error fetching profile:', getError)
    return
  }

  console.log(`Testing update for user: ${profile.username} (${profile.id})`)
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ nickname_rp: 'TEST・John DOE' })
    .eq('id', profile.id)

  if (updateError) {
    console.error('FAILED to update nickname_rp. Does the column exist?', updateError.message)
  } else {
    console.log('SUCCESS: nickname_rp column exists and was updated.')
  }
}

updateNickname()
