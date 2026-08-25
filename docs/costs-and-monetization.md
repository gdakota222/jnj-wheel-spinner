# Costs and Monetization

**Status:** Free today. Monetization is a possible future, with no model chosen.
**Last updated:** 2026-08-25
**Companion docs:** [intent.md](intent.md) · [stack.md](stack.md) · [prd.md](prd.md)

This document exists so that a decision to charge money later doesn't arrive as a surprise
rewrite. Nothing here commits the project to monetizing. It records **what is free, what would
cost money, and which of today's choices would become expensive to undo.**

---

## Today: everything is free

| Item | Cost | Notes |
|---|---|---|
| Node, npm, Vite, React, TypeScript, Vitest, vite-plugin-pwa | **$0** | Open source, permissive licenses. |
| Git | **$0** | |
| GitHub account + **public** repository | **$0** | |
| GitHub Pages hosting | **$0** | Free for public repos. Private repos need GitHub Pro (~$4/mo). |
| `username.github.io` address | **$0** | |
| Google Fonts | **$0** | |
| Backend / database / accounts | **$0** | There are none, by design. |

**Hosting stays free at any realistic scale.** GitHub Pages' free tier allows roughly 100 GB of
bandwidth a month and a 1 GB repository. An offline-first app for dance organizers — downloaded
once per device, then run from cache — will not approach either limit. Growth does not create a
hosting bill here.

---

## Future costs

Listed with **why** each would be incurred, so none is a surprise.

### Low cost, likely eventually

**Custom domain — ~$10–15/year.**
The moment the app should look like a product rather than a personal project, `jnjwheel.app` beats
`dakota.github.io/jnj-wheel-spinner`. Purely cosmetic, but cheap and immediately legitimizing.
Works with GitHub Pages at no additional hosting cost.

### Moderate cost, only if PWA install proves too awkward for others

**Apple Developer Program — $99/year, recurring.**
**Google Play Developer — $25, one time.**

Needed only to distribute through app stores rather than "Add to Home Screen." This becomes
tempting if other organizers find the PWA install flow confusing — which is a genuine risk, since
the install steps differ per browser and per OS.

**Roadblocks beyond the fees:**
- **A native wrapper is required** (Capacitor), plus its build tooling.
- **iOS builds need a Mac**, or a paid cloud-Mac / CI service.
- **Apple review risk.** A wrapped web app can be rejected under App Store guideline 4.2 for
  "minimum functionality" if it reads as just a website. A genuinely offline app with device
  integration usually passes, but rejection costs time and rework, not just money.
- Recurring $99/year continues whether or not the app earns anything.

### The expensive one: payments require architecture, not just money

**This is the part worth understanding now, because it is nearly free to plan for and expensive to
retrofit.**

The app currently has **no server, no accounts, and no network calls** — a stated permanent
non-goal in [intent.md](intent.md). Most ways of charging money break that:

| Model | Needs a backend? | Needs accounts? | Fees |
|---|---|---|---|
| Donation link (Ko-fi, GitHub Sponsors) | No | No | Platform ~0–5% |
| One-time app-store purchase | No | No (the store handles it) | 15–30% to Apple/Google |
| Paid deck packs, delivered in-app | **Yes** | **Yes** | Stripe ~2.9% + $0.30, or store cut |
| Subscription / "Pro" tier | **Yes** | **Yes** | Same, plus ongoing server cost |

The two paths that **preserve the current architecture** are a donation link and a one-time
app-store purchase. Everything else means building accounts, a licensing check, and a server —
which is not a feature but a change of what the product fundamentally is.

**Other costs that arrive with money changing hands:** a privacy policy and terms of service
(templates are free; a lawyer is not), and income tax on revenue.

---

## Possible monetization avenues

Sketched only. **No decision is being made, and none of this should influence v1.** Listed roughly
from least to most disruptive.

1. **Tip jar / donations.** A link out to Ko-fi or GitHub Sponsors. Zero architectural change, zero
   risk, low revenue. Compatible with everything, including staying open source.
2. **One-time paid app-store listing**, with the PWA staying free. The store handles payment and
   licensing, so **no backend is needed** — the only model that charges real money without breaking
   the no-server non-goal. Costs the $99/year and Apple's cut.
3. **Paid deck packs.** Fits the product's shape better than anything else: decks are already the
   content unit, already named, already shareable. Professionally-written prompt sets for other
   dance styles are a real thing someone might pay for. But delivering them requires payment
   handling and some notion of ownership — a backend.
4. **A "Pro" tier** gating features like sharing, multiple rosters, or the winner modes. Highest
   revenue potential and the worst fit: it would gut the free version of exactly the things that
   make the app useful to the organizers it was built for.
5. **Licensing to dance organizations or event series.** High touch, low volume, no infrastructure
   — closer to consulting than to a product.

**If monetization ever becomes real**, the sequencing that costs least is: donations first (no
change at all), then a paid store listing (no architecture change), and only then anything
requiring a backend — at which point [intent.md](intent.md)'s no-server non-goal must be
deliberately revisited, not quietly abandoned.

---

## Asset licensing — the one thing to get right now

**Decision: sloth-theme artwork and sound effects use free assets for v1.5, with the door left open
to commissioned or purchased art later.**

The trap is not cost. It is **licensing**, and it is easy to walk into:

- **CC0 / public domain** — usable for anything, including commercial products, forever. No
  attribution required.
- **CC-BY** — free, but **requires visible attribution**. Workable; needs a credits screen.
- **CC-BY-NC (non-commercial)** — free for a hobby project and **forbidden the moment the app earns
  money**. Every NC-licensed asset would have to be found and replaced.
- **"Free" stock sites with unclear terms** — the worst case, because the problem only surfaces
  when someone complains.

**The rule for this project: CC0 or equivalently permissive assets only.** Avoid NC-licensed art
and sound entirely, even though v1.5 is free and non-commercial today. Choosing CC0 now costs
nothing extra; choosing NC now and monetizing later means redoing the entire sloth theme.

**Where to source:** OpenGameArt (filter to CC0), Kenney.nl (CC0), freesound.org (filter to CC0),
Public Domain Vectors. Keep a credits/licensing file in the repo listing every asset and its
license, added to as assets are used — reconstructing that later is miserable.

**If paid art is wanted later:**
- Stock illustration: roughly **$10–50 per asset**.
- A commissioned illustrated sloth set from a freelancer: roughly **$150–800** depending on scope.
- Sound effect packs: roughly **$20–100**.
- **Roadblock:** commissioned work needs an explicit written license permitting commercial use. A
  freelancer delivering art without transferring or licensing those rights leaves the project in
  the same position as an NC asset. Agree this in writing before payment.

---

## Summary

- **v1.0 through v1.5 cost nothing**, and hosting stays free at realistic scale.
- The only near-term optional cost is a **custom domain**, ~$12/year.
- **Monetizing is possible and unplanned.** Two paths preserve the architecture (donations, a paid
  store listing); the rest require a backend and a deliberate reversal of a stated non-goal.
- **The one decision that matters today is asset licensing.** Use CC0-only art and sound in v1.5 so
  that a future commercial version never has to be re-illustrated.
