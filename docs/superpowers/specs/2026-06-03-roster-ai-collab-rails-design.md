# Roster — AI-Native Collab & Payments Rails for the Creator Long Tail

**Design spec — v1**
**Date:** 2026-06-03
**Owner:** Meet Patel
**Status:** Approved design, pre-implementation-plan

---

## 0. Decisions locked

| Decision | Choice | Rationale |
|---|---|---|
| Beachhead | India first, GCC↔India corridor second | 100M+ creators, 61% nano, cheapest cold-start; corridor adds ARPU + moat |
| Win mode | Category-defining + raise fast, AND AI-native category killer | Big narrative carried by a real agent-to-agent + rails moat |
| Entry wedge | A (creator agent) + B (brand agent) launched together, C (rails) layered underneath | Two-sided launch made survivable by AI removing cost-to-serve |
| Working name | Roster (lead candidate); Cast / CollabOS alternates; BrandOS retired to internal brand-side module | Two-sided neutral, creator-manager feel |

---

## 1. One-line definition

The AI-native operating and payments layer for the creator economy's long tail. Every woman creator gets an AI manager. Every SMB gets an AI campaign team. Both sides transact on rails Roster owns: escrow, compliant content checks, verified ROI, cross-border payout.

The pitch no incumbent can make: **AI made the bottom 90% of the market profitable to serve, and we own their money movement.**

---

## 2. Problem and market (validated by research)

- ~90% of Instagram creators are nano/micro. ~70% of brands now prefer them. Micro campaigns return 8–12:1 ROI vs 2–3:1 for mega.
- India: 100M+ creators, 61% nano, only 8–10% monetize. Creator economy ~$2.5B (2025) toward $5B+ (2027); influences $350–400B in spend toward $1T by 2030 (BCG).
- GCC: creator base grew 75% in two years to 263K. Fashion and beauty (women-led) the largest spend share. GCC influencer market ~$315.5M (2025) toward $771.6M (2032).
- Worst-served pains. Creators: no rate card, opaque pricing, payment delays (43% wait >30 days), discovery vacuum, safety. SMBs: fraud (41% of activity flagged fraudulent), vetting, contracting, usage rights, ROI measurement (68% of leaders cannot measure influencer ROI).

## 3. Thesis: why this wins where others failed

