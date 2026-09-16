const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: oldData } = await supabase.from('interviews').select('*').limit(1).single();
  if (!oldData) {
    console.log("No interview found");
    return;
  }
  
  const updates = { ...oldData };
  // Add what the API adds
  updates.status = 'scheduled';
  
  const { data, error } = await supabase.from('interviews').update(updates).eq('id', oldData.id);
  console.log("Result:", error ? error : data);
}

test();
