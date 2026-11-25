import { createAdminClient } from '@/lib/supabase/admin';
import { MOCK_GIFTS } from '@/lib/mock-data';
import { Gift, SectionType } from '@/types/gift';

export const DEMO_CARD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

/**
 * Loads a gift by slug, including all child collections (sections, memories, timeline entries,
 * letters, wishes, secret messages, and quiz questions).
 * 
 * Guarantees that the public demonstration card (/g/demo) always retains its full, rich
 * showcase experience across both recipient and preview views.
 */
export async function getGiftWithChildCollections(slug: string): Promise<Gift | null> {
  const isDemo = slug === 'demo' || slug === 'demo-gift';
  const canonicalDemo = MOCK_GIFTS['demo'] || MOCK_GIFTS['demo-gift'];
  const mockFallback = MOCK_GIFTS[slug] || (isDemo ? canonicalDemo : null);

  let dbGift: any = null;
  let sections: any[] | null = null;
  let memories: any[] | null = null;
  let timeline: any[] | null = null;
  let letters: any[] | null = null;
  let wishes: any[] | null = null;
  let secretMessages: any[] | null = null;
  let quizQuestions: any[] | null = null;

  try {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from('gifts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      dbGift = data;
      const giftId = dbGift.id;

      // Query child relational tables in parallel
      const [
        secRes,
        memRes,
        timeRes,
        letRes,
        wishRes,
        secMsgRes,
        quizRes,
      ] = await Promise.all([
        supabaseAdmin
          .from('gift_sections')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('memories')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('timeline_entries')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('gift_letters')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('gift_wishes')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('secret_messages')
          .select('*')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
        supabaseAdmin
          .from('quiz_questions')
          .select('*, quiz_options(*)')
          .eq('gift_id', giftId)
          .order('display_order', { ascending: true }),
      ]);

      sections = secRes.data || null;
      memories = memRes.data || null;
      timeline = timeRes.data || null;
      letters = letRes.data || null;
      wishes = wishRes.data || null;
      secretMessages = secMsgRes.data || null;
      quizQuestions = quizRes.data || null;
    }
  } catch (err) {
    console.warn('Database fetch note in getGiftWithChildCollections:', err);
  }

  // Format quiz questions and nested options if fetched from DB
  const formattedQuiz = quizQuestions?.map((q: any) => ({
    id: q.id,
    question: q.question,
    display_order: q.display_order,
    options: (q.quiz_options || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
  }));

  // Format wishes from DB gift_wishes table
  const formattedWishes = wishes?.map((w: any) => ({
    id: w.id,
    wish_text: w.wish_text,
    display_order: w.display_order,
  }));

  if (isDemo && canonicalDemo) {
    // For the demonstration card, always preserve all showcase sections, memories, and letters
    const finalMemories = (memories && memories.length > 0) ? memories : canonicalDemo.memories;
    const finalTimeline = (timeline && timeline.length > 0) ? timeline : canonicalDemo.timeline_entries;
    const finalLetters = (letters && letters.length > 0) ? letters : canonicalDemo.letters;
    const finalQuiz = (formattedQuiz && formattedQuiz.length > 0) ? formattedQuiz : canonicalDemo.quiz_questions;
    const finalSecrets = (secretMessages && secretMessages.length > 0) ? secretMessages : canonicalDemo.secret_messages;
    const finalWishes = (formattedWishes && formattedWishes.length > 0) ? formattedWishes : canonicalDemo.wishes;
    const finalSections = (sections && sections.length > 0) ? sections : canonicalDemo.sections;

    return {
      ...canonicalDemo,
      ...(dbGift || {}),
      sections: finalSections,
      memories: finalMemories,
      timeline_entries: finalTimeline,
      letters: finalLetters,
      quiz_questions: finalQuiz,
      secret_messages: finalSecrets,
      wishes: finalWishes,
      is_demo: true,
      slug: 'demo',
    };
  }

  if (dbGift) {
    return {
      ...(mockFallback || {}),
      ...(dbGift as Gift),
      sections: (sections && sections.length > 0) ? sections : mockFallback?.sections,
      memories: (memories && memories.length > 0) ? memories : mockFallback?.memories,
      timeline_entries: (timeline && timeline.length > 0) ? timeline : mockFallback?.timeline_entries,
      letters: (letters && letters.length > 0) ? letters : mockFallback?.letters,
      wishes: (formattedWishes && formattedWishes.length > 0) ? formattedWishes : mockFallback?.wishes,
      secret_messages: (secretMessages && secretMessages.length > 0) ? secretMessages : mockFallback?.secret_messages,
      quiz_questions: (formattedQuiz && formattedQuiz.length > 0) ? formattedQuiz : mockFallback?.quiz_questions,
    };
  }

  return mockFallback || null;
}
