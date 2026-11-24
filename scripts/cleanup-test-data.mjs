import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import bcrypt from 'bcryptjs';

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

const DEMO_GIFT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const DEMO_PASSWORD = 'show';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

async function cleanupAndSeedDemo() {
  console.log('🚀 Running Dear You Test Data Cleanup & Demo Showcase Seeder...');

  // 1. Fetch all cards from Supabase
  const { data: existingGifts, error: fetchErr } = await supabase.from('gifts').select('*');
  if (fetchErr) {
    console.error('Error fetching cards:', fetchErr.message);
  } else {
    console.log(`Found ${existingGifts.length} cards currently in database.`);

    // 2. Identify test cards to delete (excluding legitimate user cards and the official demo)
    for (const card of existingGifts) {
      const isOfficialDemo = card.id === DEMO_GIFT_ID || card.slug === 'demo' || card.slug === 'demo-gift';
      if (isOfficialDemo) {
        console.log(`  -> Retaining official demonstration card: "${card.title}" (${card.slug})`);
        continue;
      }

      const isTestCard =
        card.slug?.includes('test') ||
        card.title?.toLowerCase().includes('test') ||
        card.recipient_name?.toLowerCase().includes('test') ||
        card.slug?.includes('temp') ||
        card.title?.toLowerCase().includes('temp');

      if (isTestCard) {
        console.log(`  -> Cleaning test card: "${card.title}" (ID: ${card.id}, Slug: ${card.slug})`);
        const { error: delErr } = await supabase.from('gifts').delete().eq('id', card.id);
        if (delErr) {
          console.warn(`     Delete error for ${card.id}:`, delErr.message);
        } else {
          console.log(`     ✓ Safely removed test card ${card.id}`);
        }
      } else {
        console.log(`  -> Preserving genuine user-created card: "${card.title}" (ID: ${card.id})`);
      }
    }
  }

  // 3. Upsert the designated Official Demonstration Card into Supabase
  const demoCardPayload = {
    id: DEMO_GIFT_ID,
    slug: 'demo',
    title: 'A Little Universe for Ananya ✨',
    recipient_name: 'Ananya',
    event_type: 'Birthday',
    event_date: '2026-11-25',
    selected_theme: 'dreamy',
    status: 'published',
    password_hash: DEMO_PASSWORD_HASH,
    password_hint: 'show',
    welcome_heading: 'A starry little sanctuary, just for you.',
    welcome_message: 'Someone who treasures every smile of yours put together these memories, whispers, and wishes.',
    welcome_button_text: 'Start Your Journey',
    gift_box_message: 'May this year unfold like a gentle dawn, brimming with soft surprises, hearty laughter, and dreams taking flight.',
    scratch_card_hidden_text: 'You have this rare, quiet magic of making everyone around you feel valued and at home. Never stop being you!',
    closing_message: 'No matter how fast the world moves, know that you have friends who celebrate you endlessly. Happy Birthday!',
    music_url: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    music_title: 'Celestial Waltz',
    published_at: new Date().toISOString(),
    created_at: '2026-11-20T10:00:00Z',
    updated_at: new Date().toISOString(),
  };

  console.log('\n🌟 Upserting designated Official Demonstration Card into Supabase...');
  const { data: upsertData, error: upsertErr } = await supabase
    .from('gifts')
    .upsert(demoCardPayload, { onConflict: 'id' })
    .select();

  if (upsertErr) {
    console.error('Error upserting demo card:', upsertErr.message);
  } else {
    console.log('✓ Successfully upserted official demonstration card!');
    console.log('  ID:', DEMO_GIFT_ID);
    console.log('  Slug: /g/demo');
    console.log('  Password:', DEMO_PASSWORD);
    console.log('  Password Hash verified:', bcrypt.compareSync(DEMO_PASSWORD, DEMO_PASSWORD_HASH));
  }

  console.log('\n🎉 Cleanup and Demo showcase configuration completed successfully!');
}

cleanupAndSeedDemo();
