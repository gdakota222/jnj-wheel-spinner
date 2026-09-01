# Build Tracker — v1.0

**Current version:** 0.10.0 — deployed and live
**Current phase:** Building ahead of the handoff rehearsal; 1.0.0 waits on that test, not on code
**Last updated:** 2026-08-31
**Companion docs:** [intent.md](intent.md) · [prd.md](prd.md) · [stack.md](stack.md) · [prompts.md](prompts.md)

---

## How this document works

This is the **living record of the build**. Three things live here, and each gets updated as
work happens:

1. **The version ladder** — the internal releases between nothing and v1.0 live, so progress is
   visible rather than a single long stretch of "in progress."
2. **The build log** — dated entries, newest first, recording what actually got done.
3. **The decision log** — every build decision **with its reasoning**, numbered so later entries
   can reference and supersede earlier ones.

**Update rule:** any time something ships, changes, or is decided, it gets an entry here in the
same sitting. A decision reversed later is not deleted — it is marked superseded, with the reason,
so the history of *why* stays intact.

---

## Status at a glance

| | |
|---|---|
| **Scope** | v1.0 — one complete session ([PRD § v1.0](prd.md)) |
| **Versions shipped** | 7 of 9 |
| **Blocked on** | Owner decisions on what ships in v1.0 (see the first-real-event entry) |
| **Next up** | 0.8.0 — Device rehearsal |
| **Live URL** | https://gdakota222.github.io/jnj-wheel-spinner/ |
| **Repository** | https://github.com/gdakota222/jnj-wheel-spinner |
| **First real event** | Ran 2026-08-26 — it worked; findings being triaged |

---

## The version ladder

Nine internal releases between here and a real event. Each is a **usable checkpoint**, not a
code drop — something that can be opened on the tablet and looked at.

| Version | Name | Contains | Status |
|---|---|---|---|
| **0.1.0** | Scaffold | Vite + React + TS project, PWA manifest and service worker, portrait layout, theme CSS variables, deployed to GitHub Pages, installs to home screen | ✅ Shipped 2026-08-25 |
| **0.2.0** | Roster | Add/remove dancers, Leader/Follower/Switch, unique-name validation, event-size guidance, roster saved to device | ✅ Shipped 2026-08-25 |
| **0.3.0** | The wheel | SVG wheel, spin animation, lands on a name, pool label (*Now spinning: Followers*), re-spin | ✅ Shipped 2026-08-25 |
| **0.4.0** | The loop | Two spins → couple reveal → dance hold → `Next Couple`, pools draining, short-pool recycling, session log, session complete | ✅ Shipped 2026-08-25 |
| **0.5.0** | Prompts | Built-in deck (read-only), prompt spin, name + description reveal, no-repeat within session, exhaustion message, prompts on/off toggle | ✅ Shipped 2026-08-25 |
| **0.6.0** | Persistence | Reducer serialization on every dispatch, resume after close/crash, tablet handoff verified | ✅ Shipped 2026-08-26 |
| **0.7.0** | Principles pass | Self-describing audit of every screen, label review, contrast and touch targets, no-color-alone check | ✅ Shipped 2026-08-26 |
| **0.8.0** | Device rehearsal | Real tablet install, full dry run with a fake roster, cast-to-TV check | ✅ Shipped 2026-08-26 |
| **0.9.x** | Event response | Everything the first real event asked for: undo, add mid-session, guarded re-spin, one no-scroll session screen, rewritten prompts, staged setup, About page | ✅ Shipped 2026-08-30 → 08-31 |
| **0.10.0** | An ending | Crown a winner: pick the couple, the curtain, hold to reveal, celebration. v1.2's headline, shipped early — see D-048 | ✅ Shipped 2026-08-31 |
| **1.0.0** | **Live** | Both event blockers closed and the app run by someone other than its author | ⏳ Waiting on the handoff rehearsal |

**Why 0.9.x exists and was not planned.** The ladder above was written before the app had ever
been in a room. The first real event produced a backlog large enough that shipping 1.0.0 on top of
it would have meant calling the app finished while the findings were still open. 0.9.x is that
backlog, worked through in order of what actually broke the night.

### Why this order
- **Deployment first (0.1.0), before any feature.** Getting a PWA built, served over HTTPS,
  installed to a home screen, and running offline is the **riskiest unknown in the whole project**
  and everything else depends on it. Discovering a service-worker or install problem after five
  features are built is far worse than discovering it against a blank page.
- **Roster before wheel (0.2.0 → 0.3.0)** because the wheel needs real names to render, and
  name-length edge cases (long names, "Sarah M 2") shape the wheel's text layout.
- **Loop before prompts (0.4.0 → 0.5.0)** because the pairing loop is the product; prompts reuse
  the wheel component the loop already proved.
- **Persistence after the loop (0.6.0)**, even though the reducer is designed for it from 0.4.0.
  Wiring storage before the state shape settles means migrating a schema that never had users.
- **Principles pass as its own version (0.7.0)** — not because the principles get ignored until
  then (they don't; they're honored as each screen is built), but because "a stranger can run this"
  needs one deliberate end-to-end review that no individual screen's construction can provide.
- **Rehearsal before live (0.8.0).** The first time this runs on the actual tablet must not be in
  front of a room.

---

## Build log

Newest first. Every entry dated.

### 2026-08-31 — 0.10.0: the night gets an ending
- **A winner can be crowned**, and the night finally finishes rather than just stopping. The
  operator picks a couple from the session's own list, brings down a curtain, and reveals when the
  room is ready. This is v1.2's headline feature arriving before 1.0.0 is declared — see D-048.
- **The curtain comes after the choice, not before it**, which answers both of v1.2's open
  questions at once. See D-047.
- **Crowning is offered, never owed.** It is one option on a finished session, and a night that
  ends with no winner is a complete night, not an incomplete one.
- **Only a couple that actually danced can win.** The crown is stored as a position in the session
  log, so it cannot disagree with the record. Crowning before everyone has danced is refused by the
  reducer, not just hidden by the screen.
- **Reversible everywhere.** The crown can be moved or taken back, Undo reaches it, and backing out
  of the curtain commits nothing. Replaying a reveal for the couple already crowned dispatches
  nothing, so Undo never offers a step that would appear to do nothing.
- **Curtain contrast measured by hand** and recorded in the audit script. The sweep walks straight
  past a gradient panel and lands on the page background, so it would have passed the curtain
  without ever looking at it: gold on the lightest fold is 3.61:1 (large text, needs 3:1), and the
  escape link was 4.63:1 — over the line but not by enough to survive the highlight stripes, so it
  is backed and now measures about 9:1.
- Session schema 6. 124 tests. Audited clean on the crowned session, the picker and the curtain.


### 2026-08-31 — Documentation sweep, and the dates were wrong
- **Corrected five build-log dates.** Everything from the first real event onward was dated around
  2026-09-08; git says those commits landed 2026-08-30 and 08-31. The log had drifted about nine
  days into the future. Git is the authoritative record of when a version shipped and the log now
  matches it.
- **The date of the event itself was wrong too, and was asked rather than guessed.** Three docs
  said it ran 2026-09-02, which was impossible: its findings were committed on 2026-08-30. The
  owner confirms **2026-08-26** — the same evening 0.8.x shipped, which is very likely how the
  drift started. Corrected everywhere. A fabricated date in the record would have been worse than
  a known gap in it.
- **Version ladder brought up to date.** 0.8.0 marked shipped, the unplanned 0.9.x series recorded
  with why it exists, and 1.0.0 marked as waiting on the handoff rehearsal rather than not started.
- **Both first-event blockers are closed** — B1 (no undo) by 0.9.0's undo stack, B2 (no way to add
  a late arrival) by mid-session add. Recorded here because the ladder previously implied 1.0.0 was
  blocked on them.
- **Second cold read, same colleague** (see rehearsal Round 3): the staged setup and the
  no-scrolling session screen both landed. One new finding — the About page reads as wordy — logged
  as a watch item rather than acted on, at the owner's direction.
- **The handoff rehearsal is scoped**: a dancer, on the owner's tablet, with a roster already
  loaded. That choice takes **roster transfer (F3) off the path to 1.0.0** — it stays a real
  finding from the event, but it is workflow convenience, not a blocker.


### 2026-08-31 — 0.9.5: an About page, and setup in three steps
- **An About page**, shown once on the first launch after installing and permanently under
  **About** on the title screen. Says who made the app, that nothing about an event leaves the
  device, and where to chip in. See D-045.
