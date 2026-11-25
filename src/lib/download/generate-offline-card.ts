import { Gift } from '@/types/gift';
import { THEME_PRESETS } from '@/config/themes';
import { getScratchCardPalette } from '@/lib/theme/scratch-card-theme';

/**
 * Escapes HTML characters to prevent XSS in generated offline HTML.
 */
function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a complete, self-contained standalone offline HTML package for a gift.
 * The recipient can open this HTML file directly in any desktop, tablet, or mobile browser without internet access.
 */
export function generateOfflineCardHtml(gift: Gift): string {
  const theme =
    (gift.selected_theme !== 'custom'
      ? (THEME_PRESETS as any)[gift.selected_theme]
      : null) || THEME_PRESETS['dreamy'];
  const colors = theme.colors;

  const recipientName = escapeHtml(gift.recipient_name);
  const giftTitle = escapeHtml(gift.title);
  const welcomeHeading = escapeHtml(gift.welcome_heading || `A little universe created for ${gift.recipient_name}`);
  const welcomeMessage = escapeHtml(gift.welcome_message || 'Treasured memories and heartfelt words collected just for you.');
  const giftBoxMessage = escapeHtml(gift.gift_box_message || 'May your journey ahead be filled with laughter, wonder, and dreams taking flight.');
  const scratchMessage = escapeHtml(gift.scratch_card_hidden_text || 'You bring so much light into the lives of everyone around you. Never stop shining!');
  const closingMessage = escapeHtml(gift.closing_message || 'Some connections and memories are too special to ever fade. Thank you for being in this story.');

  const scratchPalette = getScratchCardPalette({
    themeId: gift.selected_theme,
    themeConfig: gift.theme_config,
  });

  // Pre-render memories
  const memories = gift.memories || [];
  const memoriesHtml = memories
    .map((m, idx) => {
      const caption = escapeHtml(m.caption);
      const date = escapeHtml(m.memory_date);
      const style = m.frame_style || 'polaroid';
      const imgSrc = escapeHtml(m.image_path);

      let frameClass = 'frame-polaroid';
      if (style === 'vintage_wood') frameClass = 'frame-vintage';
      else if (style === 'golden_luxury') frameClass = 'frame-golden';
      else if (style === 'scrapbook') frameClass = 'frame-scrapbook';
      else if (style === 'pastel') frameClass = 'frame-pastel';
      else if (style === 'minimal') frameClass = 'frame-minimal';

      return `
        <div class="memory-card ${frameClass}" onclick="openLightbox('${imgSrc}', '${caption}', '${date}')">
          <div class="photo-container">
            <img src="${imgSrc}" alt="${caption}" loading="lazy" />
          </div>
          ${caption || date ? `
            <div class="caption-container">
              ${caption ? `<p class="memory-caption">${caption}</p>` : ''}
              ${date ? `<span class="memory-date">${date}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('\n');

  // Pre-render timeline
  const timeline = gift.timeline_entries || [];
  const timelineHtml = timeline
    .map((t) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-date">${escapeHtml(t.event_date)}</span>
          <h4 class="timeline-title">${escapeHtml(t.title)}</h4>
          <p class="timeline-desc">${escapeHtml(t.description)}</p>
        </div>
      </div>
    `)
    .join('\n');

  // Pre-render quiz
  const quiz = gift.quiz_questions || [];
  const quizHtml = quiz
    .map((q, qIdx) => `
      <div class="quiz-card">
        <h4 class="quiz-question">${qIdx + 1}. ${escapeHtml(q.question)}</h4>
        <div class="quiz-options">
          ${q.options
            .map(
              (o, oIdx) => `
            <button class="quiz-opt" onclick="handleQuizAnswer(this, ${o.is_correct})">
              <span>${String.fromCharCode(65 + oIdx)}.</span> ${escapeHtml(o.option_text)}
            </button>
          `
            )
            .join('\n')}
        </div>
      </div>
    `)
    .join('\n');

  // Pre-render letters
  const letters = gift.letters || [];
  const lettersHtml = letters
    .map(
      (l) => `
      <div class="letter-card">
        <div class="letter-stamp">💌</div>
        <h3 class="letter-heading">${escapeHtml(l.heading)}</h3>
        <div class="letter-body">${escapeHtml(l.content).replace(/\n/g, '<br/>')}</div>
      </div>
    `
    )
    .join('\n');

  // Pre-render wishes
  const wishes = gift.wishes || [];
  const wishesHtml = wishes
    .map(
      (w) => `
      <div class="wish-pill">
        <span>✨</span>
        <p>${escapeHtml(w.wish_text)}</p>
      </div>
    `
    )
    .join('\n');

  // Pre-render secret messages
  const secrets = gift.secret_messages || [];
  const secretsHtml = secrets
    .map(
      (s, sIdx) => `
      <div class="secret-card" onclick="this.classList.toggle('revealed')">
        <div class="secret-cover">
          <span class="secret-icon">🔒</span>
          <h4>${escapeHtml(s.title || `Secret Note #${sIdx + 1}`)}</h4>
          <p class="tap-hint">Tap to unlock & reveal message</p>
        </div>
        <div class="secret-content">
          <span class="secret-icon">🔓</span>
          <h4>${escapeHtml(s.title || `Secret Note #${sIdx + 1}`)}</h4>
          <p>${escapeHtml(s.content)}</p>
        </div>
      </div>
    `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${recipientName} — ${giftTitle} | Offline Keepsake</title>
  <style>
    /* Google Fonts with robust fallback fonts */
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&family=Caveat:wght@400;600&display=swap');

    :root {
      --bg: ${colors.background};
      --text: ${colors.text};
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --surface: ${colors.surface};
      --border: ${colors.border};
      --muted: ${colors.muted};
      --font-serif: 'Playfair Display', Georgia, serif;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-handwriting: 'Caveat', 'Brush Script MT', cursive;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* Offline Banner */
    .offline-banner {
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-size: 11px;
      text-align: center;
      padding: 8px 16px;
      letter-spacing: 0.05em;
      font-family: var(--font-sans);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    /* Hero / Cover */
    .hero-section {
      text-align: center;
      padding: 60px 20px 80px;
      position: relative;
    }

    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(139, 122, 168, 0.15);
      color: var(--primary);
      margin-bottom: 24px;
      border: 1px solid var(--border);
    }

    .recipient-salutation {
      font-family: var(--font-handwriting);
      font-size: 38px;
      color: var(--secondary);
      display: block;
      margin-bottom: 12px;
    }

    .hero-title {
      font-family: var(--font-serif);
      font-size: 36px;
      font-weight: normal;
      line-height: 1.3;
      margin-bottom: 16px;
      color: var(--text);
    }

    @media (min-width: 640px) {
      .hero-title { font-size: 48px; }
      .recipient-salutation { font-size: 48px; }
    }

    .hero-message {
      font-size: 16px;
      color: var(--muted);
      max-width: 580px;
      margin: 0 auto 32px;
      font-weight: 300;
    }

    .btn-journey {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      border-radius: 9999px;
      background: var(--primary);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
      border: none;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-journey:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -5px rgba(0,0,0,0.2);
    }

    /* Section Styling */
    .section-block {
      margin: 60px 0;
      padding: 40px 24px;
      border-radius: 28px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    .section-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .section-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--primary);
      font-weight: 600;
    }

    .section-title {
      font-family: var(--font-serif);
      font-size: 26px;
      margin-top: 6px;
      color: var(--text);
    }

    /* Interactive Gift Box */
    .gift-box-interactive {
      text-align: center;
      padding: 20px;
    }
    .gift-box-icon {
      font-size: 64px;
      cursor: pointer;
      display: inline-block;
      transition: transform 0.3s;
      user-select: none;
    }
    .gift-box-icon:hover {
      transform: scale(1.1) rotate(5deg);
    }
    .gift-message-reveal {
      display: none;
      margin-top: 24px;
      padding: 24px;
      border-radius: 20px;
      background: rgba(139, 122, 168, 0.08);
      border: 1px dashed var(--primary);
      font-size: 16px;
      font-style: italic;
      color: var(--text);
      animation: fadeIn 0.5s ease-in-out;
    }

    /* Scratch Card */
    .scratch-container {
      max-width: 460px;
      margin: 0 auto;
      text-align: center;
      border-radius: 24px;
      background: var(--surface);
      border: 2px solid var(--border);
      padding: 24px;
      cursor: pointer;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
    }
    .scratch-cover {
      background: linear-gradient(135deg, #D4AF37 0%, #E8E8E8 25%, #C0C0C0 50%, #F5E6AB 75%, #A9A9A9 100%);
      color: #261938;
      padding: 28px 20px;
      border-radius: 18px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transition: all 0.3s ease;
    }
    .scratch-cover:hover {
      filter: brightness(1.05);
      transform: scale(0.995);
    }
    .scratch-hidden-content {
      display: none;
      font-family: var(--font-handwriting);
      font-size: 22px;
      font-weight: 600;
      line-height: 1.6;
      background: ${scratchPalette.revealBg};
      color: ${scratchPalette.textColor};
      border: 1px solid ${scratchPalette.revealBorder};
      border-radius: 18px;
      padding: 28px 24px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);
    }
    .scratch-container.scratched .scratch-cover {
      display: none;
    }
    .scratch-container.scratched .scratch-hidden-content {
      display: block;
      animation: fadeIn 0.4s;
    }

    /* Memory Wall Grid */
    .memories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
      margin-top: 20px;
    }

    .memory-card {
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      background: #fff;
      display: flex;
      flex-col: column;
    }
    .memory-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }

    /* Frames */
    .frame-polaroid {
      padding: 12px 12px 20px;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      border: 1px solid #eaeaea;
    }
    .frame-vintage {
      padding: 14px;
      background: #3e2723;
      color: #efebe9;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.2);
      border: 4px solid #2e1c18;
    }
    .frame-golden {
      padding: 14px;
      background: #fffdf5;
      border: 3px solid #d4af37;
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
    }
    .frame-scrapbook {
      padding: 12px;
      background: #faf8f5;
      border: 1px dashed #bcaaa4;
      position: relative;
    }
    .frame-pastel {
      padding: 12px;
      background: #fdf6f7;
      border: 2px solid #f8bbd0;
      border-radius: 20px;
    }
    .frame-minimal {
      padding: 0;
      background: transparent;
      border: none;
    }

    .photo-container {
      width: 100%;
      height: 220px;
      overflow: hidden;
      border-radius: 8px;
    }
    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s;
    }
    .memory-card:hover .photo-container img {
      transform: scale(1.05);
    }

    .caption-container {
      padding-top: 12px;
      text-align: center;
    }
    .memory-caption {
      font-size: 13px;
      line-height: 1.4;
      color: #333;
      margin-bottom: 4px;
    }
    .frame-vintage .memory-caption { color: #efebe9; }
    .memory-date {
      font-size: 11px;
      color: #888;
      font-family: monospace;
    }

    /* Timeline */
    .timeline-container {
      position: relative;
      margin-left: 20px;
      padding-left: 24px;
      border-left: 2px solid var(--border);
    }
    .timeline-item {
      position: relative;
      margin-bottom: 28px;
    }
    .timeline-dot {
      position: absolute;
      left: -31px;
      top: 4px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--bg);
    }
    .timeline-date {
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
      color: var(--primary);
    }
    .timeline-title {
      font-family: var(--font-serif);
      font-size: 18px;
      margin: 4px 0;
    }
    .timeline-desc {
      font-size: 13px;
      color: var(--muted);
    }

    /* Quiz */
    .quiz-card {
      background: rgba(0,0,0,0.02);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .quiz-question {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .quiz-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .quiz-opt {
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: #fff;
      text-align: left;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quiz-opt:hover {
      background: rgba(139, 122, 168, 0.08);
      border-color: var(--primary);
    }
    .quiz-opt.correct {
      background: #e8f5e9 !important;
      border-color: #4caf50 !important;
      color: #2e7d32 !important;
      font-weight: 600;
    }
    .quiz-opt.incorrect {
      background: #ffebee !important;
      border-color: #ef5350 !important;
      color: #c62828 !important;
    }

    /* Letters & Wishes */
    .letter-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      position: relative;
    }
    .letter-stamp {
      font-size: 28px;
      float: right;
    }
    .letter-heading {
      font-family: var(--font-serif);
      font-size: 20px;
      margin-bottom: 16px;
      color: var(--text);
    }
    .letter-body {
      font-size: 14px;
      line-height: 1.8;
      color: var(--muted);
    }

    .wish-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      margin-bottom: 10px;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }

    /* Secrets */
    .secret-card {
      border-radius: 18px;
      border: 1px solid var(--border);
      background: #fff;
      padding: 20px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .secret-card:hover {
      border-color: var(--primary);
    }
    .secret-card .secret-content { display: none; }
    .secret-card.revealed .secret-cover { display: none; }
    .secret-card.revealed .secret-content { display: block; animation: fadeIn 0.4s; }
    .secret-icon { font-size: 24px; margin-bottom: 8px; display: block; }
    .tap-hint { font-size: 11px; color: var(--muted); margin-top: 4px; }

    /* Lightbox Modal */
    .lightbox-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 20px;
    }
    .lightbox-modal.active { display: flex; }
    .lightbox-img {
      max-width: 90vw;
      max-height: 80vh;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .lightbox-caption {
      color: #fff;
      margin-top: 14px;
      font-size: 14px;
      text-align: center;
      max-width: 600px;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 24px;
      color: #fff;
      font-size: 32px;
      cursor: pointer;
    }

    /* Footer Keepsake Note */
    .keepsake-footer {
      text-align: center;
      padding: 60px 20px 40px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 80px;
    }

    /* Cover Photograph & Audio Player Styling */
    .hero-cover-wrapper {
      margin: 24px auto;
      max-width: 480px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border);
    }
    .hero-cover-img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      display: block;
    }
    .offline-music-widget {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
    .music-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 9999px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .music-toggle-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }
    .music-toggle-btn.playing {
      background: var(--primary);
      color: #fff;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <!-- Offline Notice Bar -->
  <div class="offline-banner">
    <span>💎 Standalone Offline Keepsake</span>
    <span>•</span>
    <span>Saved with love for <strong>${recipientName}</strong></span>
    <span>•</span>
    <span>No internet needed</span>
  </div>

  <div class="container">
    <!-- Hero / Welcome -->
    <header class="hero-section">
      <span class="badge">A Gift For You</span>
      <span class="recipient-salutation">Dear ${recipientName},</span>
      <h1 class="hero-title">${welcomeHeading}</h1>
      <p class="hero-message">${welcomeMessage}</p>

      ${gift.cover_image ? `
        <div class="hero-cover-wrapper">
          <img src="${escapeHtml(gift.cover_image)}" alt="Keepsake Cover" class="hero-cover-img" />
        </div>
      ` : ''}

      ${gift.music_url ? `
        <div class="offline-music-widget">
          <audio id="offline-audio" loop src="${escapeHtml(gift.music_url)}"></audio>
          <button id="music-toggle-btn" class="music-toggle-btn" onclick="toggleOfflineMusic()">
            <span id="music-icon">🎵</span> <span id="music-text">Play Background Music</span>
          </button>
        </div>
      ` : ''}

      <button class="btn-journey" onclick="document.getElementById('journey-start').scrollIntoView({ behavior: 'smooth' })">
        <span>✨ Explore Your Gift</span>
      </button>
    </header>

    <div id="journey-start"></div>

    <!-- Interactive Surprise Box -->
    <section class="section-block">
      <div class="section-header">
        <span class="section-subtitle">Surprise Reveal</span>
        <h2 class="section-title">Tap the Gift Box</h2>
      </div>
      <div class="gift-box-interactive">
        <div class="gift-box-icon" onclick="toggleGiftBox()">🎁</div>
        <p style="font-size: 12px; color: var(--muted); margin-top: 8px;">Tap to unwrap</p>
        <div id="gift-reveal" class="gift-message-reveal">
          <p>"${giftBoxMessage}"</p>
        </div>
      </div>
    </section>

    <!-- Memory Wall & Photos -->
    ${memories.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Memory Wall</span>
          <h2 class="section-title">Moments We Treasure</h2>
        </div>
        <div class="memories-grid">
          ${memoriesHtml}
        </div>
      </section>
    ` : ''}

    <!-- Timeline of Memories -->
    ${timeline.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Journey Milestones</span>
          <h2 class="section-title">Our Timeline</h2>
        </div>
        <div class="timeline-container">
          ${timelineHtml}
        </div>
      </section>
    ` : ''}

    <!-- Scratch Card Experience -->
    <section class="section-block">
      <div class="section-header">
        <span class="section-subtitle">A Playful Mystery</span>
        <h2 class="section-title">Golden Scratch Card</h2>
      </div>
      <div class="scratch-container" onclick="this.classList.add('scratched')">
        <div class="scratch-cover">
          <span>✨ Click to scratch and reveal your secret note ✨</span>
        </div>
        <div class="scratch-hidden-content">
          <p style="color: ${scratchPalette.textColor};">&ldquo;${scratchMessage}&rdquo;</p>
        </div>
      </div>
    </section>

    <!-- Interactive Quiz -->
    ${quiz.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Shared Trivia</span>
          <h2 class="section-title">How Well Do You Remember?</h2>
        </div>
        ${quizHtml}
      </section>
    ` : ''}

    <!-- Heartfelt Letters -->
    ${letters.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Personal Letter</span>
          <h2 class="section-title">Words From the Heart</h2>
        </div>
        ${lettersHtml}
      </section>
    ` : ''}

    <!-- Secret Notes -->
    ${secrets.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Hidden Treasures</span>
          <h2 class="section-title">Secret Notes</h2>
        </div>
        ${secretsHtml}
      </section>
    ` : ''}

    <!-- Wishes -->
    ${wishes.length > 0 ? `
      <section class="section-block">
        <div class="section-header">
          <span class="section-subtitle">Hopes & Dreams</span>
          <h2 class="section-title">Wishes For Your Days Ahead</h2>
        </div>
        ${wishesHtml}
      </section>
    ` : ''}

    <!-- Closing Note -->
    <section class="section-block" style="text-align: center;">
      <span class="section-subtitle">Closing Words</span>
      <h2 class="section-title" style="margin-bottom: 16px;">Forever Treasured</h2>
      <p style="font-size: 15px; color: var(--muted); max-width: 600px; margin: 0 auto;">
        ${closingMessage}
      </p>
    </section>

    <!-- Keepsake Footer -->
    <footer class="keepsake-footer">
      <p>Dear You • Permanent Personal Keepsake for ${recipientName}</p>
      <p style="margin-top: 4px; opacity: 0.7;">This standalone offline file was generated on ${new Date().toLocaleDateString()} and will remain accessible on your device forever.</p>
    </footer>
  </div>

  <!-- Photo Lightbox Modal -->
  <div id="lightbox" class="lightbox-modal" onclick="closeLightbox()">
    <span class="lightbox-close">&times;</span>
    <img id="lightbox-img" class="lightbox-img" src="" alt="" />
    <p id="lightbox-caption" class="lightbox-caption"></p>
  </div>

  <script>
    function toggleGiftBox() {
      const el = document.getElementById('gift-reveal');
      if (el.style.display === 'block') {
        el.style.display = 'none';
      } else {
        el.style.display = 'block';
      }
    }

    function handleQuizAnswer(btn, isCorrect) {
      const parent = btn.parentElement;
      const buttons = parent.querySelectorAll('.quiz-opt');
      buttons.forEach(b => b.classList.remove('correct', 'incorrect'));
      if (isCorrect) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('incorrect');
      }
    }

    function openLightbox(src, caption, date) {
      const modal = document.getElementById('lightbox');
      const img = document.getElementById('lightbox-img');
      const cap = document.getElementById('lightbox-caption');
      img.src = src;
      cap.innerText = caption + (date ? ' (' + date + ')' : '');
      modal.classList.add('active');
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
    }

    function toggleOfflineMusic() {
      const audio = document.getElementById('offline-audio');
      const btn = document.getElementById('music-toggle-btn');
      const icon = document.getElementById('music-icon');
      const text = document.getElementById('music-text');
      if (!audio) return;

      if (audio.paused) {
        audio.play().then(function() {
          btn.classList.add('playing');
          if (icon) icon.innerText = '⏸';
          if (text) text.innerText = 'Pause Music';
        }).catch(function(err) {
          console.warn('Playback error:', err);
        });
      } else {
        audio.pause();
        btn.classList.remove('playing');
        if (icon) icon.innerText = '🎵';
        if (text) text.innerText = 'Play Background Music';
      }
    }
  </script>
</body>
</html>
`;
}
