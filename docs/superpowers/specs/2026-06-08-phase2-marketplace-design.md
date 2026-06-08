# Phase 2 — L2 Collab Marketplace (briefs → apply → escrow → rebook)

**Design spec — v1**
**Date:** 2026-06-08
**Owner:** Meet Patel
**Status:** Pre-implementation-plan (decisions locked)
**Parent:** venture plan (`~/.claude/plans/let-s-act-like-a-snazzy-sketch.md`) → Phase 2
**Builds on (shipped):** Phase 1 money-cockpit — deal ledger, `PaymentsProvider` seam, offer-agent, Supabase Auth, funnel events.

---

## 0. Goal

Turn the single-player money cockpit into **two-sided liquidity**: brands self-serve a brief, matching creators apply, the winner runs a deal whose funds sit in **PA-managed escrow** until delivery, and the brand can **rebook** with one click. This is the layer that proves the marketplace flywheel — the Series-A metric (monthly GMV growth + rebooking rate).

## 1. Locked decisions (founder)

| Decision | Choice | Consequence |
|---|---|---|
| Escrow/settlement | **PA-managed escrow** | Brand funds held by the licensed PA (Cashfree/RazorpayX Escrow), released on delivery confirmation. Real trust, **stays float-free**, no RBI license needed. |
| Brand side | **Full self-serve** | Brands sign up, post briefs, accept applicants, fund escrow, confirm delivery — no human in the loop. |
| Matching | **Brief broadcast → creators apply** | A brief is shown to matching creators; they opt in with a floor-aware quote. Brand picks from applicants. |

> **Honest note on the combo:** full self-serve + broadcast→apply is the most *scalable* shape but the most *cold-start-exposed* — an empty marketplace has no briefs for creators and no applicants for brands. Mitigation in §7: we still **seed demand manually** (post the first briefs ourselves) even though the UI is self-serve, until liquidity holds.

## 2. What changes from Phase 1

| | Phase 1 (shipped) | Phase 2 |
|---|---|---|
| Users | Creators only | **Creators + brands** (both Supabase Auth, distinct profile tables) |
| Deal origin | Creator logs an inbound offer | **Accepted application** on a posted brief (plus Phase 1 logging still works) |
| Settlement | Direct split payout | **Escrow: fund → deliver → confirm → release** |
| Demand | None in-app | **Briefs feed**: creators discover + apply |
| Trust | Get-paid only | Two-sided: escrow holds brand funds until delivery |

## 3. Architecture

Four new surfaces over the existing deal spine.

### 3a. Brand accounts (demand identity)
- `brands` table keyed to `auth.uid()` (mirrors `creators`): name, email, optional website. A user is a creator **or** a brand by which profile row exists; the auth helper resolves role.
- Brand auth reuses the existing Supabase Auth + bearer-token pattern ([src/lib/auth/server.ts](../../src/lib/auth/server.ts)).

### 3b. Briefs (the demand unit)
- `briefs`: brand_id, title, goal, budget_min, budget_max, currency, niche, region, deliverables (jsonb), status `open|closed|filled`, created_at.
- Brand posts a brief from the brand dashboard. KYB-gated before it can broadcast (§7).
- **Broadcast = a matched query**, not push infra in v1: creators see "open briefs for you" filtered by their niche/region and `budget_max >= their rate_floor`. (A `notifications` table is a later optimization.)

### 3c. Applications (creator opt-in)
- `applications`: brief_id, creator_id, quote_amount, currency, message, status `applied|accepted|declined|withdrawn`, created_at. Unique (brief_id, creator_id).
- Creator applies with a **floor-aware quote** — the existing **offer-agent** ([src/lib/ai/offer-agent.ts](../../src/lib/ai/offer-agent.ts)) drafts the quote + message against the brief budget and her floor, never below it.
- Brand reviews applicants on the brief; **accepting one creates a Deal** (reuse the `Deal` model + a new `acceptApplication` use-case mirroring `logDeal`), links `brief_id`/`application_id`/`brand_id`, sets brief → `filled`.

