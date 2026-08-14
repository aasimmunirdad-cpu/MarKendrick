## Implemented (2026-08-11, round 6)
- AI-generated team headshots: 4 photorealistic Pakistani studio portraits (Ayesha Rahman F, Hassan Raza M, Sana Qureshi F, Daniyal Sheikh M) via Gemini Nano Banana (gemini-3.1-flash-image-preview), saved to /app/frontend/public/media/team/; About team grid renders photos with vermilion ring + grayscale→color hover. Marcus Wynne renamed to Hassan Raza everywhere (team, AUTHORS, 2 DB blog posts)
- Newsletter composer: admin Newsletter tab — pick any published article → "Send The Signal" emails it branded to all subscribers; send history log with delivered counts. Endpoints: POST /api/admin/newsletter/send, GET /api/admin/newsletter/log
- Multi-language: declined by user (English only)

## Verification (2026-08-11, round 6)
- Images: 4 generated (~600KB each), visually inspected — professional, consistent studio style
- curl: newsletter send 2/2 subscribers, log recorded; author rename applied to 2 posts
- Screenshots: About team grid (4 headshots render), admin Newsletter tab (6 send buttons + history)


## Implemented (2026-08-11, round 5)
- Chat widget: replaces plain WhatsApp bubble — panel with WhatsApp deep link (+923339395444), "Leave a message" inline form (POST /api/leads source=chat-widget), and booking shortcut
- Marketing Maturity Assessment: /maturity-quiz — 8 scored questions (2/1/0), grade A–F with verdict, weakest-3 pillars with fixes, emailed full report via /api/maturity-report (lead captured source=maturity-quiz + auto-subscribed + owner notified). Cross-linked from /quiz result + footer + sitemap
- Blog SEO boost: author pages (/insights/author/:slug with bios + article lists, AUTHORS data), byline author links, share buttons (X/LinkedIn/Facebook/copy-link), article reading-progress bar; Article JSON-LD already present
- Home showreel: cinematic full-bleed studio video section with staggered case-study metric chips (+212% / 3.4x / +61%) and team-photo poster fallback

## Verification (2026-08-11, round 5)
- curl: /api/maturity-report (202 emails, lead stored), sitemap includes new routes
- Screenshots: chat bubble → WhatsApp link (correct number) → message form → sent; maturity quiz 8 answers → grade C 9/16 → report emailed; showreel metrics render; article progress bar + share buttons + author link; author page (2 posts)


## Implemented (2026-08-11, round 4)
- GA4 wired (G-7VL4TCG1HL) consent-aware: loads only after "Accept All" on cookie banner; SPA route-change pageviews tracked
- Whitepaper CMS: admins upload PDF reports from dashboard (multipart upload → /app/backend/uploads → served at /api/uploads/), edit metadata, publish/unpublish, delete; public /whitepapers fully DB-driven now
- Testimonials module: CMS CRUD (quote, name, role, company, industry, metric, video_url) + editorial "Client Voices" section on Home; 3 fictional sample quotes seeded (Maira Siddiqui/Velora, Hamza Qureshi/NimbusPay, Rabia Chaudhry/Khaas) — replace with real quotes via CMS
- ROI calculator: /roi-calculator — revenue slider + marketing-share slider + 3 scenarios → animated monthly/annual gain, audit payback days, retainer ROI multiple; linked in footer
- Theme elevation: vermilion scroll-progress bar, animated stats band (19/13/6/24h), giant outline MARKENDRICK footer wordmark

## Verification (2026-08-11, round 4)
- curl: whitepapers DB list (3), admin PDF upload → serves 200 application/pdf → gate unlock on uploaded report → delete; testimonial create/update/delete
- Screenshots: GA4 loads after consent, progress bar, stats band, testimonials, footer wordmark, ROI calculator reacts (5.0→8.0 Lac), admin testimonials tab (3 rows), admin whitepapers tab + upload modal


# MarKendrick — PRD

## Original Problem Statement
Global marketing agency website (content + lead generation platform). Tagline: "Insights that Inform. Strategies that Perform." Bold, modern, SEO-optimized agency site positioning MarKendrick as a premium, insight-driven marketing partner — rooted in Lahore, serving globally. Full brief includes: 19 services with SEO pages, industries pages, blog CMS, case studies, gated whitepapers, location pages, testimonials, careers, FAQ, legal pages, multi-step lead form, Calendly-style booking, WhatsApp button, global search, dark mode, newsletter via Resend.

## User Choices (gathered 2026-08-08)
- Accent color: "Surprise me" → designer picked **Kinetic Vermilion #FF3B30** on Deep Obsidian #0A0A0A ("Swiss Brutalist" art direction)
- Blog/case studies: **custom admin CMS with login** (JWT auth); visitors need no login
- Content: realistic sample content (fictional clients/personas, no copyright issues) — user is a new startup
- Scope now: Phase 1 + Blog/Insights CMS + case studies
- Email: **Resend (Emergent-managed)** for contact + newsletter
- Awwwards-level motion: framer-motion reveals, lenis smooth scroll, kinetic masked hero, editorial marquee, parallax hero

