const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const id = '33e67af6-ba76-441c-a948-1663c34a0f8e'; // from user log
  
  // 1. GET
  const { data, error } = await supabase.from('satisfaction_forms').select('*').eq('id', id).single();
  if (error) { console.error('GET ERROR:', error); return; }
  console.log('GET OK:', data);

  // 2. PATCH
  const payload = { ...data };
  delete payload.profile;
  
  const { data: updated, error: patchError } = await supabase
    .from('satisfaction_forms')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (patchError) {
    console.error('PATCH ERROR:', patchError);
  } else {
    console.log('PATCH OK:', updated);
  }
}
test();
