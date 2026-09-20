const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.log("No env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('houses').select('*').eq('owner_id', 'a96fd14e-0c0d-4670-9381-5abcacc784b5'); // Wait, we don't know his user id. Let's select all houses
  const { data: h } = await supabase.from('houses').select('*');
  console.log(h);
}
run();