- **Donation links are unset and live in one file** (`src/support.ts`). Ko-fi is the intended
  destination; until the account exists the page says there is nothing to take yet rather than
  offering a dead button.
- **Setting up is three steps** — Dancers, How it runs, Start — with a pinned step bar and a
  pinned primary button, and a summary before anything is committed. This answers the cold-read
  finding from the first real event. See D-046.
- **Pinning the add form as well was tried and undone.** On a 375px phone the form and the counts
  come to 614px against the 577px the panel has, which left the list of names six pixels tall.
  Caught in the browser, not by the tests.
- **`.shell` is now `position: relative`.** `.visually-hidden` is absolutely positioned, so
  without an anchor its containing block is the page itself: the screen-reader labels buried down
  a long dancer list escaped the shell's `overflow: hidden` and stretched the document by 635px,
  which let the "pinned" header be scrolled away. The session screen carried the same latent bug
  and simply never overflowed far enough to show it.
- Audited clean — touch targets, accessible names and contrast — on title, About and all three
  setup steps, at phone and tablet size. 117 tests still passing.


### 2026-08-30 — 0.9.4: redraw actually spins, and bundles say where they are
- **Redrawing a challenge spins the wheel again** — it did not before. The wheel is unmounted while
  a couple dances, so a spin started from that screen remounted it *already at* the target angle and
  animated nothing. The wheel now animates from where it was, carried in state, however it got
  there. See D-044.
- **The replaced challenge comes off the wheel**, so a redraw visibly offers something else instead
  of passing over a segment it cannot land on. It returns to circulation when the couple is
  committed — it was never danced.
- **Prompt draws are now by id rather than by list position** (D-044). Aiming at one list and
  resolving against another is precisely what hung the wheel in 0.5.0, and filtering the redraw pool
  would have set that trap again.
- **The roster screen says which bundle is in play**, how many challenges are in it, and offers
  **Edit bundles** straight into the Prompt Bank — returning to the roster rather than the title.
- **The Prompt Bank leads with what is in use**: a banner, an **In use** badge on the bundle, and a
  clearer confirmation on the selected one.
- **"All prompts" is now "View all Prompts"** and can also be selected, drawing from every bundle at
  once — with a caution that it mixes the rewritten wording with the archived original and would
  make the comparison unreadable. Using **Use all** there now says plainly that all 40 are in play.


### 2026-08-30 — 0.9.3: the prompts rewritten, the originals archived
- **All 20 prompts rewritten** to invite rather than demand: *as many as you can* and *as little as
  you can* in place of *every* and *must*. The event proved the originals too strict —
  **Anchor Detective** demanded every anchor differ and was softened out loud mid-dance; it is now
  **Anchor Hunt**.
- **Guards only where a prompt is exploitable**, which was the owner's own rule. Three needed one:
  *Small World* (standing still is very small), *One Hand* (never connecting is not one-handed), and
  *Slow Motion* (stopping is not slow). Everything else left open.
- **Names shortened**, and this fixed a second complaint for free: a full 20-prompt wheel now shows
  **zero truncated names**, which is what the cold read disliked. The vertical reel is no longer
  urgent.
- **The original deck is archived, not deleted** — selectable in the Prompt Bank as *Westie Pack
  (original)*. Choosing a bundle sets what the next session draws from, so the rewrite can be tested
  against the original on real nights rather than taken on faith.
- **[prompts.md](prompts.md) created**: every deck in full, the three writing rules, a
  prompt-by-prompt account of what changed and why, and a deck history. Nothing is ever deleted
  from it.


### 2026-08-30 — 0.9.0 / 0.9.1 / 0.9.2: everything the first event asked for
Three versions in one sitting, all driven by [rehearsal.md § Round 2](rehearsal.md).

**0.9.0 — recovery.** Undo through anything, restoring session and roster together (D-037). Add a
dancer mid-session. Re-spin moved clear of the primary button and confirmed. A screen lock for
pocketing the device.

**0.9.1 — one screen.** The session no longer scrolls: only Undo and Lock keep a place beside the
wheel, everything else moved to a Tools sheet. The wheel is front and centre — the "tap to spin"
hint had been sitting beside it, knocking it off centre, and is now a one-time toast. The dance
hold drops the wheel entirely and gives the screen to the couple and the challenge. Tapping a
spinning wheel races it to its result rather than cutting there; double-tap still skips. Undo,
re-spin and redraw all confirm; Edit dancers gained a Role button.

**0.9.2 — the dance hold protects itself.** The lock overlay looked so much like the dance hold
that the two were indistinguishable, which is worse than useless on a cast screen. Advancing is now
a **press and hold**, so nothing there can be triggered by accident, and the lock is not offered on
that screen at all. See D-041.


### 2026-08-30 — First real event: it worked, and it produced a backlog
The app ran a real Jack & Jill on 2026-08-26. **The core loop did its job**, the cast to the TV drew
good reactions, and the birthday jamboree landed. Full findings in
[rehearsal.md § Round 2](rehearsal.md).

**Two things broke the night:**
- **A pocket press re-spun a follower mid-prompt**, wrecking the draw order. Repairing it via
  *Edit dancers* removed that follower from the session entirely, with **no way to undo and no way
  to put them back**. The night ended with an improvised second session.
- **Two dancers arrived who were not on the roster**, and could not be added mid-session.

**Two things the app got wrong about its own users:**
- **Almost everyone tapped the wheel rather than the Spin button** — dancers as well as the
  operator. The operator deliberately handed the device around so the *drawn follower* spun for
  their leader and the leader spun for the prompt, which is a better ritual than the one designed
  for, and makes the wheel the obvious control.
- **A non-dancer expected the spinning wheel to stop when tapped.**

**The prompts were too strict.** *Anchor Detective* was softened out loud mid-event. Wanted
throughout: creative-expression framing — *as many as you can*, *with as little as you can* — with
hard limits only where a prompt is exploitable.

**Also raised:** too much scrolling and a wish for tabs and staged setup; names cut off on the
challenge wheel and a suggestion of a vertical Price-is-Right reel; no way to move a roster between
phone and tablet; a wish to cast from the tablet but drive from the phone; an About page with a
donate option; and — unprompted — that the app has obvious uses beyond dance.

**Section 7, the handoff test, is still outstanding.** The operator ran the whole night alone.

Triage and scope decisions to follow. No code changed on this entry.

### 2026-08-26 — 0.8.3: one jam for every birthday
- **Several birthday dancers are now jammed together.** The jam fires at whichever of them the
  wheel reaches first, names them all — *"Happy Birthday Dakota G and Zoe K!"* — and drawing the
  others later does not stop the night again. Owner's idea, and better than the per-dancer jam that
  shipped in 0.8.2: one interruption instead of several, and everybody celebrated at once.
- Name lists read the way they would be said aloud: *"A"*, *"A and B"*, *"A, B and C"*.
- Session schema bumped to **v3**.
- **113 tests.** Verified in the browser with two birthday dancers, one in each pool: the jam fired
  on the first draw naming both, resumed correctly, and stayed silent when the second was drawn.

### 2026-08-26 — 0.8.2: the birthday jamboree, and a real fix to the back guard
- **The back guard was broken after the first use.** Closing the app consumed its history guard, and
  Android brought the same page back rather than reloading it — so no mount effect ran, no guard was
  pushed, and the next back closed the app instantly with no warning. Caught on a real device, which
  is the only place it could have been caught. Fixed by re-arming on visibility, not just on mount.
  See D-036.
- **The birthday jamboree added** (D-035) for the owner's birthday event. Long-press a name in the
  roster to mark the birthday dancer; when they are drawn — whichever spin, whichever role — the
  session stops for a party popper and a birthday jam, then picks up exactly where it left off.
- Session schema bumped to **v2**, so a session saved by an older build is discarded rather than
  restored without the new fields.
- **111 tests**, ten of them covering the jamboree across both spins, both roles, both spin orders,
  prompts on and off, recycling, and interruption.

### 2026-08-26 — Documentation sweep
Checked every document against what the app actually is at 0.8.1, rather than what it was planned
to be. Four were stale:

- **[app-store-description.md](app-store-description.md) promised features that do not exist.** It
  was written before the v1.0 scope was cut and described the winner, the audience vote and the
  theatre curtain — all v1.2/v1.3. Its own notes claimed "every claim is one the product actually
  makes", which had quietly stopped being true. Now split into **v1.0 copy that is true today** and
  **finished-product copy held until v1.3**, with a list of claims to keep out until the version
  that delivers them ships.