## Architecture
- Frontend: React 19 + Tailwind + framer-motion + lenis + react-fast-marquee (@studio-freight → `lenis` pkg). Pages: Home, About (+team/careers), Services hub, 19 ServiceDetail pages, Work, CaseStudyDetail, Insights, PostDetail, Contact (multi-step), BookConsultation, 404, /admin/login, /admin (protected CMS)
- Backend: FastAPI + MongoDB (Motor). JWT auth (httpOnly cookies, bcrypt, brute-force lockout), posts CRUD, case-studies CRUD, leads, newsletter, bookings, search. Seeded admin + 6 posts + 3 case studies on startup
- Email: Emergent-managed Resend proxy (`integrations.emergentagent.com`), `from_name` = MarKendrick. Lead/booking → owner notification + visitor confirmation; newsletter → welcome email
- Design system: Syne (display) + DM Sans (body), obsidian/vermilion palette, grain overlay, dark default + light toggle, glassmorphic nav, Tetris grids

## Personas
- Global SMB/enterprise marketing leaders evaluating agencies
- Local Pakistani brands wanting world-class agency
- Researchers/students consuming thought leadership
- Agency admin (content editor)

## Implemented (2026-08-08)
- Kinetic hero with masked line-by-line reveal + parallax neural artwork + slow editorial marquee
- Numbered manifesto chapters (01–04), services Tetris grid, case study + insights teasers, CTA band
- Services hub with 3 groups × 19 services, each with unique SEO title/description/copy/deliverables
- Blog CMS: public Insights hub + article pages with related posts; admin CRUD with drafts/publish
- Case studies: 3 fictional-client studies with measurable results; admin CRUD
- Multi-step contact lead form (service → budget → timeline → details) with lead qualification data in CMS
- Calendly-style booking: service → weekday/slot picker → details → confirmation emails
- Newsletter signup (footer) with welcome email; subscribers list in CMS
- Global search overlay (Cmd/Ctrl+K) across services, posts, case studies
- WhatsApp floating button (placeholder number +92 321 4567890 — user must replace)
- Dark/light theme toggle (dark default), Lenis momentum scroll, page transitions, grain texture
- JWT admin auth with brute-force lockout; /admin dashboard tabs: Posts, Case Studies, Leads, Bookings, Subscribers
- Custom on-brand 404

## Verification (2026-08-08)
- curl: posts (6), case studies (3), search, login/me/logout, admin CRUD create/update/delete, 401 on unauth admin
- Emails: 202 Accepted to delivered@resend.dev (lead confirm, newsletter welcome, booking confirm). Owner notification to placeholder admin@markendrick.co returned 422 (placeholder domain — user must set real OWNER_EMAIL)
- Screenshots: home hero/manifesto/work sections, contact multi-step flow end-to-end (success state), admin login → dashboard → post editor modal

## Implemented (2026-08-08, round 2)
- Neural hero canvas: living particle network reacting to cursor (replaces static image)
- 13 industry playbook pages (/industries + /industries/:slug) with SEO copy; beauty/wellness folded into E-commerce & D2C + FMCG per user
- 6 location pages (/locations/:slug): Lahore, Pakistan, Middle East, UK, US, Europe
- FAQ page (11 user-supplied Q&As, duplicates merged) with accordion; Privacy/Terms/Cookie pages; GDPR cookie consent banner (Accept All / Essential Only, persisted)
- Owner inbox wired: hello@markendrick.com (lead + booking notifications, verified 202 Accepted); public contact email updated to hello@markendrick.com
- Studio video (user's team clip, H.264) on About page with team photo poster; hosted locally at /media/studio-session.mp4 (headless test browser lacks H.264 codecs — playback unverifiable in test env, poster fallback verified)
- Industries strip marquee on home; Industries nav link; search overlay now covers industries

## Verification (2026-08-08, round 2)
- curl: lead notification to hello@markendrick.com accepted (202); newsletter send accepted (one transient proxy 500, immediate retry OK)
- Screenshots: neural canvas present, cookie banner shows/dismisses/persists, 13 industry cards, industry detail, location pages, FAQ accordion (11 questions), privacy page, About video section with poster

## Implemented (2026-08-08, round 3)
- WhatsApp button wired to real number +92 333 93 95 444 (wa.me/923339395444)
- Gated whitepapers: /whitepapers with 3 real branded PDF reports (generated via reportlab; script /app/scripts/gen_whitepapers.py). Email gate → lead captured (source=whitepaper) + auto-subscribed + download link on-page and emailed; owner notified
- SEO infra: /api/sitemap.xml (61 URLs, static + dynamic posts/case studies), robots.txt (/admin disallow + sitemap ref), JSON-LD Organization in index.html, FAQPage schema on /faq, Article schema on posts
- Service quiz: /quiz — 4 questions → Diagnostic Audit recommendation + 3 priority services + industry playbook + booking CTA. Entry points: home CTA, services hub banner, footer

## Verification (2026-08-08, round 3)
- curl: whitepapers (3), download gate (unlock + lead + emails), sitemap (61 URLs), robots.txt, PDF serves (200 application/pdf)
- Screenshots: gate → unlock → download link; quiz flow → result with 3 matched services + industry link

## Backlog
- P1: GA4 + Search Console + Meta Pixel wiring, SSR/prerendering for full SEO crawlability
- P2: Testimonials with video, client logos carousel, live chat widget, ROI calculator
- P2: Whitepaper CMS (admin uploads reports — currently script-generated)
- P3: Podcast/video hub, marketing maturity assessment, client portal, multi-language (Urdu/Arabic)

## Credentials
See /app/memory/test_credentials.md — admin@markendrick.co / MarKendrick#2026 (test admin, offer reseed)
