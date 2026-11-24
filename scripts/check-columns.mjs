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

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkCols() {
  const { data: g, error: gErr } = await supabase.from('gifts').select('*').limit(1);
  if (g && g[0]) {
    console.log('gifts columns:', Object.keys(g[0]));
  } else {
    console.log('gifts select error or empty:', gErr);
  }

  const { data: au, error: auErr } = await supabase.from('admin_users').select('*').limit(1);
  if (au && au[0]) {
    console.log('admin_users columns:', Object.keys(au[0]));
    console.log('admin_users row 0:', au[0]);
  }
}

checkCols().catch(console.error);