- **[prd.md](prd.md)** still said "scoped and ready to build". v1.0 is built and deployed.
- **[stack.md](stack.md)** still said "recommended, pending setup", with setup steps written as
  to-dos. All three are done; marked as such.
- Dates corrected across intent, prd, stack and costs.

**The lesson, recorded because it will recur:** the store copy went stale because it was written
against the product's *vision* while the build shipped against its *scope*. Marketing copy now
carries a version number, not just a date.

### 2026-08-26 — 0.8.1: rehearsal round 1 findings
**Sections 1–6 and 8 of the rehearsal passed on both a Samsung phone and a Samsung tablet.**
Installed cleanly as a real app, ran with the network off, survived being swiped away mid-session,
held the screen awake through a dance, and cast acceptably.

Two findings, both acted on:
- **A stray back gesture closed the app.** Fixed — see D-033. The session always survived it, so
  nothing was ever lost, but relaunching while a room waits is precisely the interruption this app
  exists to prevent.
- **The tablet rotates into landscape and the phone does not.** Not a fault, and the owner prefers
  it that way. This **corrects a documented constraint that was wrong** — see D-034.

Still outstanding: **section 7 (the handoff test)** and **section 9 (a realistic full run)**, plus a
real event. That event will produce more evidence in one night than every check so far combined.

### 2026-08-26 — 0.8.0 started: device rehearsal
- Confirmed the deployed app meets Android Chrome's install criteria before handing it over:
  HTTPS, valid manifest (standalone, portrait, 192 + 512 + maskable icons), service worker
  serving, every asset returning 200.
- **[rehearsal.md](rehearsal.md) written** — install steps for Samsung Android plus a nine-part
  checklist covering touch, readability, wake lock, offline, interruption, casting, and a full
  realistic run.
- **The handoff test is the one that matters**: give the tablet to somebody who has never seen the
  app, say nothing, and find out whether the screen explains itself. Everything in the design
  principles builds to that, and it is the only part no amount of desktop verification could reach.
- Chrome is specified over Samsung Internet: Chrome installs a real WebAPK, which is what makes the
  portrait lock and fullscreen launch behave.
- Now with the owner. Findings return here as decision entries.

### 2026-08-26 — 0.7.0 shipped: principles pass
Audited **eleven screens and panels** — title, prompt bank, roster, session ready / drawn / pair /
dance hold / complete, options panel, confirm dialog, session log — against the design principles.
`scripts/audit-screens.js` keeps the sweep repeatable for the screens v1.1 adds.

**Measured, not eyeballed.** Three findings, all fixed:
- **`--text-faint` failed contrast** wherever secondary text sits on a raised surface — 3.86:1
  against a 4.5 requirement. Raised to `#a89ec6` (7.1 / 6.4 / 5.6 across the three surfaces). Fixed
  at the token, so every screen benefited at once rather than being patched one at a time.
- **The log button read "Danced: 1"** — a bare count that never said it opened anything. Now
  "View log · 1".
- **The wheel called itself a wheel of "names"** even while showing challenges.

**One risk the audit implied rather than found** — see D-032. The spin ended only on
`transitionend`, an event that does not always arrive.

**After fixes: zero failures** across every screen and panel — no touch target under 44px, no
unlabelled control, no text below its contrast requirement. Wheel labels were checked separately
(SVG fills rather than colours): worst case 4.62:1 on indigo, so every name clears AA.

**What the audit could not check:** whether a screen explains itself to someone who just picked up
the tablet. That was read, not measured, and it is the principle that matters most.

### 2026-08-26 — 0.6.0 shipped: persistence
- **The session survives.** Saved on every state change, restored on launch, cleared only when the
  session ends. Crash recovery and tablet handoff are the same mechanism, as D-005 promised.
- **Verified in the browser**, not just in tests: a reload mid-session came back on Couple 2 of 4
  with the drawn leader still under the pointer and the logged couple's challenge intact.
- **An interrupted spin is rolled back, not resolved.** See D-030 — this was the case worth building
  the version around.
- Stored under a **schema version**. A session written by an older build is discarded rather than
  restored into a crash on launch.
- **A restored session says so on screen** and can be dismissed. Whoever is holding the tablet may
  not be the person who put it down.
- **Storage failure is now surfaced** — closing the silent-failure issue logged in 0.2.0. Verified
  by simulating a quota error: a persistent banner appears rather than the app implying the night
  is safe.
- **101 tests.**

### 2026-08-25 — 0.5.1: the Prompt Bank
- **Prompt Bank** on the title screen: every challenge with its full description, grouped by bundle.
  The built-in 20 are now the **Westie Starter Pack**.
- **Set prompts aside.** Anything set aside stays off the wheel until put back, persists on the
  device, and applies to every future session. Verified end to end: setting three aside showed
  "17 of 20" on the title screen and the roster, and produced a 17-segment prompt wheel.
- Set-aside state is carried three ways — a dashed edge, a struck-through name, and the button's
  own words — so it survives a colour-blind palette and a dim room.
- With everything set aside, the roster screen **disables the prompts-on option and says why**,
  rather than starting a session that cannot draw anything.
- **Custom bundles deferred to v1.1.** See D-029.

### 2026-08-25 — 0.5.0 shipped: prompts
- **A 20-prompt West Coast Swing starter deck**, read-only in v1.0. Every prompt is a constraint on
  *how* to dance rather than a demand for a specific move, so a dancer is never stuck because they
  have not learned a pattern — it works at a social with mixed levels.
- **Prompts on/off is asked during setup and the session will not start until it is answered**
  (D-015). The button says why it is disabled rather than just being grey.
- A couple is drawn, then their challenge. The dance hold shows the couple, then the challenge name
  in accent, then the description — sized for the **dancers reading it from the floor**, which is
  who it is actually for.
- Prompts do not repeat within a session. Exhaustion is announced **before** the deck starts over.
- "Draw a different challenge" is guaranteed to give a different one.

Two bugs found and fixed, both the same class — see D-028:
- **The spin was aimed at the wrong pool**, and could hang the wheel forever. Shipped in 0.4.0.
- **The drawn prompt vanished from the wheel** the instant it landed, and the wheel reverted to a
  dancer pool mid-dance.

**96 tests.**

### 2026-08-25 — 0.4.0 shipped: the loop
This is the version where it stops being a wheel and becomes the product.

- **The session is a reducer** (D-005). The whole session is one serialisable value, which is what
  makes crash recovery and tablet handoff in 0.6.0 the same mechanism rather than three features.
- Two spins make a couple; the **dance hold** holds until `Next couple`, with no timer.
- **Recycling works and announces itself** — verified live with 4 leaders and 2 followers: all four
  leaders danced exactly once, both followers danced twice, and no couple repeated.
- **Spin order** is chosen on the roster screen, including "let the app decide", and locked for the
  session (resolving the deviation logged in 0.2.0).
- **Session log** is a slide-up panel, per D-016.
- **Screen wake lock** holds the display awake through the dance hold. See D-026.
- D-017's wink is in: a pool down to one name still spins, and the copy is in on the joke.
- **85 tests**, including the no-repeat guarantee asserted across randomised sessions in seven pool
  shapes and both spin orders.

Two bugs found by looking at the screen, not by reasoning about it (see D-027):
- The landed name **vanished from the wheel the instant it landed**.
- The pool label claimed one pool while the wheel showed the other.

### 2026-08-25 — 0.3.1: pointer direction, Options panel, roster model
- **The pointer now points down at the name it has landed on**, rather than away from it. Fixed in
  all three places it is drawn — the wheel, the title-screen mark, and the favicon. The generated
  PNG icons already pointed down, so the set is finally consistent.
