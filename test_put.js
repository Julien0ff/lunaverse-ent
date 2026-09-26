const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const reqBody = {
    id: "0a53b2be-00b8-466a-b286-9a2c3f87d46c", // fake id or I should fetch one
    action: "publish"
  };
  
  // Actually, I can just hit the API on production to see the error!
  const res = await fetch('https://ent.lunaverse.fr/api/admin/announcements', {
    method: 'GET',
    headers: { 'Cookie': '' }
  });
  console.log(res.status);
}
run();
