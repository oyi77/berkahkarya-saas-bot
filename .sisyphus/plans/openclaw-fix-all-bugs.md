# Fix all bugs and implement all features including affiliate system and P2P

## Overview

This plan outlines the work to:

1. Fix all lint errors (58 problems from ESLint)
2. Address pending items from STATUS.md
3. Investigate and fix additional bugs beyond STATUS.md
4. Implement P2P (user-to-user credit transfer) system with 0.5% fee and generous limits
5. Ensure all documented features are 100% implemented
6. Use TDD approach (write tests first, then implement)

## Task Dependency Graph

| Task ID | Task Description                     | Depends On     | Reason                             |
| ------- | ------------------------------------ | -------------- | ---------------------------------- |
| T1      | Fix lint errors                      | None           | Can be done independently          |
| T2      | Address STATUS.md pending items      | None           | Can be done independently          |
| T3      | Investigate additional bugs          | None           | Can be done independently          |
| T4      | Design P2P transfer system           | None           | Foundation for implementation      |
| T5      | Write P2P transfer unit tests        | T4             | Need design before writing tests   |
| T6      | Implement P2P transfer service layer | T5             | TDD: implement after failing tests |
| T7      | Implement P2P transfer API layer     | T6             | Need service layer first           |
| T8      | Write P2P transfer integration tests | T7             | Need implementation to test        |
| T9      | Verify feature completeness          | T1,T2,T3,T6,T7 | Need core fixes and P2P done       |
| T10     | Final verification and testing       | T9             | Last step before completion        |

## Parallel Execution Graph (Wave Structure)

### Wave 1: Independent Analysis Tasks (Can run in parallel)

- T1: Fix lint errors
- T2: Address STATUS.md pending items
- T3: Investigate additional bugs
- T4: Design P2P transfer system

### Wave 2: P2P Implementation (Sequential due to TDD)

- T5: Write P2P transfer unit tests
- T6: Implement P2P transfer service layer
- T7: Implement P2P transfer API layer
- T8: Write P2P transfer integration tests

### Wave 3: Verification Tasks (Can run in parallel after implementation)

- T9: Verify feature completeness
- T10: Final verification and testing

## Category + Skills Recommendations

| Task ID | Category         | Skills | Reasoning                                                            |
| ------- | ---------------- | ------ | -------------------------------------------------------------------- |
| T1      | quick            | []     | Simple ESLint fixes - single file edits                              |
| T2      | unspecified-high | []     | STATUS.md items vary in complexity, need investigation               |
| T3      | deep             | []     | Bug investigation requires deep analysis                             |
| T4      | ultrabrain       | []     | System design for P2P transfers requires complex logic               |
| T5      | deep             | []     | Writing comprehensive unit tests requires deep understanding         |
| T6      | deep             | []     | Implementing service layer with transactions requires deep knowledge |
| T7      | quick            | []     | API layer is relatively straightforward command handler              |
| T8      | deep             | []     | Integration tests require deep understanding of system interactions  |
| T9      | deep             | []     | Feature verification requires checking multiple systems              |
| T10     | deep             | []     | Final testing requires comprehensive system knowledge                |

## Actionable TODO List for Caller

```typescript
// Wave 1: Parallel execution (start all simultaneously)
todowrite({
  todos: [
    {
      content:
        "src/**: Fix all ESLint errors (58 problems) — expect zero lint errors",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "STATUS.md: Resolve Midtrans & Tripay live keys issue — expect keys verified or documented as blocked",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "STATUS.md: Fix referral komisi tracking DB connection — expect commissions properly recorded",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "STATUS.md: Implement custom prompt from user feature — expect users can input custom prompts",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "STATUS.md: Implement subscription auto-renewal — expect recurring payments work",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "STATUS.md: Change NODE_ENV to production when ready — expect env var updated",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "Investigate: Find and fix additional bugs beyond STATUS.md — expect no critical bugs remain",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "Design: Create P2P transfer system spec with 0.5% fee and generous limits — expect design document complete",
      status: "pending",
      priority: "high",
    },
  ],
});

// After Wave 1 completes, start Wave 2 sequentially
todowrite({
  todos: [
    {
      content:
        "Tests: Write P2P transfer unit tests (TDD first) — expect failing tests for transfer service",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "Service: Implement P2P transfer service layer — expect tests pass",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "API: Implement P2P transfer Telegram command (/send) — expect command responds correctly",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "Tests: Write P2P transfer integration tests — expect end-to-end transfer flow tested",
      status: "pending",
      priority: "high",
    },
  ],
});

// After Wave 2 completes, start Wave 3 in parallel
todowrite({
  todos: [
    {
      content:
        "Verify: Check all documented features from README and docs/ — expect all features working",
      status: "pending",
      priority: "high",
    },
    {
      content:
        "Final Test: Run full test suite and manual verification — expect zero failures",
      status: "pending",
      priority: "high",
    },
  ],
});
```

## QA Scenarios with Concrete Verification Steps

### T1: Fix lint errors

**QA Command**: `npx eslint src/ --max-warnings=0`
**Expected Result**: Zero errors reported
**Tools**: ESLint

### T2a: Midtrans & Tripay live keys

**QA Steps**:

1. Check `.env` or config for MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, TRIPAY_API_KEY
2. Verify keys are not sandbox/test keys
3. If missing, document requirement in STATUS.md
   **Expected Result**: Either live keys configured or clear documentation of missing keys
   **Tools**: File inspection, env var check

### T2b: Referral komisi tracking

**QA Steps**:

1. Create test user with referral code
2. Have another user signup with that code
3. Process a payment for the new user
4. Check Commission table for correct records
   **Expected Result**: Commission record created with 15% Tier 1, 5% Tier 2 (if applicable)
   **Tools**: Prisma Studio, manual testing, SQL queries

### T2c: Custom prompt from user

**QA Steps**:

1. Start video generation flow
2. Look for option to input custom prompt
3. Verify prompt is used in video generation
   **Expected Result**: User can input and save custom prompt that affects video output
   **Tools**: Manual testing, UI verification

### T2d: Subscription auto-renewal

**QA Steps**:

1. User upgrades to subscription tier
2. Verify subscription record created with end date
3. Simulate end of period
4. Verify automatic renewal attempt
   **Expected Result**: System attempts renewal payment before expiration
   **Tools**: Database inspection, time simulation, payment mocks

### T2e: NODE_ENV to production

**QA Steps**:

1. Check `.env` or process.env.NODE_ENV
2. Verify value is "production"
   **Expected Result**: NODE_ENV=production
   **Tools**: Env var inspection

### T3: Investigate additional bugs

**QA Steps**:

1. Run full test suite: `npm test`
2. Check application logs for errors
3. Test critical user flows manually
   **Expected Result**: No new critical bugs found beyond STATUS.md
   **Tools**: Jest, log inspection, manual testing

### T4: Design P2P transfer system

**QA Steps**:

1. Review design document
2. Verify includes: 0.5% fee, daily/monthly limits, transfer types, validation
   **Expected Result**: Complete technical design for P2P transfers
   **Tools**: Design review

### T5: Write P2P transfer unit tests

**QA Steps**:

1. Check test file exists: `tests/unit/services/user.service.transfer.test.ts`
2. Verify tests cover: success, insufficient funds, recipient not found, fee calculation, limits
3. Run tests: `npm test tests/unit/services/user.service.transfer.test.ts`
   **Expected Result**: Tests fail initially (TDD red phase)
   **Tools**: Test file inspection, Jest

### T6: Implement P2P transfer service layer

**QA Steps**:

1. Implement `UserService.transferCredits()` method
2. Run unit tests from T5
   **Expected Result**: All unit tests pass (TDD green phase)
   **Tools**: Code inspection, Jest

### T7: Implement P2P transfer API layer

**QA Steps**:

1. Implement `/send` command in Telegram bot
2. Test command responds correctly
3. Verify it calls service layer
   **Expected Result**: Command handles transfers with proper validation
   **Tools**: Manual testing, code inspection

### T8: Write P2P transfer integration tests

**QA Steps**:

1. Create integration test for full transfer flow
2. Test: sender balance, recipient credit, transaction records, fee handling
3. Run integration tests
   **Expected Result**: Integration tests pass
   **Tools**: Test file inspection, Jest

### T9: Verify feature completeness

**QA Steps**:

1. Check README Overview features:
   - [x] Generate video marketing dari foto produk
   - [x] Top-up kredit dengan multiple payment gateway
   - [x] Sistem referral & affiliate 2-tier
   - [ ] Dashboard analytics untuk tracking performa
   - [x] Multi-angle creative generation
   - [x] Direct publish ke social media
2. Verify missing features are implemented or have clear status
   **Expected Result**: All documented features working or properly documented
   **Tools**: Feature verification checklist

### T10: Final verification and testing

**QA Steps**:

1. Run full test suite: `npm test`
2. Run linter: `npm run lint`
3. Test key user flows manually:
   - Registration and referral
   - Credit top-up
   - Video generation
   - Referral commissions
   - P2P transfer (new feature)
   - Custom prompt (if implemented)
   - Subscription renewal (if implemented)
     **Expected Result**: Zero test failures, zero lint errors, all user flows work
     **Tools**: Jest, ESLint, manual testing

## Atomic Commit Strategy

Each completed wave should produce atomic commits:

### Wave 1 Commit Groups:

- `fix(eslint): resolve 58 ESLint errors across codebase`
- `fix(status): resolve Midtrans & Tripay live keys configuration`
- `fix(status): repair referral komisi tracking DB integration`
- `feat(user): implement custom prompt from user feature`
- `feat(subscription): implement auto-renewal for subscription tiers`
- `chore(env): update NODE_ENV to production`
- `fix(bugs): resolve additional bugs discovered during investigation`

### Wave 2 Commit Groups (TDD flow):

- `test(user): add unit tests for P2P transfer credits service`
- `feat(user): implement P2P transferCredits service layer`
- `feat(command): add /send Telegram command for P2P transfers`
- `test(integration): add end-to-end P2P transfer tests`

### Wave 3 Commit Groups:

- `chore(verify): confirm all documented features are implemented`
- `test: final test suite passes with zero failures`

## Open Questions / Decisions Needed

1. **P2P fee destination**: Should the 0.5% fee go to treasury (platform revenue) or be burned?
   - Recommendation: Treasury (platform revenue to sustain service)

2. **Transfer limits configuration**: Should limits be tier-based (higher limits for paying users)?
   - Recommendation: Start with flat generous limits, consider tiering later

3. **Custom prompt storage**: Should prompts be saved per user indefinitely or session-only?
   - Recommendation: Save per user for reuse, with option to update

4. **Subscription auto-renewal**: Which specific tiers support auto-renewal? How to handle failed payments?
   - Recommendation: All paid tiers, 3 retry attempts with notifications

5. **Midtrans/Tripay status**: Are live keys available now, or should this remain blocked?
   - Need user confirmation on key availability