### 3d. PA-managed escrow (the rails)
Extend the `PaymentsProvider` seam — Roster still never holds float; the PA's escrow product does.
- New interface methods: `createEscrowFunding(deal)` → brand checkout to fund escrow; `releaseEscrow(deal)` → split release (creator full amount + Roster fee, via existing `computePayoutBreakdown`). Webhook gains escrow event types.
- **Deal escrow state machine** (new `escrow_status` column + reuse `status`):
  1. `accepted` — application accepted, deal created.
  2. brand funds escrow → webhook → `escrow_status = funded`.
  3. creator marks **delivered** → `status = delivered`.
  4. brand **confirms** → `releaseEscrow` → webhook → `status = paid`, `escrow_status = released` (reuse the **idempotent** `markDealPaid`).
  - Refund path: brand cancels before delivery → `escrow_status = refunded` (PA refund).

### 3e. Rebooking (the flywheel)
- From a past `paid` deal, the brand clicks **rebook** → creates a brief pre-targeted to that one creator (skips broadcast) or a direct offer. This is the cheaper-on-platform loop (parent moat #3).

## 4. Data model / migrations

- `0005_brands.sql` — `brands` (auth.uid() PK) + `auth.uid()` RLS.
- `0006_briefs_applications.sql` — `briefs`, `applications` with RLS: brand owns its briefs; creator sees `open` briefs that match + owns its applications; brand reads applications **on its own briefs**.
- `0007_deal_escrow.sql` — add `brief_id`, `application_id`, `brand_id`, `escrow_status`, `escrow_ref` to `deals`; index for brand-side and brief-side queries.

All RLS validated on a live project + advisors clean, per the Phase 1 discipline ([supabase/migrations/0002…](../../supabase/migrations/0002_media_kits_rls.sql)).

## 5. Reuse (don't rebuild)
- `Deal` / `DealRepository` / `markDealPaid` (idempotent) — escrow release settles through them.
- `PaymentsProvider` + `computePayoutBreakdown` — extend, don't replace.
- `offer-agent` — repurposed to draft the creator's application quote.
- Auth bearer-token helper + `createServiceClient()` (privileged writes); funnel `EventSink`.
- API/route + Zod-boundary + error-envelope patterns from the Phase 1 routes.

## 6. Build sequence (sub-projects, each shippable)
- **P2.1** Brand accounts + brand dashboard (signup, role resolution).
- **P2.2** Briefs: post (brand) + matched briefs feed (creator).
- **P2.3** Applications: creator applies (offer-agent quote) → brand accepts → Deal created.
- **P2.4** PA-managed escrow: extend `PaymentsProvider` (fund/release) + deal escrow state machine + fund/deliver/confirm UI + webhook escrow events.
- **P2.5** Rebooking: one-click re-invite of a past creator.
- **P2.6** Notifications + funnel metrics (brief_posted → applied → accepted → escrow_funded → delivered → released; report match rate, time-to-first-application, rebooking rate).

## 7. Risks specific to Phase 2

| Risk | Mitigation |
|---|---|
| **Two-sided cold-start** (self-serve + apply needs both sides present) | Seed demand manually — we post the first briefs even though the UI is self-serve; route them to the Phase 1 creator base. Don't open self-serve brand signup publicly until supply density holds. |
| **PA escrow integration + KYC/KYB** | Use the PA's escrow product (Cashfree/RazorpayX); **brand KYB + creator KYC** before escrow funding; treat compliance paperwork as a feature. |
| **Fake/abusive briefs** (self-serve brand fraud) | KYB-gate brief broadcast; optionally require **escrow funded before broadcast** for new brands; velocity limits; ledger-native anomaly detection. |
| **Floor erosion in a directory/apply model** | The agent never drafts a quote below the creator's floor; budgets shown as ranges; no public rate scraping. |
| **Brand–creator disintermediation after match** | Escrow + verified delivery + cheaper rebooking keep the deal on-platform. |
| **Messaging/content moderation** (brand↔creator) | Keep v1 comms minimal (structured proposal + accept/decline); defer free-form chat + its moderation obligations. |

## 8. Open follow-ups (later phases)
- Embedded finance: receivables advance against a **funded-escrow** deal (Phase 3) — escrow makes underwriting safe.
- Notifications infra (push/email) beyond the in-app matched feed.
- Deal-conditional partial releases / milestones.
- GCC corridor escrow (PA-CB) — Phase 4.

## 9. Definition of done (Phase 2 v1)
A brand can sign up, post a brief, receive applications from matched creators (each quoted at/above floor by the agent), accept one, **fund PA escrow**, have the creator mark delivered, **confirm and release** (creator paid in full + Roster fee booked, no float held), and **rebook** that creator — with the marketplace funnel metrics emitting end to end.
