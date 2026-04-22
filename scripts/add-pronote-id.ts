import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('Adding pronote_id to profiles...')
    const { error } = await supabase.rpc('run_sql', { 
        sql_query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronote_id TEXT DEFAULT NULL;' 
    })

    if (error) {
        // If RPC is not available, we might need to explain to user or try another way.
        // Usually, the easiest way for me is to suggest the SQL in the walkthrough.
        console.error('Error adding column via RPC:', error.message)
        console.log('Please run this SQL manually in Supabase Dashboard:')
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronote_id TEXT DEFAULT NULL;')
    } else {
        console.log('Column added successfully!')
    }
}

run()
