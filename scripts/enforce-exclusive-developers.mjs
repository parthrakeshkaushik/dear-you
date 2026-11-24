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

const EXCLUSIVE_DEV_EMAILS = [
  'kaushikparth363@gmail.com',
  'kaushikparth353@gmail.com',
];

async function main() {
  console.log('=== ENFORCING EXCLUSIVE TWO DEVELOPER ACCOUNTS ===');

  // 1. Audit Auth Users
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list auth users:', listErr);
    return;
  }

  const authUsers = userList.users || [];
  console.log(`Found ${authUsers.length} total users in Supabase Auth.`);

  for (const user of authUsers) {
    const email = user.email?.toLowerCase();
    const isDesignated = EXCLUSIVE_DEV_EMAILS.includes(email);

    if (isDesignated) {
      console.log(`\n[AUTHORIZED] ${email} (ID: ${user.id})`);
      // Update app_metadata
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          role: 'developer',
          is_super_admin: true,
        },
        user_metadata: {
          ...user.user_metadata,
          role: 'developer',
        },
      });

      // Update admin_users table
      await supabase.from('admin_users').upsert({
        id: user.id,
        email: email,
        role: 'developer',
        display_name: user.user_metadata?.display_name || 'Platform Owner',
        account_status: 'active',
        email_verified: true,
        last_active_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      console.log(`✓ Set role = 'developer' in auth and admin_users for ${email}`);
    } else {
      console.log(`\n[AUDITING UNPRIVILEGED / TEST ACCOUNT] ${email} (ID: ${user.id})`);
      if (email.includes('developer1@dearyou.com') || email.includes('fake') || email.includes('test')) {
        console.log(`-> Purging test account ${email} completely.`);
        await supabase.from('admin_users').delete().eq('id', user.id);
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`✓ Test user ${email} purged successfully.`);
      } else {
        // Genuine user: ensure strictly 'creator' role
        await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...user.app_metadata,
            role: 'creator',
            is_super_admin: false,
          },
        });
        await supabase.from('admin_users').update({
          role: 'creator',
        }).eq('id', user.id);
        console.log(`✓ User ${email} restricted to role = 'creator'.`);
      }
    }
  }

  // Final verification
  console.log('\n--- VERIFICATION ---');
  const { data: finalAdminUsers } = await supabase.from('admin_users').select('*');
  console.log(`Total admin_users rows: ${finalAdminUsers?.length}`);
  const devRecords = finalAdminUsers?.filter((u) => u.role === 'developer') || [];
  console.log(`Developers count in admin_users: ${devRecords.length}`);
  devRecords.forEach((d) => console.log(`- Dev: ${d.email} | Role: ${d.role} | Status: ${d.account_status}`));

  if (devRecords.length === 2 &&
      devRecords.every((d) => EXCLUSIVE_DEV_EMAILS.includes(d.email.toLowerCase()))) {
    console.log('\n SUCCESS: Exactly the two authorized accounts have developer privileges.');
  } else {
    console.error('\n WARNING: Developer count or emails mismatch!');
  }
}

main().catch(console.error);
