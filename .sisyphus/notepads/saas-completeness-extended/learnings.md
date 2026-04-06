# T4: Terms of Service Page - Learnings

## Pattern Used

- Created `tos.ejs` with same CSS variables as `landing.ejs` for consistency
- Route added in `web.ts` after landing page route (line 79)
- Footer link added with `·` separator, consistent with existing footer links

## Key Decisions

1. **Indonesian content** - Primary language of app, all TOS content in Bahasa Indonesia
2. **14 sections** - Comprehensive coverage: definitions, service, payment, refund, user obligations, liability, proprietary rights, privacy, termination, changes, jurisdiction, contacts
3. **Same styling** - Reused all CSS variables from landing page (`--bg`, `--accent`, etc.)
4. **Responsive design** - Mobile-friendly with container max-width: 800px

## Gotchas

- Parallel execution: another agent also added /terms and /privacy routes - needed to verify and complete remaining work (footer link)
- Pre-existing test errors are NOT related to new code changes

## Files Modified

- `src/views/web/tos.ejs` - NEW (364 lines)
- `src/routes/web.ts` - Added GET /terms route (line 79-83)
- `src/views/web/landing.ejs` - Added footer link (line 1734)

## Evidence

Saved to `.sisyphus/evidence/task-4-tos-page.html`
