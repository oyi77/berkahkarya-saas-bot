# Bot Operator Chat Interference — Spec

## Feature Summary
Admin can intercept a specific user's next video/image generation and substitute a manually-prepared media file instead of the AI pipeline result. Purpose: marketing gimmicks, custom demos, curated content delivery.

## Functional Requirements

### Interception Lifecycle
1. Admin creates an interception targeting a specific user (by Telegram ID or internal user ID)
2. Admin provides a media URL (video or image) + optional caption override
3. Interception is stored as "pending" — waits for that user's next generation
4. When the targeted user triggers a generation (any `/create` flow), the worker detects the interception
5. Worker skips all provider calls, uses admin's media URL directly
6. Interception is marked "used" after delivery; user sees result as normal
7. Admin can cancel a pending interception before it fires

### Data Model: BotInterception
```
id            Int           PK autoincrement
userId        Int           FK → User.id (target user)
mediaUrl      String        URL of custom video or image
mediaType     String        "video" | "image"
caption       String?       Optional custom caption (overrides default)
status        String        "pending" | "used" | "cancelled"
createdAt     DateTime      
usedAt        DateTime?     When it fired
createdBy     String        "admin" (for audit)
note          String?       Admin note (internal, not shown to user)
```

### Admin API Endpoints
- `GET /api/interceptions` — list all (filter by status, userId)
- `POST /api/interceptions` — create new interception
- `DELETE /api/interceptions/:id` — cancel a pending interception

### Worker Integration
In `src/workers/video-generation.worker.ts`, at the top of job processing:
1. Query `BotInterception` where userId = job.userId AND status = "pending"
2. If found: skip provider pipeline, use mediaUrl as the result
3. Mark interception as "used", set usedAt
4. Deliver media to user via sendVideoToUser / sendPhotoToUser

### Admin Dashboard UI
New page: `/admin/interceptions`
- Table of all interceptions with status badges
- "Create Interception" form: user picker, media URL, media type, caption, note
- Cancel button for pending interceptions
- Link from sidebar

## Non-Goals
- No file upload to server (admin provides URL to externally hosted media)
- No per-message interception (only fires on next generation trigger)
- No multi-interception queue per user (one pending at a time per user)
