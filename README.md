# Dear You — Mobile-First Digital Gifting Platform

> *"Every person deserves a little something special."*

**Dear You** is a production-ready, mobile-first personalized digital gifting platform. Designed for birthdays, anniversaries, friendship milestones, and appreciation celebrations, Dear You allows creators to design, theme, password-protect, manage, and deliver unforgettable digital experiences through unique URLs.

---

## 🌟 Key Features

### 1. Two Separate, Harmonious Experiences
- **Creator / Administrator Suite (`/admin/*`)**: Private dashboard to create, manage, preview, duplicate, archive, and publish digital gifts. Includes a guided 10-step wizard.
- **Recipient Experience (`/g/[slug]`)**: Immersive, emotional micro-site gated by gift-specific passwords, responsive from 360px mobile to 4K displays.

### 2. Independent Per-Gift Theme Engine
Every gift has its own aesthetic universe defined via CSS design tokens:
1. **Dreamy & Magical:** Lavender, starlight, moon, glowing aura (`#0D0B18`, `#9D85C5`).
2. **Elegant & Premium:** High-contrast champagne gold, black, warm ivory (`#0C0A09`, `#D4AF37`).
3. **Memories & Scrapbook:** Polaroid tilts, kraft paper, sepia tones, handwritten typography (`#F7F3EB`, `#8C6551`).
4. **Celebration & Birthday:** Festive confetti, birthday cake candles, vibrant coral & gold (`#FFFAF5`, `#FF4D6D`).
5. **Soft Pastel:** Blush pink, peach mist, gentle rounded cards (`#FFF6F7`, `#E07A5F`).
6. **Minimal & Modern:** Clean typography, generous whitespace, slate monochrome (`#F8F9FA`, `#111827`).
7. **Custom Theme:** Administrator configured primary, secondary, background, accent colors, and typography.

### 3. Ten Interactive Feature Modules
- 🎁 **Virtual Gift Box:** Tap-to-unwrap 3D animated box with ribbon untie and confetti burst.
- 🎂 **Virtual Birthday Cake:** Animated cake with flickering candle flames blowable via touch or button, triggering celebratory particle bursts.
- 📷 **Memories Gallery:** Responsive grid/masonry with organic tilt and fullscreen lightbox modal.
- ⏳ **Memory Timeline:** Chronological story milestones with dates, narratives, and images.
- ❓ **Memory / Friendship Quiz:** Interactive trivia challenge with real-time feedback and score calculation.
- ✨ **Golden Scratch Card:** HTML5 Canvas surface scratchable via touch or mouse with an accessible instant reveal button.
- 🔒 **Secret Messages:** Tap-to-unseal confidential notes and quiet appreciations.
- ⭐ **Future Wishes Carousel:** Step-by-step blessing cards for the journey ahead.
- 💌 **Personal Letter:** Rich typography letterhead with cursive signatures and multi-paragraph layout.
- 🎵 **Music Player Bar:** Floating audio bar with playback and volume controls (no forced autoplay).

### 4. First-Class Expiry Experience
- Server-enforced UTC timestamp verification (defaulting to `Asia/Kolkata` display).
- Once expired, sensitive content (letters, gallery, secrets) is **strictly redacted** and not served over APIs.
- The recipient sees a graceful, theme-matching farewell closing screen with custom administrator notes.
- Administrator can extend, republish, or edit expired gifts at any time.

---

## 🛡️ Security Architecture

1. **Authentication:** Supabase Auth for administrators. No public self-registration.
2. **Password Gating:** Recipient passwords hashed using **Bcrypt** with 10 salt rounds. Never stored or returned in plaintext.
3. **Session Management:** HMAC-SHA256 signed `HttpOnly`, `Secure`, `SameSite=Lax` cookies issued upon password verification.
4. **Brute-Force Rate Limiting:** Sliding window limiter (maximum 5 attempts per 15-minute window per IP/slug).
5. **Database Row Level Security (RLS):** Strict owner isolation for admin actions; public reads restricted to published metadata.

---

## 📁 Project Architecture

```
src/
├── app/
│   ├── page.tsx                      # Minimal platform landing page
│   ├── login/                        # Admin authentication portal
│   ├── admin/                        # Admin Suite
│   │   ├── page.tsx                  # Dashboard overview & metrics
│   │   ├── gifts/page.tsx            # Gift management table & actions
│   │   ├── create/page.tsx           # Guided 10-step gift builder
│   │   ├── themes/page.tsx           # Theme design tokens explorer
│   │   └── settings/page.tsx         # Platform preferences & security status
│   ├── g/[slug]/                     # Recipient experience route
│   │   ├── page.tsx                  # Public password-gated view
│   │   └── preview/page.tsx          # Admin preview mode (unlocked)
│   └── api/                          # Serverless Route Handlers
│       └── gifts/[slug]/
│           ├── verify-password/      # Password check & JWT session cookie
│           └── content/              # Protected content delivery
├── components/
│   └── recipient/                    # Reusable recipient experience components
├── config/
│   └── themes.ts                     # Theme presets & CSS variable generator
├── lib/
│   ├── auth/                         # Bcrypt & JWT session helpers
│   ├── expiry/                       # Server-side UTC expiry validator
│   ├── security/                     # Rate limiting sliding window
│   ├── supabase/                     # Supabase client & server instances
│   └── mock-data.ts                  # Sandbox demonstration data
├── types/                            # Strict TypeScript definitions
└── styles/
    └── globals.css                   # Custom styles, fonts, and scrollbars
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.19.0)
- npm or pnpm

### 2. Installation
```bash
git clone <repo-url>
cd "DEAR YOU"
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RECIPIENT_JWT_SECRET=your-random-32-character-secret-key-for-recipient-session
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup (Supabase)
Run the SQL migration located at `supabase/migrations/20261124000000_create_dear_you_schema.sql` in the Supabase SQL Editor. This initializes all tables, foreign keys, RLS policies, and storage bucket settings.

### 5. Running the Application
```bash
# Start development server
npm run dev

# Run automated test suite
node tests/run-tests.mjs

# Build for production
npm run build
```

---

## 🧪 Testing Summary

Dear You includes an automated testing suite verifying:
- ✅ **Expiry Logic:** Expiry boundaries, indefinite gifts, past dates.
- ✅ **Bcrypt Security:** Hash generation, correct password match, incorrect password rejection.
- ✅ **JWT Verification:** Signed session cookie validation.
- ✅ **Rate Limiting:** Threshold enforcement and blocking on 6th failed attempt.
- ✅ **Theme Tokens:** Palette consistency and CSS variable generators.

Run tests anytime with:
```bash
node tests/run-tests.mjs
```

---

## 🚢 Deployment (Vercel)

1. Push your repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set Environment Variables matching `.env.example`.
4. Deploy! Next.js App Router will optimize all routes and edge handlers automatically.

---

## 📄 License
Crafted with thought and care. Distributed under the MIT License.
