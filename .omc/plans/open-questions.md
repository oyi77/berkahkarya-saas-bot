# Open Questions

## Medium Gaps Batch 2 - 2026-04-03
- [ ] M1 pagination: Should we use cursor-based or offset-based pagination for user videos? Cursor is more performant but offset is simpler and matches admin pattern — Plan recommends cursor for user-facing (better UX with append), offset for admin (simpler, page numbers useful)
- [ ] H2 Edit Profile: Should language change in web app also update the bot session language, or are they independent? — Matters for consistency across Telegram bot and web app experiences
- [ ] H3 Fingerprint: Is there a target date for the actual Fingerprint feature? If soon, the preview message content should hint at timeline — Affects copy in the preview message
- [ ] L1 robots.txt/sitemap: Deferred — needs SEO strategy discussion before implementing (which pages to index, noindex admin routes, etc.)
- [ ] M4 i18n: Deferred — full i18n refactor of app.ejs requires deciding on client-side vs server-side translation approach for the web app

## Persona Segmentation - 2026-04-06
- [ ] Should `content_creator` include `quick` preset or only `standard` + `extended`? — Affects default UX for majority of users (content_creator is the default persona)
- [ ] Should the onboarding persona picker show persona descriptions (1-line) or just name+emoji? — Trade-off between information and onboarding speed
- [ ] For returning users with `userMode = null`, should the persona suggestion prompt appear on every `/start` until selected, or only once? — Balance between adoption rate and annoyance
- [ ] Should `movie_director` persona lock to 16:9 aspect ratio, or allow 9:16 for vertical short films? — Affects platform selection step in generate flow
- [ ] Persona-specific prompt templates (different tone/style per persona) — deferred to follow-up task, but should the config schema reserve a `promptStyle` field now?
- [ ] Should the 3 new niches (cinematic, anime, music_video) be seeded into DB `PricingConfig` automatically, or only added to static config? — Affects whether admin sees them immediately in dashboard