- **Options — edit dancers**, reachable under the spin label. Rename or remove any dancer without
  leaving the wheel.
  - **Every change is confirmed**, and the confirmation says what will happen: a rename spells out
    the before and after; a removal states what it does to the pools ("that leaves 4 leaders and
    3 followers, so the shorter pool will be recycled").
  - Renames are validated like any name — a duplicate is rejected, checked against everyone
    *except* the dancer being renamed, so re-saving an unchanged name is not a clash with itself.
  - Editing clears any landed result, because the pools have changed underneath it.
  - The panel and its dialogs can always be escaped — Cancel, Escape, or tapping outside. "No modal
    traps" matters most here, since Options is reachable mid-session when the tablet may change hands.
- **The roster model is now defined** in the PRD. See D-023.
- Follow-up tweak: the button reads simply **Edit dancers**, sits directly beneath the pool toggle
  and spans the same width, reading as one control group. Slimmed to 44px so it stays visually
  secondary to the spin. That is below the app's own 56px target but at the accepted floor, and it
  is not a control anyone reaches for mid-spin — noted as a deliberate exception, not an oversight.
- Verified in the browser: cancel leaves the roster untouched, confirm applies, a duplicate rename
  is rejected, and the pool warning is arithmetically correct.

### 2026-08-25 — 0.3.0 shipped: the wheel
- **The wheel is honest.** `pickIndex` chooses the winner at random *first*; `planSpin` then aims
  the animation at it. Nothing is steered or filtered — intent.md § Enduring constraints.
- Verified in the browser across three consecutive spins that the name shown always matches the
  segment physically under the pointer. Tests assert the same for every pool size 1–20, at both
  extremes of the landing jitter, from any starting rotation.
- Always turns forward by at least five full revolutions, so a spin looks like a spin even when
  the winner is where the wheel already sat.
- **Pool label is always on screen** — *Now spinning: Leaders*. It is the one fact a second
  operator picking up the tablet cannot infer from anything else.
- Re-spin present, worded as the mechanic actually behaves: "puts {name} back in the pool and
  draws again."
- `buildPools` extracted as the **single source of switch assignment**, resolving the drift risk
  logged in 0.2.0. The roster's projection and the session's real assignment are now the same code,
  with a test asserting they agree.
- Two rendering bugs found and fixed by looking at it (see D-022):
  - Labels on the left half rendered **upside down**.
  - A single long name shrank **every** label on the wheel.
- 0.3.0 is a wheel harness, not the session: it spins one pool at a time and has no couples,
  prompts or draw state. That arrives in 0.4.0.
- **57 tests.** The suite earned itself during this version — a refactor silently deleted
  `adviseOnSize` and six failing tests caught it immediately.

### 2026-08-25 — 0.2.0 shipped: the roster
- Title screen now leads somewhere: **Start a Session** opens the roster and reports how many
  dancers are already saved.
- **Name rules enforced at entry, with the reason shown.** A single first name is rejected
  ("Sarah" cannot be told apart on a wheel); duplicates are caught case- and whitespace-insensitively;
  numbered disambiguation ("Sarah M 2") is offered in the error text rather than left for the
  operator to invent.
- **Switch balancing is projected live** while the roster is built, so the operator sees the shape
  of the event before it starts — 3 leaders + 3 followers + 2 switches reads as "4 couples", with a
  note that it dances as 4 and 4.
- **Event-size guidance is stated, not enforced.** Below three couples, past five, past ten — each
  band gets a plain-language reason rather than a blocked button. The app teaches the format.
- Roster persists to `localStorage` under the versioned key `jnj:v1:roster`, saved on every change.
- **24 unit tests** cover the switch balancing and the validation rules (D-007) — including that
  no dancer is ever lost or invented while balancing, and that balancing is deterministic.
- Fixed during review: a duplicate-name error echoed the operator's typing ("sarah m") instead of
  the name already on the roster ("Sarah M"). Regression test added.
- Two decisions taken while building: D-020 (name length cap) and D-021 (no service worker in dev).

### 2026-08-25 — 0.1.0 shipped: scaffold, PWA shell, deploy pipeline
**Live: https://gdakota222.github.io/jnj-wheel-spinner/**

- Vite 8 + React 19 + TypeScript 6, `vite-plugin-pwa` 1.3 (Workbox).
- **The riskiest unknown is now proven** (D-012): the app builds, deploys to Pages over HTTPS,
  registers a service worker, precaches 12 files, and reports "Ready to run offline."
- Base path `/jnj-wheel-spinner/` verified against the real deploy, not just locally — assets,
  manifest, and service-worker scope all resolve. This is the failure mode that produces a blank
  white page on Pages, so it was checked live before moving on.
- Theme tokens live in `src/styles/theme.css` as CSS custom properties. A static SVG wheel
  (`WheelMark.tsx`) colours its segments from those variables, proving the mechanism D-004 depends
  on before the real wheel is built in 0.3.0.
- Icons are **generated from code**, not committed as binaries. See D-019.
- GitHub Actions deploys on every push to `main`; the `pages` concurrency group cancels superseded
  runs, which is why the first of two rapid pushes shows as cancelled.
- Accessibility baseline honoured from the first screen, per principle 4: 56px minimum touch
  targets, `prefers-reduced-motion` respected, focus rings, and unavailable menu items that say
  *why* in words rather than relying on being greyed out.
- Known non-blocker: GitHub warns that several official actions still target Node 20. Warning only.
- **Reviewed in the browser pane and approved by the owner — palette included.** The segment
  colours now in `theme.css` are therefore the reference the colour-blind palettes (v1.1) have to
  stay recognisable against: those alternates adjust hues for distinguishability, they do not
  redesign the look. The approved default is the thing being preserved.

### 2026-08-25 — Repository live
- Created **[gdakota222/jnj-wheel-spinner](https://github.com/gdakota222/jnj-wheel-spinner)** —
  public, per D-008. Docs committed and pushed as the first commit.
- Deploy target now fixed: **https://gdakota222.github.io/jnj-wheel-spinner/**, which sets the
  Vite `base` to `/jnj-wheel-spinner/`. Getting that wrong is the classic cause of a Pages deploy
  that serves a blank page with 404s on every asset, so it is set at scaffold time, not after.
- Commit identity uses GitHub's `noreply` address rather than a personal one. See D-018.
- `.claude/settings.local.json` untracked and gitignored — machine-local, and it embeds local
  user paths that don't belong in a public repo.

### 2026-08-25 — Toolchain ready
- **Node.js v24.19.0** installed (npm 11.17.0, npx 11.17.0). Node 24 is the current LTS line;
  Vite and React 19 are supported on it.
- Friction, since resolved: the session had inherited its environment before the install, so
  `node` did not resolve on its PATH. **Claude Code restarted; `node` and `npm` now resolve
  natively.** Worth remembering for any future tool install — a restart is required for the
  session to see it.
- **Nothing is blocking 0.1.0.**

### 2026-08-25 — v1.0 fully specified
- Resolved the last three open questions for v1.0. See D-015, D-016, D-017.
- **v1.0 has no unanswered questions.** Ready to build.

### 2026-08-25 — Cost posture and asset licensing
- Confirmed the whole stack is free; documented current and future costs in
  **[costs-and-monetization.md](costs-and-monetization.md)** (new).
- Recorded monetization as a possible future with no model chosen. See D-013.
- Set the **CC0-only asset rule** for the sloth theme. See D-014.
- Added a commercial-intent section to [intent.md](intent.md) and flagged the one permanent
  non-goal that monetization would put under pressure.
- **Original OneDrive folder still present** — locked by another process (likely OneDrive sync).
  Safe to delete manually at any time; the live project is `C:\dev\jnj-wheel-spinner`.

### 2026-08-25 — Project setup
- Confirmed git present (2.55.0). **Node.js not installed** — owner installing.
- **Moved the project out of OneDrive** to `C:\dev\jnj-wheel-spinner` (see D-009).
  - The in-place move failed — the shell's own working directory held the folder open. Copied,
    switched the session's directory, then removed the original.
- Created this tracker.
- Documentation set now complete for v1.0: intent, PRD, stack, tracker.

### 2026-08-24 — Documentation restructure
- Split the single 650-line intent doc into **[intent.md](intent.md)** (why — stable) and
  **[prd.md](prd.md)** (what gets built — versioned). See D-001.
- Defined the **v1.0–v2.0 roadmap** and MVP scope. See D-002, D-010, D-011.
- Chose the **stack**. See D-003 through D-008.

### Earlier — Product definition
- Product interview conducted across several sessions; every v1.0 decision captured in the PRD.
- Marketing/store copy drafted at [app-store-description.md](app-store-description.md).

---

## Decision log

Numbered, permanent, and superseded rather than deleted.

### D-001 — Split intent from requirements
**Decision:** `intent.md` holds the enduring *why*; `prd.md` holds versioned *what*.
**Reasoning:** the original doc had become a spec wearing a vision doc's clothes, which made it
impossible to tell which parts were negotiable. Principles and non-goals should push back on a new
feature; feature specs shouldn't. The split lets the PRD churn freely while intent stays stable.

### D-002 — Version ordering: self-sufficiency before spectacle
**Decision:** v1.1 (deck authoring, saved rosters, Options) ships before v1.2 (the winner/ending).
**Reasoning:** a tool that needs a code editor to add a prompt isn't finished, and authoring costs
a fraction of the winner flow. Also splits the winner across v1.2 (Mode A — operator picks) and
v1.3 (audience ranked vote), because Mode A closes the "night has no ending" hole for roughly a
tenth of the cost of Borda counting, tie resolution, ballot handoff and the mirroring problem.

### D-003 — Vite + React + TypeScript
**Decision:** mainstream over clever.
**Reasoning:** the working model is Claude writes, owner reviews. When the owner searches for an
answer without Claude present, the answer needs to exist — React has the most documentation by a
wide margin. TypeScript catches state-machine mistakes that would otherwise surface mid-event.

### D-004 — SVG wheel, not canvas
**Decision:** render the wheel as inline SVG with a CSS transform for the spin.
**Reasoning:** at ≤20 names, names can be real `<text>` elements — legible to assistive tech and
styleable by CSS custom property, which makes both the sloth theme and the color-blind palettes a
variable swap rather than a redraw. That satisfies the accessibility principle for free. Canvas
only wins at hundreds of segments, which the 10-couple ceiling rules out permanently.

### D-005 — One reducer for session state
**Decision:** model the session as a state machine in a single `useReducer`. No state library.
**Reasoning:** persistence falls out for free — serialize after every dispatch and crash recovery,
tablet handoff, and resume-where-you-left-off become the same three lines instead of three
features. Redux or Zustand would add ceremony without adding capability at this size.

### D-006 — localStorage, not IndexedDB
**Decision:** localStorage with a versioned key.
**Reasoning:** the data is tiny and synchronous writes make "persist on every state change"
trivial. IndexedDB earns its complexity only with blobs, which v1 has none of.
**Revisit if:** sloth-mode artwork or audio (v1.5) ends up stored rather than bundled.

### D-007 — Tests only on the pairing logic
**Decision:** Vitest for pool draining, recycling, switch balancing, and the no-repeat invariant.
Nothing else in v1.
**Reasoning:** most of the app is visual and best verified by looking at it. The pairing logic is
the opposite — its invariants stay invisible until they fail in front of a room.

### D-008 — Static-hosted PWA, public repo
**Decision:** GitHub Pages from a public repository; install via Add to Home Screen.
**Reasoning:** free, git-native, and no backend. Pages requires a paid plan for *private* repos;
the app contains nothing sensitive, so public keeps it free. Cloudflare Pages or Netlify are the
fallbacks if the repo ever needs to be private.
**Note:** "no server" means no backend — it does not mean no hosting. HTTPS is required once to
install, and again for each update. Never during an event.

### D-009 — Move the project out of OneDrive
**Decision:** relocated to `C:\dev\jnj-wheel-spinner`; git and GitHub provide backup.
**Reasoning:** `npm install` creates tens of thousands of files in `node_modules` and OneDrive
tries to sync every one — slow installs, file-lock errors mid-build, occasionally a corrupted
dependency tree. OneDrive offers no reliable way to exclude a nested folder. Git versions the
project better than OneDrive does anyway.

### D-010 — Prompts stay in the MVP
**Decision:** v1.0 includes the prompt wheel with built-in, read-only decks.
**Reasoning:** the wheel component is built regardless, so feeding it prompt names instead of
dancer names is nearly free. The expensive parts are *authoring* and *sharing*, which are deferred.
This buys half the product's personality for very little work — and since the owner is also the
developer, deck contents can be edited in source before an event.

### D-011 — The winner feature is cut from the MVP
**Decision:** no winner, vote, tie resolution, sudden death, or curtain in v1.0.
**Reasoning:** by a wide margin the most complex thing in the product, and the spec itself marks it
optional and off by default. Building it after a real event means building it with real knowledge.
**Accepted cost:** the night loses its ending in v1.0, closed by the operator announcing a winner
out loud — which is what happens today anyway. This is the largest experiential hole in the MVP and
is accepted knowingly.

### D-012 — Prove the deployment pipeline before building features
**Decision:** 0.1.0 is a deployed, installable, offline-capable blank app.
**Reasoning:** service workers, HTTPS install, and offline caching are the riskiest unknowns in the
project and everything depends on them. Finding a problem there against a blank page costs an
afternoon; finding it after five features costs a rebuild.

### D-013 — Free now, monetization possible later, nothing built for it
**Decision:** the project stays free end to end (public repo, GitHub Pages, open-source tooling).
Monetization is recorded as a possible future with **no model chosen and nothing built toward it.**
**Reasoning:** building for a business that may never exist is how a working tool becomes a worse
one. The two facts worth knowing early are recorded instead: hosting stays free at any realistic
scale, and **charging money is an architecture decision rather than a pricing one** — donations and
a one-time app-store purchase preserve the current no-server design, while anything
subscription-shaped requires accounts and a backend, reopening a stated non-goal.
**See:** [costs-and-monetization.md](costs-and-monetization.md).

### D-014 — CC0-only assets for the sloth theme
**Decision:** v1.5 artwork and sound use free assets under **CC0 or equivalently permissive
licenses only**. Non-commercial (CC-BY-NC) assets are forbidden outright. Paid/commissioned art
remains an open door.
**Reasoning:** the risk is licensing, not cost. NC-licensed assets are free today and illegal the
moment the app earns anything — which would mean re-illustrating the entire theme. CC0 costs
nothing extra now and closes that trap permanently. A credits/licensing file is kept in the repo
from the first asset onward, because reconstructing provenance afterward is miserable.
**Roadblock noted:** commissioned artwork needs an explicit written commercial-use license agreed
**before** payment, or it lands the project in the same position as an NC asset.

### D-015 — Prompts on/off is asked during setup, not defaulted
**Decision:** an explicit on/off control on the roster screen before the session starts.
**Reasoning:** a default set the wrong way is only discovered mid-session, when changing it is
disruptive. Asking costs one tap, and makes the prompt feature **visible to a second organizer who
has never seen the app** — which a buried toggle would not.

### D-016 — Session log is a slide-up panel, not a screen
**Decision:** tap to open over the wheel, tap to dismiss. Never a navigation destination.
**Reasoning:** a separate screen is one more place the tablet can be put down. Whoever picks it up
would find a log instead of the wheel with no idea what they were looking at — a direct violation
of the self-describing principle at the moment it matters most.
**Held in reserve:** if the panel crowds the portrait layout in real use, moving the log to its own
screen is the fallback. If it moves, the handoff problem must be *solved*, not accepted.

### D-017 — The last dancer still gets a spin, with a wink
**Decision:** when a pool is down to one name, the wheel spins anyway, with distinct copy and a
spin that plays on the inevitability.
**Reasoning:** the room has learned the session's rhythm over the whole night; skipping the final
spin would land as a bug rather than as efficiency. Everyone already knows who it is, so the app
being **in on the joke** is funnier than the app being solemn about it — or pretending there was
suspense.

---


### D-018 — Commit as a GitHub noreply address, not a personal email
**Decision:** git identity for this repo is `gdakota222` /
`320862839+gdakota222@users.noreply.github.com`, set per-repo rather than globally.
**Reasoning:** the repo is public, and every commit permanently embeds the author's email in
history where it is trivially scraped. GitHub's noreply address still links commits to the
account without exposing a real inbox. Set locally rather than globally so it does not silently
apply to unrelated projects on this machine.
### D-019 — Generate PWA icons from code, not committed binaries
**Decision:** `scripts/generate-icons.mjs` renders the icon set (192, 512, maskable 512, Apple
touch) with a hand-rolled PNG encoder over Node's built-in `zlib`. No image library, no design
tool, no binary blobs in review.
**Reasoning:** three benefits at essentially no cost. Icons stay in sync with the theme palette
because they read the same colours; regenerating for a new size or a sloth-themed variant (v1.5)
is a one-line change rather than a round trip through an image editor; and a reviewer can read the
artwork as source instead of trusting an opaque PNG. Adding `sharp` or similar would have pulled a
large native dependency into a project whose only image need is one simple geometric mark.

### D-020 — Cap dancer names at 28 characters
**Decision:** names longer than 28 characters are rejected at entry, with the reason given as
fitting on the wheel.
**Reasoning:** the wheel has to render every name legibly at up to 20 segments, and an
unbounded name silently breaks that. Rejecting at entry keeps the failure in setup, where it
costs a retype, rather than on the wheel in front of a room. The number is a judgement call, not
a measured limit — revisit once the real wheel exists in 0.3.0 and the actual text budget is known.

### D-021 — No service worker in development
**Decision:** `devOptions.enabled: false` in the PWA plugin config.
**Reasoning:** a service worker in dev fights hot reload and produced spurious page reloads that
interrupted testing. Offline behaviour only matters on the deployed app, and it is verified
there against the real Pages deploy. Consequence: the offline status line is rendered only in
production builds, since in dev it would sit on "caching…" forever — a screen stating something
untrue, which principle 1 forbids.

### D-022 — Wheel labels: flip for rotation, size per name, floor for legibility
**Decision:** three related rules for how names render on the wheel.
1. **Flip left-hand labels.** Text runs outward along its segment, so anything pointing into the
   left half reads upside down. The flip is computed from the wheel's *resting* rotation, not
   fixed per segment — a spin sets the final rotation immediately and lets CSS animate toward it,
   so labels orient for where they will stop. They are unreadable mid-spin either way.
2. **Size each label for its own name.** Sizing the whole wheel to its longest name meant one
   "Alex Wintergreen" shrank "Sam O" to match. Per-label sizing keeps short names large.
3. **Floor the font at 4.2 units and truncate below it.** Past that a name is present but
   unreadable at arm's length, let alone across a room. Truncation is the lesser loss because the
   reveal card always shows the full name, in the largest type on the screen.

**Reasoning:** the wheel is the spectacle and the reveal is the information. Given that split, a
truncated label costs little, while an illegible or upside-down one costs the thing the wheel is
for. All three were found by looking at the rendered wheel, not by reasoning about it.

**This revises D-020.** The 28-character name cap stands for storage and the reveal, but it was
never the right constraint for the wheel — the real limit is what stays legible at the current
pool size, which the code now derives rather than guesses. At a full 10-dancer pool, roughly 12
characters render at the floor. D-020's open question is closed.

### D-023 — A roster is a saved list; a session gets a copy of it
**Decision:** a **roster** is a durable, named list of dancers the app remembers permanently.
Loading one into a spin session makes those people **the dancers in that session**, for that
session only. The app always remembers saved rosters; ending a session never discards one.
Write-back from a session to the saved roster is an explicit choice, never automatic.

**v1.0 as built collapses the two** — one stored list, edited in place — as a deliberate
simplification while the session loop is built. The separation becomes real with multiple saved
rosters in v1.1.

**Reasoning:** without this, "edit the roster mid-session" is ambiguous in a way that only shows
up as a bug later: a one-night guest silently joining the regulars, or a mid-event removal quietly
deleting someone from a list reused every week. Naming the durable thing and the working copy
separately makes the v1.1 behaviour obvious instead of a redesign.

### D-024 — Android is the primary device; Apple is a supported target
**Decision:** the app is developed and rehearsed against a **Samsung Android tablet**, with iPhone
and iPad as fully supported secondary targets. Neither platform is allowed a broken experience.
**Reasoning:** Android is what the owner will actually hold on the night, so it decides what
"working" means for v1.0. Apple still has to work, because other organisers (v1.4 onward) will not
all be on Android, and a web app that only runs on one platform has discarded its main advantage.
**Consequence:** the v1.3 audience-vote privacy feature was written expecting to degrade to a
"pause mirroring" warning. Android Chrome supports the Presentation API, so on the primary device
the genuinely-private path will work. The Apple fallback still has to exist, but the good path is
now the likely one. Recorded in [prd.md § Devices](prd.md).

### D-025 — 56px touch targets become an accessibility option, not the floor
**Decision:** the app keeps its 56px default for primary controls, allows deliberate exceptions
down to the 44px accepted floor for secondary ones, and adds a **Large touch targets** option in
v1.1 that raises *everything* to 56px when switched on.
**Reasoning:** the slimmer treatment is what makes a secondary control read as secondary — the
`Edit dancers` button is the first case. But visual hierarchy is worth less than being able to hit
the thing, so anyone who needs the larger target gets it on request rather than having to argue
with the design. This resolves the exception logged in 0.3.1 rather than leaving it as a standing
inconsistency with principle 3.

### D-026 — Hold the screen awake during a session
**Decision:** request a screen wake lock for the whole session, re-acquiring it whenever the tab
becomes visible again. Unsupported or refused is not an error.
**Reasoning:** the dance hold sits untouched for two or three minutes at a time. Without this the
tablet dims and locks mid-dance and the operator has to unlock it before drawing the next couple —
the app holding up the night, which is precisely what success is defined against. Supported on
Android Chrome (the primary device, D-024) and Safari from iOS 16.4.

### D-027 — A drawn dancer leaves the wheel when the couple is committed, not when the name lands
**Decision:** drawing no longer removes a dancer from the pool. Both dancers leave when
`Next couple` commits the pairing. The wheel also keeps showing the pool it last spun until the
next spin starts, rather than switching pools the moment a name lands.
**Reasoning:** removing on landing made the winning name **disappear from under the pointer** —
the wheel re-rendered without them and visually jumped, at the exact moment the room was looking
at it. It also made the wheel swap to the other pool instantly, so the operator never saw what
they had just drawn. Committing on `Next couple` matches how the app already talks about a couple
being "finished", and makes re-spin simpler: the discarded dancer never left, so nothing has to be
restored.

**Consequence:** the pool label had to become phase-aware. With the wheel showing leaders while the
next draw is followers, a fixed "Now spinning: Followers" was a visible contradiction — it reads as
broken to exactly the second operator the self-describing principle exists for.

### D-028 — Showing and drawing are separate questions, everywhere
**Decision:** the session exposes `wheelEntries` (what the wheel is *showing*) and `drawEntries`
(what the next spin will *draw from*) as distinct functions, and anything choosing a winning index
must size it against the latter. `settled` also clamps an out-of-range index instead of ignoring it.

**Reasoning:** conflating the two caused the worst bug in the build so far, and it shipped in 0.4.0
unnoticed. The wheel deliberately lags — after a name lands it keeps showing the pool it landed in
— so with four leaders displayed and two followers to draw, the screen could pick index 3 of a
two-person pool. The reducer found nobody at that index, returned unchanged, and **the wheel span
forever in front of the room**. It only reproduced with uneven pools, which is why a full 4-and-2
session had passed earlier: the bug was introduced by the wheel-lag change *after* that run.

The clamp is deliberate belt-and-braces. An index outside the pool is a caller bug, but the failure
mode it produces is the single worst thing this app can do, so the reducer now lands on the last
name rather than stalling. Tests assert both the separation and the clamp.

**The same class of bug appeared twice more** and was fixed the same way: a drawn dancer, and then
a drawn prompt, each vanishing from the wheel the moment it landed. The rule is now consistent —
**nothing leaves the wheel until the couple is committed.**

### D-029 — Prompt Bank ships as view-and-exclude; building bundles waits for v1.1
**Decision:** v1.0 gets a read-only Prompt Bank with per-prompt set-aside. Creating custom bundles
moves to v1.1, alongside prompt authoring.

**Reasoning:** excluding a prompt is a *filter* over a fixed deck — small, self-contained, and it
makes the bank useful immediately. Creating bundles is *authoring*, and v1.1 already specifies the
session prompt pool: adding a deck mid-session merges into what is there, used prompts stay out,
duplicates match on name. Bundles have to answer all of that — what a bundle is versus a deck, what
happens when a bundle references a prompt later deleted, how adding a bundle mid-session behaves.
Building them in v1.0, separately from deck authoring, means designing those rules twice and very
likely building the feature twice.

**Set-asides are stored as prompt ids**, not copies, so a prompt that is later edited or renamed
stays set aside, and an id that no longer exists is simply ignored.

### D-030 — An interrupted spin is rolled back, never resolved
**Decision:** a session restored from storage in a mid-spin phase returns to the state *before* the
spin. The decided winner is discarded and the operator spins again.

**Reasoning:** two reasons, and either alone would be enough.

The practical one: the wheel animates by transitioning to a target rotation, and the settle happens
on `transitionend`. A restored session is already *at* that rotation, so no transition runs and the
event never fires — the app would come back showing a wheel that spins forever. That is the single
worst failure this app has, and it would happen precisely when something has already gone wrong.

The honest one: **nobody in the room saw it land.** A draw the audience did not witness has no
claim to having happened, and re-spinning is what the operator would do anyway. Resolving it
silently would put a name on screen that appeared without a spin.

Rolling back to the right phase matters too: an interrupted *second* draw returns to `drawn` with
the first dancer still standing, not to `ready`, so a landing the room *did* see is not thrown away
with one it did not.

### D-031 — Storage failure is stated, not swallowed
**Decision:** `saveSession` reports failure, a startup probe checks writability, and either raises a
persistent banner across every screen.
**Reasoning:** the app's whole recovery story rests on storage working. Private browsing and a full
device both fail *silently* on write, which would let the app promise a saved night it has not
saved — the operator would find out only when it was already lost. Closes the issue logged in 0.2.0.

### D-032 — A spin ends on a timer as well as on the transition
**Decision:** the wheel settles on `transitionend` *or* a timer set to the spin duration plus a
small margin, whichever fires first.

**Reasoning:** relying on `transitionend` alone assumes the animation always runs. It does not. A
backgrounded tab does not animate, an OS under memory pressure may drop the transition, and a
viewer with reduced motion has it collapsed to a hundredth of a second by the app's own global
rule. Any of those leaves the wheel turning forever — the same failure D-028 already fixed once
from a different cause, and still the worst thing this app can do in front of a room.

Two independent paths to the same outcome is the right shape here: the transition gives the spin
its timing when everything works, and the timer guarantees the app never hangs when it does not.
Verified by suppressing the transition entirely so the event could not fire — the spin still
settled and the button came back live.

### D-033 — The back gesture warns once before closing the app
**Decision:** the first back press is absorbed and answered with "Press back again to close the
app"; a second press within three seconds goes through. Uniform on every screen.

**Reasoning:** on an installed Android app the back gesture leaves immediately, and the edge of a
tablet is easy to brush mid-event. Persistence means nothing is lost — the session comes straight
back — but the operator still has to find the icon and relaunch with a room watching, which is the
kind of interruption success is defined against.

**Uniform on purpose.** Back could instead have walked the app's own screens — session to roster to
title — but that risks a stray gesture abandoning a running session, the exact problem being solved.
"Back always warns once" is a rule that can be learned in a single go; "back sometimes navigates and
sometimes exits" is one that has to be thought about, mid-event, by someone who may not have started
the session.

### D-034 — Portrait is the design target, not a guarantee — and landscape is wanted
**Decision:** the "portrait only, the app does not rotate" constraint is **corrected**. Phones honour
the manifest's portrait lock; **Android tablets ignore it and rotate freely**, confirmed on a Samsung
tablet. The layout must stay usable in landscape, and a landscape layout designed for a TV is added
to v1.2.

**Reasoning:** the original constraint was written from what the manifest *asks for* rather than what
devices *do*, and it was only ever true of phones. Worth correcting rather than quietly tolerating,
because a future reader would otherwise treat tablet landscape as a bug to suppress.

It also turns out to be an opportunity rather than a defect: the owner prefers landscape on a tablet
— it has room for everything and fits a widescreen TV far better than a portrait layout letterboxed
into one. v1.2 is the right home because it is the first version whose entire purpose is what the
**room** sees.

### D-035 — The birthday jamboree
**Decision:** a dancer marked in the roster stops the session when drawn. Long-press to mark,
always confirmed; a subtle marker in the roster list only; a party popper and a named prompt when
they are drawn; a `Jam Over` button that resumes exactly where the session was.

**Reasoning and the shape of it:**
- **The interruption is parked, not special-cased.** The draw resolves normally and computes the
  phase it was heading for; the jamboree stores that phase and `jamOver` restores it. That is what
  makes it work identically for the first spin or the second, either role, either spin order, and
  with challenges on or off — one mechanism rather than six branches.
- **Once per dancer per session.** A recycled pool can draw the same person twice, and a second jam
  would deflate the first — a birthday jam is a ceremony, not a recurring event. *Proposed as my
  call rather than a stated requirement; the owner confirmed it in 0.8.3.*
- **Several birthday dancers are jammed together (0.8.3).** The jam fires at whichever of them the
  wheel reaches first and names them all; drawing the others later does not interrupt again. The
  owner asked for this and it is plainly better than what shipped in 0.8.2 — one interruption
  instead of several, and the room celebrates everybody at once rather than in instalments. Session
  schema bumped to v3 for the shape change.
- **Marking is hidden and confirming is not.** A long-press keeps it out of the way of anyone who
  does not know about it; the confirmation means an accidental hold costs a single tap.
- **Nothing hints at it during the session.** The marker lives in the roster list alone, because the
  surprise is the entire point.
- Multiple dancers can be marked, each getting their own jam — future birthdays cost nothing.

### D-036 — The exit guard re-arms on resume, not just on mount
**Decision:** the back guard checks for and restores its history entry whenever the page becomes
visible, and forgets any half-armed state at the same time.

**Reasoning:** leaving deliberately **consumes** the guard entry. Android then keeps the app's web
contents alive, so reopening resumes the same page instead of reloading it — mount effects never
run again, no guard is pushed, and the next back press finds nothing to pop and closes the app
instantly. The warning worked exactly once per full relaunch.

**Worth noting how this was found.** It passed every check I could run: the hook was verified in a
browser, the logic was sound, and the failure needs a real installed Android app that has been
closed and reopened. It is the clearest case yet for the rehearsal existing at all — no amount of
desktop verification would have reached it.

### D-037 — Undo steps back through anything, session and roster together
**Decision:** any action can be reversed — draws, prompt draws, dancers added, renamed, re-roled or
removed. Each step restores the session **and** the roster, since a dancer edit changes both. A spin
and its landing count as one step. Confirmed before it acts, naming what it will reverse.

**Reasoning:** at the first real event a pocket press re-spun a follower; repairing it removed her
from the session entirely, and there was no way back. **This overturns the PRD rule that a finished
pairing stands forever**, which existed to keep the log honest. A real night showed the cost of
having no way back is higher than the cost of an editable log.

**Held in memory, not storage.** A crash restores the session but not its undo steps. Persisting 25
snapshots would mean writing a few hundred KB on every action, risking stutter on a tablet
mid-event — a bad trade for a rare case. Revisit if it ever bites.

### D-038 — The wheel is the control
**Decision:** tapping the wheel spins it; tapping a spinning wheel races it to its result;
double-tapping skips outright.
**Reasoning:** at the event almost everybody tapped the wheel before reaching for the button —
dancers included, because the operator hands the device over so the drawn follower spins for her
own leader. A first attempt cut straight to the result, which threw the showmanship away; racing
keeps the moment and removes only the waiting. The winner is chosen before the animation, so
neither shortcut can influence what was drawn.

### D-039 — The session screen never scrolls
**Decision:** only Undo and Lock sit beside the wheel; view log, re-spin, edit dancers and redraw
live in a Tools sheet. The wheel sizes itself to whatever space is left.
**Reasoning:** the Lock control sat below the fold at the event and had to be hunted for mid-event.
Anything requiring a scroll during a session is effectively hidden while the operator is holding the
device in front of a room. The wheel being dead centre is what the room looks at — and the "tap to
spin" hint had been rendering beside it, pushing it off centre, so it became a one-time toast.

### D-040 — The dance hold drops the wheel
**Decision:** while a couple dances, the wheel disappears and the screen belongs to their names and
their challenge.
**Reasoning:** the wheel has done its job, nobody is looking at it, and this is the screen being
cast to a TV. It also removes the worst scrolling case in one move.

### D-041 — No lock while dancing; hold to advance instead
**Decision:** the dance hold advances on a **press and hold**, and Lock is not offered on that
screen.
**Reasoning:** a lock overlay was built for this screen and removed after one look. Because the
dance hold is already just names and a challenge, the locked view was nearly identical to the
unlocked one — impossible to tell apart, and actively confusing on a TV. Making the screen's only
action deliberate achieves the same protection with nothing added: a pocket can press, but it
cannot hold. Fewer states, less to look at, same safety.

### D-042 — Prompts invite rather than demand, and old wording is archived
**Decision:** every prompt rewritten toward creative expression — *as many as you can*, *as little
as you can* — with a hard limit **only** where a lazy reading would satisfy the prompt with no
effort. Names shortened for the wheel. The original deck kept as a selectable bundle.

**Reasoning:** at the first event the prompts read as tests to pass rather than directions to
explore, and the operator softened one out loud mid-dance. A social has mixed levels; a prompt that
only strong dancers can attempt excludes the people it is meant to include.

The exception matters as much as the rule. The owner's example: a prompt about covering distance is
trivially won by tandem-walking the whole song, so it needs a cap on consecutive walks. **Write the
guard against the specific cheat, not as a general rule** — three prompts needed one, seventeen did
not.

**Archiving rather than replacing** turns a wording change into something testable. Both bundles are
in the app, either can be selected for a session, and the dancers can be asked which they preferred
— which is worth more than either the old wording or my judgement about the new one.

**A second problem solved by accident:** shorter names mean a full 20-prompt wheel truncates
nothing at all. The cold read disliked names being cut off and suggested a vertical reel; that is
still a better long-term answer, but it is no longer urgent.

### D-043 — Saved event history reverses a permanent non-goal
**Decision:** v1.6 will save past events — date, name, the pairing log, the songs danced, and later
voting and sudden-death results.
**Reasoning:** [intent.md](intent.md) said the app would never be "a system of record" and that
pairing history would never persist across sessions. The owner wants to look back at past events,
which is a deliberate reversal rather than an oversight, and it is recorded as one. What has *not*
changed is the architecture: still on-device, still no server, still no account. The
*product* claim moved; the *architectural* non-goal did not.

### D-044 — The wheel animates from where it was, and prompts are drawn by id
**Decision:** the session carries `previousRotation`, and the wheel starts each spin there before
animating to the target. Prompt draws carry a prompt **id** rather than an index into a list.

**Reasoning, part one:** the wheel is unmounted while a couple dances, so redrawing a challenge
remounted it *already at* the target angle — the transition had nothing to travel and the wheel sat
still until the safety timer settled it. Carrying the starting angle in state makes a spin animate
whether the component is new or not.

**Reasoning, part two:** taking the replaced challenge off the wheel means the screen aims at one
list while the reducer resolves against another. An index silently stops meaning the same thing the
moment either list changes, and that exact mistake hung the wheel in 0.5.0 (D-028). Naming the
prompt removes the class of bug rather than avoiding one instance of it.

### D-045 — An About page, and a donate link that is allowed to not exist yet
**Decision:** ship an About page on first launch and from the title screen. Keep every outward
link in `src/support.ts`, and render nothing where a handle is unset.

**Reasoning:** the ask from the first event was for it to be clear a person made this, and to let
early adopters donate. Two things follow. First, the same content has to be in both places — a
welcome that promises more than the About button later delivers is a bait. Second, a donate button
that 404s reads as either a broken app or a scam, which costs more trust than having no button at
all. So the page is built now and the link is filled in when the account exists, as a one-line
change.

**Ko-fi over the alternatives.** A giver needs no account of their own, and one-off tips are not
cut. Venmo was raised and is supported in the same file but left unset: a Venmo profile is public
and carries the holder's real name, and the giver needs the app. That is a decision for the owner
to make deliberately rather than a default to inherit.

**A full screen, not a dialog.** On a phone a first-run modal is a cramped box over a screen the
operator has not seen yet.

### D-046 — Setting up is staged, and .shell is positioned
**Decision:** split session setup into Dancers / How it runs / Start, with a pinned step bar and
primary button. Give `.shell` `position: relative`.

**Reasoning, part one:** the session screen already lives by "nothing needed may sit below the
fold" (D-039). Setup did not, and at the first real event a newcomer scrolled past the entire
roster hunting for the button that starts the night. Steps are numbered because a first-timer needs
telling what setting up involves, and directly tappable because a fifth-time operator should not
have to walk a wizard to change one answer. Nothing in the step bar is disabled: a step that cannot
be pressed teaches nothing about why.

**Reasoning, part two:** pinning the add form on top of that was the obvious next move and was
wrong — on a 375px phone it does not fit, and the dancer list collapsed to six pixels. The panel
scrolls as one instead. The reported problem was the button below the fold; the step bar and the
pinned primary button solve it without pinning anything else.

**Reasoning, part three:** `.visually-hidden` is `position: absolute`. With no positioned
ancestor its containing block is the initial containing block, so it is not clipped by
`overflow: hidden` on the shell. Down a long dancer list those screen-reader labels stretched the
document by 635px and made the whole "pinned" layout scrollable — the header could be pushed off
the top. `position: relative` on `.shell` fixes it everywhere at no cost, since every overlay in
the app is `position: fixed` and unaffected. The session screen had the same latent bug and had
only ever been saved by not overflowing far enough.

### D-047 — In Mode A the curtain is a drumroll, not a screen
**Decision:** the operator chooses the winner first; *then* the curtain comes down, says
**"And the winner is…"**, and parts on a press-and-hold. No timer.

**Reasoning:** the PRD carried two open questions here — what the curtain should say in Mode A, and
whether it is worth anything when nothing is being cast — and they turned out to be the same
question. The curtain was specified to drop *first*, with the winner decided behind it. That works
for the audience vote in v1.3, where there is genuinely something to hide. In Mode A there is not:
the operator picks, the picking panel renders on top of the curtain, and the tablet is mirrored to
a TV, so the room watches the choice being made through the thing meant to conceal it.
[intent.md](intent.md) admits this limitation openly. A curtain that conceals nothing while
claiming "VOTING IN SESSION" is worse than no curtain.

Moving it after the choice makes the copy honest and turns the curtain into what it was actually
for: a held moment. And because it has no timer — it parts when the operator holds the button — it
is never dead time. That is the second question answered. Someone alone with a phone holds it
immediately and loses nothing; someone in front of a room holds it until the room is quiet.

**The cost, named rather than discovered:** v1.3's Mode B will sequence the other way, curtain
first, because a vote must genuinely be hidden. Mode A and Mode B will not match. That is a real
inconsistency and it is the right one — the sequence follows what is actually being concealed.

### D-048 — v1.2's ending ships before 1.0.0 is declared
**Decision:** build the winner flow now, as 0.10.0, while 1.0.0 waits.

**Reasoning:** 1.0.0 is gated on the **handoff rehearsal** — a test, not a line of code — and that
is a week out. Holding the roadmap in the meantime would spend the week on nothing. The roadmap's
ordering was always an argument about *cost and dependency*, not a queue: v1.2 sits after v1.1
because authoring is cheaper than the winner flow, not because the winner flow needs authoring.

**Why this feature and not another.** Two things ruled: the PRD names the missing ending as the
largest experiential hole in v1.0, and everything built between now and the handoff is more surface
for a stranger to navigate. The ending sits at the *end* of a session, so a first-time operator
meets it after the app has already worked, not on their way in. Roster transfer was the alternative
and was declined for the opposite reason: its unknowns are platform unknowns — camera permission
inside an installed PWA, QR capacity — that could have eaten the week, and the handoff test was
scoped to the owner's tablet, which takes it off the critical path entirely.

**What is deliberately not in it:** the all-skate finale and the landscape TV layout, both of which
v1.2 also specifies. Landscape especially — it is a rewrite of every screen's layout, and doing it
before the winner screens existed would have meant doing it twice.

## Known issues and in-flight notes

Discovered during the build, deferred within v1.0, and tracked here so nothing quietly
disappears between checkpoints.

### Open — needs an answer from the owner

### Closed
- ~~Spin-order choice is not on the roster screen~~ — resolved in 0.9.5. Setup is staged now, and
  the choice sits on step 2, *How it runs*, exactly where the PRD's screen table always put it.
- ~~Storage failure is silent~~ — resolved in 0.6.0 by D-031; a failed write raises a banner.
- ~~No way to correct a typo in a dancer's name~~ — resolved in 0.3.1; renaming is available from
  Options and is confirmed before it applies.
- ~~Roster vs session dancers undefined~~ — resolved by D-023 and written into the PRD.
- ~~The 28-character cap is unvalidated~~ — resolved by D-022; the wheel now derives its own limit.
- ~~`projectPools` must be the code the session uses~~ — resolved in 0.3.0 by extracting `buildPools`.

### Open — flagged, resolvable without input
- **The About page reads as wordy.** Raised by the same colleague who did the original cold read,
  on the second look. Deliberately **not** acted on: one person's reaction to a page they will read
  once is thin evidence for a rewrite, and the owner's call is to wait and see whether it comes back
  from anyone else. If a second reader says it, trim it — the two cards that carry weight are who
  made it and what it does with your data. (found 2026-08-31)

### Testing gaps
- **Real touch interaction is verified on devices, not in the harness.** The rehearsal and a full
  real event both put fingers on real screens, which is the confidence that matters. What remains
  true is that the browser pane's click handling times out often enough that screens are usually
  driven programmatically during a build — same code paths, but not the same proof. Anything that
  depends on hit targets or gestures is worth a pass on the tablet before it ships.
  (found 0.2.0, narrowed 2026-08-31)
- **No component or end-to-end tests.** By design (D-007) — but it means screen-level regressions
  would be caught by eye, not by the suite.

## Open questions carried into the build

**None.** All three v1.0 questions were resolved on 2026-08-25 — see D-015, D-016, D-017.
v1.0 is fully specified.

Open questions for v1.1 and later remain parked in the [PRD](prd.md), deliberately: they are
better answered by running a real event than by deciding now.
