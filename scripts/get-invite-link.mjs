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

async function gen() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: 'kaushikparth363@gmail.com',
    options: {
      redirectTo: 'https://dear-you-wine.vercel.app/auth/reset-password',
    },
  });
  console.log('Action link generated:', data?.properties?.action_link);
  console.log('Error:', error ? error.message : 'none');
}

gen().catch(console.error);
