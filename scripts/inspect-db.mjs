import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    val = val.trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log('--- Inspecting Supabase Database ---');
  
  // 1. Fetch gifts columns
  const { data: gifts, error: giftsErr } = await supabase
    .from('gifts')
    .select('*');

  if (giftsErr) {
    console.error('Gifts fetch error:', giftsErr);
  } else {
    console.log(`Found ${gifts.length} cards:`);
    gifts.forEach(g => {
      console.log(`ID: ${g.id} | Slug: ${g.slug} | Title: "${g.title}" | Recipient: "${g.recipient_name}" | Status: ${g.status} | User: ${g.user_id} | Created: ${g.created_at} | HasPwd: ${!!g.password_hash}`);
    });
  }

  // 2. Fetch admin users
  const { data: users, error: usersErr } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, account_status, created_at');

  if (usersErr) {
    console.error('Users fetch error:', usersErr);
  } else {
    console.log(`\nFound ${users.length} admin_users:`);
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Name: "${u.display_name}" | Role: ${u.role} | Status: ${u.account_status}`);
    });
  }
}

inspect();
