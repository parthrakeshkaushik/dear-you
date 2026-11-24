import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const lines = env.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.split('=');
    if (parts[0].trim() === key) {
      return parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('Inspecting Supabase URL:', supabaseUrl);

  const { data: userList, error: uErr } = await supabase.auth.admin.listUsers();
  console.log('Total Auth Users:', userList?.users?.length, uErr || '');
  if (userList?.users) {
    for (const u of userList.users) {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Confirmed: ${u.email_confirmed_at} | AppMeta: ${JSON.stringify(u.app_metadata)} | UserMeta: ${JSON.stringify(u.user_metadata)}`);
    }
  }

  // Check admin_users table
  const { data: adminUsers, error: aErr } = await supabase.from('admin_users').select('*');
  console.log('\nAdmin Users table status:', aErr ? aErr.message : `${adminUsers?.length} records`);
  if (adminUsers) {
    for (const au of adminUsers) {
      console.log(`- Admin User: ${au.id} | Email: ${au.email} | Role: ${au.role} | Status: ${au.account_status}`);
    }
  }

  // Check gifts table
  const { data: gifts, error: gErr } = await supabase.from('gifts').select('id, slug, owner_id, title, is_demo, status');
  console.log('\nGifts table status:', gErr ? gErr.message : `${gifts?.length} records`);
  if (gifts && gifts.length > 0) {
    for (const g of gifts) {
      console.log(`- Gift: ${g.id} | Slug: ${g.slug} | Owner: ${g.owner_id} | Demo: ${g.is_demo} | Status: ${g.status}`);
    }
  }

  // Check developer_audit_logs table
  const { data: logs, error: lErr } = await supabase.from('developer_audit_logs').select('*');
  console.log('\nDeveloper Audit Logs table status:', lErr ? lErr.message : `${logs?.length} records`);
}

run().catch(console.error);
