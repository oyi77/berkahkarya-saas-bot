<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Service Unit Tests

Jest tests for business logic services. Test data access, transformations, and integrations with mocked dependencies.

## Purpose

Verify service layer behavior: user management, payment processing, video generation, subscriptions, gamification, and third-party integrations.

## Key Files

| File | Purpose |
|---|---|
| `user.service.test.ts` | User CRUD, credit mutations, language/timezone, referral tracking |
| `payment.service.test.ts` | Payment processing, status checking, credit allocation |
| `payment-settings.service.test.ts` | Payment gateway enable/disable, pricing CRUD, configuration |
| `subscription.service.test.ts` | Subscription creation, renewal, cancellation, plan enforcement |
| `referral.service.test.ts` | Referral link generation, reward calculation, claim processing |
| `video.service.test.ts` | Video CRUD, metadata storage, gallery queries, sharing |
| `video-generation.service.test.ts` | Job enqueuing, provider selection, retry logic, credit refunds |
| `circuit-breaker.service.test.ts` | Circuit breaker state machine, failure thresholds, recovery |
| `provider-router.service.test.ts` | 9-tier provider fallback, load balancing, error handling |
| `hpas-engine.test.ts` | HPAS preset building, custom configuration, scene generation |
| `prompt-engine.test.ts` | Prompt template rendering, variable substitution, validation |
| `scene-consistency.test.ts` | Visual consistency checks, image reference quality, aspect ratio handling |
| `audio-vo.test.ts` | Voice-over generation, language support, audio mixing |
| `gamification.service.test.ts` | Points, badges, leaderboards, milestone tracking |
| `campaign.service.test.ts` | Campaign creation, targeting, analytics, performance tracking |
| `tripay.service.test.ts` | Tripay payment gateway integration, webhook validation |
| `duitku.service.test.ts` | DuitKu payment gateway integration, balance checking |
| `nowpayments.service.test.ts` | NOWPayments crypto integration, invoice generation |
