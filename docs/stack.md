# JnJ Wheel Spinner — Technical Stack

**Status:** Recommended, pending setup
**Last updated:** 2026-08-25
**Companion docs:** [intent.md](intent.md) · [prd.md](prd.md)

**Target devices:** a **Samsung Android tablet** primarily, with iPhone and iPad as fully
supported secondary targets. See [prd.md § Devices](prd.md).

**Working model:** Claude writes the code and explains it; the owner reviews, tests at real
events, and directs. This biases every choice toward **mainstream and well-documented** over
clever — when the owner searches for an answer without Claude present, the answer should exist.

---

## The stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast, zero-config, first-class PWA plugin. |
| Framework | **React + TypeScript** | The most documented option by a wide margin. TypeScript catches the state-machine mistakes that would otherwise surface mid-event. |
| Styling | **Plain CSS with custom properties** | Theming (default / sloth) and color-blind palettes are *variable swaps*. No CSS framework — readable diffs matter more than utility classes here. |
| Wheel | **Inline SVG + CSS transform** | See below. |
| State | **A single reducer** | See below. |
| Storage | **localStorage**, versioned key | Data is tiny. Synchronous writes make "persist on every state change" trivial. IndexedDB is overkill without images. |
| Offline / install | **vite-plugin-pwa** (Workbox) | Manifest, service worker, precaching, install prompt. |
| Tests | **Vitest**, pairing logic only | See below. |
| Hosting | **GitHub Pages** | Free, git-native, static. Repo needed anyway. |

### Why SVG for the wheel, not canvas
At ten to twenty names, SVG wins on every axis that matters here:

- Names are **real `<text>` elements** — legible, selectable, and available to assistive tech,
  which serves the accessibility principle for free rather than by extra work.
- Segments are **styled by CSS custom properties**, so both the sloth theme and the color-blind
  palettes are a variable swap rather than a redraw.
- The spin is a **CSS transform on one group** with a long cubic-bezier ease — a few lines, and
  the browser handles the animation smoothly.
- Canvas would only win at hundreds of segments, which the 10-couple ceiling rules out permanently.

### Why one reducer
The session is a state machine: which pool is spinning, who's drawn, who's left, what's on screen.
Modeling it as a single reducer means **persistence comes free** — serialize the state after every
dispatch, and crash recovery, tablet handoff, and "resume where it left off" are all the same three
lines. No Redux, no Zustand; React's own `useReducer` is sufficient at this size.

### Why tests, and only there
Most of this app is visual and best verified by looking at it. But the pairing logic has **invariants
that are invisible until they fail in front of a room**: pools drain correctly, the short pool
recycles, switches balance and lock, and the "a couple can never repeat" guarantee actually holds.
Those get unit tests. Nothing else needs them in v1.

---

## Setup required

### 1. Install Node.js — not currently on this machine
Git is present (2.55.0); Node and npm are not. Install the LTS release:

```bash
winget install OpenJS.NodeJS.LTS
```

Or download the Windows installer from nodejs.org. Restart the terminal afterward so `node` and
`npm` resolve.

### 2. Decide where the project lives — recommend moving it out of OneDrive
The project currently sits in `OneDrive\Desktop\Claude Projects\`. Once `npm install` runs, it will
create a `node_modules` folder holding tens of thousands of small files, and **OneDrive will try to
sync every one of them.** The usual results are slow installs, file-lock errors mid-build, and
occasional corrupted dependency trees. OneDrive offers no reliable way to exclude a nested folder.

**Recommended:** move the project to a non-synced path such as `C:\dev\jnj-wheel-spinner`, and rely
on **git plus GitHub for backup** — which is better versioned than OneDrive anyway.

Staying in OneDrive is workable but will be intermittently annoying, and the annoyance arrives
during builds rather than at a convenient moment.

### 3. Initialize the repo
This folder is not yet a git repository. It needs to be one for GitHub Pages deployment.

---

## Deployment model

**"No server" means no backend — it does not mean no hosting.** A PWA must be served over HTTPS once
in order to install. The flow:

1. Push to GitHub; GitHub Pages serves the built site over HTTPS.
2. Open the URL on the tablet once, **Add to Home Screen**. On Android Chrome this is a full
   install and the manifest's portrait lock is honoured; on iOS it is the more limited Add to
   Home Screen, and orientation is not locked.
3. The service worker precaches everything. **From then on it runs fully offline**, as specified.
4. To update: redeploy, then open the app once while online. The service worker picks up the new
   version.

The only internet requirement is the initial install and any subsequent update — never during an
event.

---

## Deliberately not chosen

- **Tailwind or any CSS framework** — theming here is variable-driven, and plain CSS keeps the
  diffs readable for review.
- **A state library** (Redux, Zustand) — one reducer covers it.
- **IndexedDB** — no images or large blobs in v1.
- **A native wrapper** (Capacitor) — real app-store installs only matter once other organizers need
  easy distribution. Revisit alongside v1.4 deck sharing, not before.
- **Canvas rendering** — ruled out permanently by the 10-couple ceiling.
- **A component library** (MUI, shadcn) — the app has perhaps a dozen bespoke, highly-themed
  screens. A library would fight the theming rather than help it.
