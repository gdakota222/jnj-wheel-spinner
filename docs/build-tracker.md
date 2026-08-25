# Build Tracker — v1.0

**Current version:** none — pre-scaffold
**Current phase:** Setup complete — ready to scaffold 0.1.0
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
| **Versions shipped** | 0 of 9 |
| **Blocked on** | Nothing |
| **Next up** | 0.1.0 — scaffold and deployment pipeline |
| **Real-event target** | Not yet scheduled |

---

## The version ladder

Nine internal releases between here and a real event. Each is a **usable checkpoint**, not a
code drop — something that can be opened on the tablet and looked at.

| Version | Name | Contains | Status |
|---|---|---|---|
| **0.1.0** | Scaffold | Vite + React + TS project, PWA manifest and service worker, portrait layout, theme CSS variables, deployed to GitHub Pages, installs to home screen | ☐ Not started |
| **0.2.0** | Roster | Add/remove dancers, Leader/Follower/Switch, unique-name validation, event-size guidance, roster saved to device | ☐ Not started |
| **0.3.0** | The wheel | SVG wheel, spin animation, lands on a name, pool label (*Now spinning: Followers*), re-spin | ☐ Not started |
| **0.4.0** | The loop | Two spins → couple reveal → dance hold → `Next Couple`, pools draining, short-pool recycling, session log, session complete | ☐ Not started |
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

## Known issues and in-flight notes

*Nothing yet — the build hasn't started.*

Items discovered during the build that are **deferred within v1.0** get listed here with the
version they were found in, so nothing quietly disappears between checkpoints.

---

## Open questions carried into the build

**None.** All three v1.0 questions were resolved on 2026-08-25 — see D-015, D-016, D-017.
v1.0 is fully specified.

Open questions for v1.1 and later remain parked in the [PRD](prd.md), deliberately: they are
better answered by running a real event than by deciding now.