1. The long tail was unservable because brokering a $150 deal cost more than it returned. AI collapses cost-to-serve toward zero. The abandoned 90% becomes profitable to serve for the first time.
2. Tool companies (CreatorIQ, GRIN, Captiv8, #paid, Beacons, Linktree) stalled because they sat next to the money. Roster sits on it via escrow and payout from deal #1, earning fintech economics instead of seat economics.
3. The fast unicorns (Whop $1.6B, ShopMy $1.5B, LTK $2B, Agentio $340M AI-native) all sit on GMV at a 4–6% take with AI-native ops. Roster runs the same playbook on the long tail.
4. Regulatory and corridor complexity (UAE dual-licence, India ASCI/CCPA, Arabic-first content, UAE↔India payout) is a moat US incumbents will not cross.

## 4. Product architecture

### Layer 1 — Creator Agent (supply; single-player useful from minute one)
- Connects Instagram, builds a live media kit from real engagement data.
- Sets a data-backed rate card (kills the nano's core disadvantage).
- Screens inbound brand offers, filters off-values / unsafe approaches (real GCC women-creator need).
- Negotiates within a creator-set floor, runs the contract, secures payment.
- Worth using with zero brands present — this is how supply cold-starts cheaply.

### Layer 2 — Brand Agent (demand)
- SMB states goal, budget, brand guideline.
- Agent shortlists vetted creators (frame-level brand-fit + fraud screen), negotiates, briefs (shot list + disclosure baked in), QAs the draft against brand and legal rules pre-post, pays, returns verified ROI.
- Treats creator content as performance ad creative; follower count stops mattering, nano wins on craft.

### Layer 3 — The Rails (the business; layered as liquidity grows)
- Escrow: brand funds held, released on verified delivery. Solves the two-sided trust gap.
- Cross-border payout + FX for the UAE↔India corridor.
- Compliance engine: auto-enforces ASCI and UAE disclosure per jurisdiction (liability shield).
- Verified, API-sourced ROI attribution (lives only on-platform).
- Ad-account whitelisting / Partnership Ads brokerage.
- One-click rebooking: makes deal #2 cheaper on-platform than re-negotiating in DMs.

### The agent-to-agent endgame
Creator Agent (availability, style, rate floor) negotiates with Brand Agent (budget, brief, target ROAS). The two agents discover, match, negotiate, contract, escrow, brief, QA, confirm posting, attribute ROI, release payment. Humans approve only brand voice and money out.

## 5. Cold-start plan (A + B together)

1. **Supply via single-player value.** Free media-kit + rate-card tool, useful with zero brands. Seed tens of thousands of creators first.
2. **Demand via concierge.** For the first ~60 days we run campaigns ourselves for 10–20 D2C SMBs and small agencies, using our own agents behind the scenes. AI makes concierge cost near zero, which no prior marketplace could afford.
3. **Bridge is the agent.** Agent-mediated deals close on thin liquidity. Convert concierge to self-serve once rebooking rates prove the loop holds.

## 6. Business model

Free on matching and the creator agent. Monetize the rails on GMV.

- Transaction take: 4–6% blended of deal value via escrow.
- Payment + FX margin: 1–2% on the cross-border corridor.
- Brand "always-on" subscription for recurring campaigns.
- Ad-whitelisting fee per boosted partnership.
- Affiliate tracking cut (recurring commission flow).

Primary lever is transaction take so revenue rides GMV, not seats (avoids Stan's subscription ceiling). GMV is the lead metric.

**Directional model (to be pressure-tested):**

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Active creators | 50K | 300K | 1M+ |
| Paying brands | 2K | 15K | 60K |
| GMV | $5M | $50M | $300M |
| Net revenue | ~$0.4M | ~$4M | ~$25M+ |

Shape mirrors ShopMy (Series A→C in ~19 months on GMV). Valuation re-rates on GMV growth + GMV-per-headcount.

## 7. Moat stack (match is not the moat)

Proprietary nano rate-card dataset. Managed escrow lock-in. Ad-whitelisting brokerage. On-platform-only verified ROI. One-click rebooking that defeats leakage. Agent-to-agent network effects. Jurisdiction compliance engine as paid liability shield.

## 8. Go-to-market

- **India first:** women creators in fashion and beauty. Seed supply with the free media-kit tool + referral loop. Seed demand with concierge for D2C SMBs and small agencies. Prove ROI and rebooking.
- **GCC↔India corridor next:** UAE/Saudi brands paying Indian creators, plus GCC women creators. Higher ARPU, mandatory compliance, painful cross-border payout — where the rails are an unfair advantage and Finanshels / ZeroHuman provide distribution.

## 9. Fundraise narrative

Position: "Agentio for the long tail, plus the payment rails, India-first." Same AI-native story as Agentio ($340M post), plus GMV rails that command fintech multiples, opening the long tail Agentio cannot serve.

- Now: pre-seed/seed on thesis + concierge traction.
- Series A on: GMV run-rate, blended take rate, brand NRR >120%, creator rebooking rate.
- Next deliverable: the 10-part investor one-pager (Problems, Now, Solutions, Product, Value Prop, Market, Ask, Business Model, Traction, Team).

## 10. Risks and kills

| Risk | Kill |
|---|---|
| Long-tail monetization (the graveyard) | AI cost-to-serve + rails on the money + capture the head as creators graduate |
| Disintermediation / leakage | Escrow, ROI lock-in, whitelisting, cheaper on-platform rebooking |
| Instagram platform dependence | Official Meta Graph + Partnership Ads APIs, creator-authorized access, no scraping |
| Fraud | Our vetting agent turns the market's biggest fear into a feature |
| Payments / regulation | Never hold funds directly; licensed partners (Cashfree/RazorpayX IN, Checkout.com/Telr GCC) + escrow-as-a-service |
| Take-rate compression | Expand take by owning more of the transaction (payments, ads, affiliate), not by raising headline % |

## 11. Build sequence

- **Phase 0 (0–30d):** Free media-kit + rate-card tool live. Concierge: hand-run 10–20 deals end to end. Prove unit economics + ROI.
- **Phase 1 (30–90d):** Creator Agent + Brand Agent self-serve. Escrow + payout via partner. India only.
- **Phase 2 (90–180d):** Compliance-QA agent, verified ROI attribution, one-click rebooking, ad-whitelisting. GCC corridor opens.
- **Phase 3 (6–12mo):** Full agent-to-agent autonomy, affiliate tracking, head-creator graduation upsell. Series A.

Stack leans Next.js on Vercel + AI SDK for the agent layer, Meta Graph + Partnership Ads APIs, payment partners above. Detail lands in the implementation plan.

## 12. Open questions for the plan stage

- First sub-project to build: the Phase 0 free media-kit tool, or the concierge deal-ops console?
- Which payment partner to integrate first for India escrow (Cashfree vs RazorpayX).
- Meta API access path and approval timeline for insights + Partnership Ads.
- Final name + domain.

---

*Sources behind every market and funding claim are captured in the session research threads (market/competitive landscape, VC funding lens, wedge + GCC/India deep-dive).*
