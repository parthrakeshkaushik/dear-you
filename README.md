# Dear You

**One platform. Unlimited gifts. Every gift tells a different story.**

Dear You is a personalised digital gifting platform created to transform heartfelt moments into lasting, interactive online experiences. Designed for birthdays, anniversaries, milestone celebrations, and quiet tokens of gratitude, Dear You allows creators to craft, design, password-protect, and share bespoke digital surprises that feel deeply personal and emotionally resonant.

---

## About the Project

Traditional greetings—whether paper cards or fleeting text messages—often struggle to capture the full depth of personal relationships. Dear You reimagines digital celebration by turning wishes, memories, and personal stories into an immersive visual sanctuary.

Every gift created on Dear You is an independent micro-world. Creators can weave together heartfelt written letters, interactive virtual gift boxes, candle-blowing celebrations, curated photo memories, milestone timelines, and ambient music. The platform bridges distance with thoughtful interactivity, ensuring that every recipient experiences something created specifically for them.

---

## Key Features

- **Personalised Digital Gifts**: Independent gifts uniquely configured with their own narrative flow, interactive modules, access controls, and visual atmosphere.
- **Multiple Visual Themes**: Seven distinct aesthetic presets—*Dreamy & Starlight*, *Champagne & Gold*, *Scrapbook & Kraft*, *Celebration & Birthday*, *Soft Pastel*, *Minimal & Modern*, and custom creator-defined palettes.
- **Interactive Gift Reveal**: Tap-to-unwrap 3D animated virtual gift box with ribbon untie physics and celebratory confetti bursts.
- **Live Creator Preview**: Real-time split-screen studio workspace on desktop (42% form editor / 58% live synchronized preview) and a persistent mobile drawer allowing instant visualization across desktop, tablet, and mobile viewports.
- **Integrated Background Music**: Background melodies that begin naturally when the recipient taps **"Start Your Journey"**, respecting browser audio policies with persistent, elegant playback controls.
- **Memory Wall with Decorative Frames**: Hanging photo wall with physics-inspired gentle sway, realistic pushpins, and seven frame styles (*Polaroid*, *Vintage Wood*, *Modern Minimal*, *Golden Luxury*, *Pastel Elegance*, *Scrapbook Craft*, and *Theme Custom*).
- **Interactive Memories Gallery & Lightbox**: Responsive photo gallery paired with an accessible, full-screen lightbox modal featuring smooth swipe and keyboard navigation that restores the viewer's exact scroll and frame position.
- **Chronological Memory Timeline**: Storytelling milestone cards complete with dates, captions, and photographs.
- **Candle-Blowing Cake Celebration**: Animated virtual birthday cake with flickering candles that can be blown out with a tap, releasing particle bursts.
- **Interactive Friendship Quiz**: Multi-question trivia challenge with instant answer feedback and celebratory score summaries.
- **Golden Scratch Card**: Interactive HTML5 scratch canvas with an accessible instant-reveal option.
- **Secret Messages & Future Wishes**: Tap-to-unseal private notes and a step-by-step blessing card carousel.
- **Heartfelt Letters**: Rich typography letterhead with cursive signatures and elegant layouts.
- **Password-Protected Gifts**: Recipient access secured with Bcrypt password hashing, sliding-window rate limiting, and encrypted session cookies.
- **Gift Expiry & Graceful Closing**: Server-enforced expiration with automated redaction of private content and a warm farewell closing screen.
- **Dedicated Creator and Developer Consoles**: Separate dashboards for gift creators and authorized platform developers with role-based access control, analytics, and audit logging.
- **Mobile-First Responsiveness**: Designed and tested across screen viewports from 360px smartphones up to large 4K displays.

---

## How Dear You Works

1. **Create & Personalise**: A creator signs into the Creator Studio and designs a new gift—selecting an aesthetic theme, writing personal letters, and choosing interactive modules.
2. **Add Memories & Media**: The creator uploads meaningful photographs, configures decorative frame styles on the Memory Wall, and selects an ambient soundtrack.
3. **Live Preview**: The creator inspects how the gift will look and feel on desktop, tablet, and mobile devices in real time.
4. **Publish & Share**: The creator sets an optional password and expiry date, publishes the gift, and receives a unique, private URL.
5. **The Recipient Experience**: The recipient opens their special link, enters the secret passphrase, and taps **"Start Your Journey"** to begin their personalized digital experience.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Server Components & Route Handlers)
- **Frontend Library**: [React 18](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org) (Strict type verification)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom design tokens
- **Animations**: [Framer Motion](https://www.framer.com/motion) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Icons**: [Lucide React](https://lucide.dev)
- **Database & Authentication**: [Supabase](https://supabase.com) (PostgreSQL with Row Level Security & Supabase Auth)
- **Media Storage**: Supabase Storage (Private storage buckets with authenticated access policies)
- **Security & Cryptography**: [Bcrypt.js](https://www.npmjs.com/package/bcryptjs) & [Jose](https://github.com/panva/jose) (HMAC-SHA256 session tokens)
- **Deployment & Hosting**: [Vercel](https://vercel.com)

---

## Design Philosophy

- **Mobile-First by Design**: Built from the ground up to ensure seamless, thumb-friendly interaction on mobile devices before scaling gracefully to desktop screens.
- **Emotional Storytelling**: Interfaces designed with warmth, delicate typography, warm ivory and soft violet tones, and restrained animations that feel human and meaningful.
- **Autonomous Gift Aesthetics**: The administrative platform maintains a minimal, unobtrusive identity, allowing each individual gift to inhabit its own bespoke visual universe.
- **Performance & Accessibility**: Respect for reduced motion, responsive image optimization, high-contrast readability, and keyboard navigation.

---

## Project Vision

Dear You aims to be the definitive platform for thoughtful digital celebration. As communication increasingly moves into brief, ephemeral channels, Dear You provides a dedicated canvas for intentionality—a place where people can preserve memories, express heartfelt appreciation, and create digital gifts that recipients will revisit and treasure for years to come.

---

## Project Status

- **Status**: Production-ready (v1.0)
- **Current Capabilities**: Core gifting engine, Live Creator Preview, Memory Wall, 10 interactive modules, integrated music experience, Developer Console, and Supabase integration are active and deployed.
- **Development**: Actively maintained and continuously enhanced based on user feedback and real-world gifting stories.

---

## Acknowledgement

Dear You is dedicated to everyone who believes that words matter, memories are worth keeping, and every person deserves a little something special.
