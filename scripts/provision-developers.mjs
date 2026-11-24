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

async function main() {
  console.log('--- Checking Developer Accounts in Supabase ---');
  
  const devEmails = [
    'kaushikparth363@gmail.com',
    'kaushikparth353@gmail.com',
  ];

  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Error listing users:', listErr);
    return;
  }

  const existingAuthUsers = userList.users || [];
  console.log(`Found ${existingAuthUsers.length} total users in Supabase Auth.`);

  for (const email of devEmails) {
    const existingUser = existingAuthUsers.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      console.log(`\nAccount ${email} exists with ID: ${existingUser.id}`);
      console.log(`- Current app_metadata:`, existingUser.app_metadata);
      console.log(`- Current user_metadata:`, existingUser.user_metadata);
      console.log(`- Email confirmed at:`, existingUser.email_confirmed_at);

      // Promote to Platform Owner / Super Admin ('developer')
      const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          app_metadata: {
            ...existingUser.app_metadata,
            role: 'developer',
            is_super_admin: true,
          },
          user_metadata: {
            ...existingUser.user_metadata,
            role: 'developer',
          },
        }
      );

      if (updateErr) {
        console.error(`Error updating auth user for ${email}:`, updateErr);
      } else {
        console.log(`✓ Auth user metadata successfully updated to role 'developer'.`);
      }

      // Update or insert in public.admin_users
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .upsert(
          {
            id: existingUser.id,
            email: email,
            role: 'developer',
            display_name: existingUser.user_metadata?.display_name || 'Platform Owner',
            account_status: 'active',
            email_verified: true,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select();

      if (adminErr) {
        console.error(`Error upserting admin_users for ${email}:`, adminErr);
      } else {
        console.log(`✓ admin_users table successfully updated to role 'developer' for ${email}.`);
      }
    } else {
      console.log(`\nAccount ${email} does NOT exist yet. Provisioning account...`);

      // Attempt to send an invitation via Supabase
      const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            display_name: 'Platform Owner',
            role: 'developer',
          },
        }
      );

      if (inviteErr) {
        console.warn(`inviteUserByEmail returned:`, inviteErr.message);
        console.log(`Generating password-setup link via generateLink...`);
        
        // Alternative: generateLink
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
          type: 'invite',
          email: email,
          options: {
            data: {
              display_name: 'Platform Owner',
              role: 'developer',
            },
          },
        });

        if (linkErr) {
          console.error(`Error generating invite link:`, linkErr);
        } else {
          console.log(`✓ Successfully created invitation for ${email}:`);
          console.log(`User ID: ${linkData.user?.id}`);
          console.log(`Action Link (for secure password setup): ${linkData.properties?.action_link}`);

          // Also upsert in admin_users
          if (linkData.user?.id) {
            await supabase.from('admin_users').upsert({
              id: linkData.user.id,
              email: email,
              role: 'developer',
              display_name: 'Platform Owner',
              account_status: 'active',
              email_verified: false,
              last_active_at: new Date().toISOString(),
            });
            console.log(`✓ admin_users record inserted for ${email}`);
          }
        }
      } else {
        console.log(`✓ Supabase invitation sent successfully to ${email}! User ID: ${inviteData.user?.id}`);
        if (inviteData.user?.id) {
          await supabase.from('admin_users').upsert({
            id: inviteData.user.id,
            email: email,
            role: 'developer',
            display_name: 'Platform Owner',
            account_status: 'active',
            email_verified: false,
            last_active_at: new Date().toISOString(),
          });
          console.log(`✓ admin_users record inserted for ${email}`);
        }
      }
    }
  }
}

main().catch(console.error);
