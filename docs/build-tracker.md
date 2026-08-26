# Build Tracker — v1.0

**Current version:** 0.4.0 — deployed and live
**Current phase:** 0.5.0 — Prompts
**Last updated:** 2026-08-25
**Companion docs:** [intent.md](intent.md) · [prd.md](prd.md) · [stack.md](stack.md)

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
| **Versions shipped** | 4 of 9 |
| **Blocked on** | Nothing |
| **Next up** | 0.5.0 — Prompts |
| **Live URL** | https://gdakota222.github.io/jnj-wheel-spinner/ |
| **Repository** | https://github.com/gdakota222/jnj-wheel-spinner |
| **Real-event target** | Not yet scheduled |

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
| **0.5.0** | Prompts | Built-in deck (read-only), prompt spin, name + description reveal, no-repeat within session, exhaustion message, prompts on/off toggle | ☐ Not started |
| **0.6.0** | Persistence | Reducer serialization on every dispatch, resume after close/crash, tablet handoff verified | ☐ Not started |
| **0.7.0** | Principles pass | Self-describing audit of every screen, label review, contrast and touch targets, no-color-alone check | ☐ Not started |
| **0.8.0** | Device rehearsal | Real tablet install, full dry run with a fake roster, cast-to-TV check | ☐ Not started |
| **1.0.0** | **Live** | Run a real event | ☐ Not started |

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

## Known issues and in-flight notes

Discovered during the build, deferred within v1.0, and tracked here so nothing quietly
disappears between checkpoints.

### Open — needs an answer from the owner

### Closed
- ~~No way to correct a typo in a dancer's name~~ — resolved in 0.3.1; renaming is available from
  Options and is confirmed before it applies.
- ~~Roster vs session dancers undefined~~ — resolved by D-023 and written into the PRD.
- ~~The 28-character cap is unvalidated~~ — resolved by D-022; the wheel now derives its own limit.
- ~~`projectPools` must be the code the session uses~~ — resolved in 0.3.0 by extracting `buildPools`.

### Open — flagged, resolvable without input
- **Storage failure is silent.** `saveRoster` swallows quota and private-browsing errors, so a
  roster can appear saved when it is not. Given that crash recovery and tablet handoff both rest
  on storage working, a silent failure is the wrong default — the app should detect and say so.
  *Fix in 0.6.0, where persistence is the subject.* (found 0.2.0)
- **Spin-order choice is not on the roster screen.** The PRD's v1.0 screen table puts it there;
  it was deferred to 0.4.0 instead, because the choice is locked *at session start* and no session
  exists before then. A deliberate deviation, recorded so it is not mistaken for an omission.
  *Build in 0.4.0.* (found 0.2.0)

### Testing gaps
- **Real touch interaction is untested.** The browser pane's click handling timed out repeatedly,
  so the roster was driven programmatically. Logic, rendering, validation and persistence are all
  verified; what is *not* verified is that a finger on a real screen hits what it means to. This
  is what 0.8.0's device rehearsal exists for, but it means UI confidence is currently lower than
  the green test count suggests. (found 0.2.0)
- **No component or end-to-end tests.** By design (D-007) — but it means screen-level regressions
  would be caught by eye, not by the suite.

## Open questions carried into the build

**None.** All three v1.0 questions were resolved on 2026-08-25 — see D-015, D-016, D-017.
v1.0 is fully specified.

Open questions for v1.1 and later remain parked in the [PRD](prd.md), deliberately: they are
better answered by running a real event than by deciding now.
