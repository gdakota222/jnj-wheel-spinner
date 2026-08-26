# JnJ Wheel Spinner — Product Intent

**Status:** Stable. This document changes rarely.
**Last updated:** 2026-08-10
**Companion doc:** [prd.md](prd.md) — what actually gets built, version by version.

This is the **why**. It holds the things that stay true across every version: what the app is,
who it serves, the principles every screen must meet, and what it will never become. Feature
specs, scope, and sequencing live in the [PRD](prd.md).

---

## 1. What this is

A phone- and tablet-friendly web app for running Jack & Jill (JnJ) style partner draws at social
dance events. It does two things:

1. **Pairing wheel** — randomly draws a leader and a follower to form a couple.
2. **Prompt wheel** — draws a dance prompt for that couple: a named challenge with a short
   description of how it works.

**The randomness is trivial; the spectacle is the point.** The wheel exists so a room full of
people can watch the draw happen and react to it. Where the two conflict, design decisions favor
*fun to watch* over *efficient to operate*.

**Dancing is spotlight style: one couple at a time**, with the room watching. That single fact
drives the app's size limits and the pace of everything in it.

**This is a social variant and a practice tool — not an official competition.** There is no
judging, no scoring, no sanctioned result. Prompts are not part of standard Jack & Jill; they
exist here to make the night playful. Nothing this app produces should be treated as a
competitive record.

Primary dance style: **West Coast Swing**. The prompt system is built deck-agnostic so other
styles can be added later without rework.

---

## 2. Why it exists

Running a social Jack & Jill puts the organizer in charge of pairing admin — who has danced, who
is waiting, who ends up with whom — during the exact stretch of the night when the room has
nothing to look at. That costs the organizer attention they would rather spend hosting, and leaves
a recurring gap where the event's energy drains instead of building.

**The opportunity: the pairing moment already has everyone's attention.** Done right, the admin
stops being overhead and becomes the part of the night people watch.

### What success looks like
1. **The event runs smoothly** — the app keeps up with the night instead of holding it up.
2. **Less hassle for the organizer** — the pairing admin disappears into the tool.
3. **It's fun for everyone involved** — dancers, the room, and the person running it.

Anything that trades away one of these for a cleverer feature is the wrong trade. Observable
signals for each are in the [PRD](prd.md).

---

## 3. Who it's for

Built **first and foremost for the owner** to run their own events, with the explicit hope that
other organizers use it later.

The app has more users than "the organizer" — the voters passing a device around, the room reading
the screen without touching it, the couple parsing a prompt from the floor, the deck author at home,
the second organizer who picks up the tablet mid-event. Full user model, contexts, and the
consequences that follow are in the [PRD](prd.md).

**Two facts shape everything:**

- **The operator may be dancing.** They put the tablet down or hand it to whoever is nearest, and
  that must be a non-event. **The app is never tied to a person** — anyone who picks it up continues
  from exactly where it was left.
- **There are no accounts and no logins.** The app never knows or cares who is holding it.

---

## 4. Design principles

**Standing laws, not features.** They apply to every screen in every version, and they are **baked
in from the first screen built, never retrofitted** — none can be added later without revisiting
everything already made.

### 1. The screen is always self-describing
At any instant, the display alone must answer three questions: **what is happening, what happens
next, and what do I press.** Nothing may depend on remembering a setting chosen earlier or an action
taken thirty seconds ago.

**The test: a person who just walked up can run the app.** That person is real — the operator dances,
and the tablet gets handed over. What follows from it:

- **Mid-action states must be labeled** — *Now spinning: Followers*. Session settings are knowledge
  the first operator has and the second one does not.
- **No timers and no auto-advance, anywhere.** Anything on a clock punishes a handoff, and means the
  app changes while nobody is watching.
- **No modal traps.** A confirmation dialog or half-finished edit left open strands whoever picks the
  device up next. Every confirmation needs an obvious way out.
- **The primary action on any screen must be the most obvious thing on it.**

### 2. Clear labels wherever meaning isn't obvious
Words carry meaning on the screen; icons carry it in the viewer's memory. An icon alone only works
for someone who has used the app before, and the app must assume nobody has.

- **Any control whose purpose isn't self-evident gets a text label.**
- Icons are welcome **alongside** labels, for speed of recognition and for charm — never as a
  substitute for one.
- A judgment call per control, not a blanket ban. A clearly-marked back arrow needs no caption.
  **Ambiguity is what forces a label.**

### 3. Accessible at all times
Accessibility is the **baseline state of the app**, not a mode to switch on. Settings hold palette
preferences; they are not where accessibility begins.

Always true, regardless of settings:
- **Never encode meaning in color alone** — the wheel, the log, and every status use position, text,
  or shape as well.
- **High contrast and large type** by default, readable across a room and at a glance.
- **Generous touch targets**, usable in a hurry, in low light, on a device that isn't yours.
- **Legible in every theme.** Silliness never costs clarity.

### 4. Bake it in as you go
Each of the above is cheap while building and expensive afterward. Writing a word instead of drawing
a glyph costs nothing today; making a finished icon-first interface legible to a stranger means
reopening every screen and the layout that assumed compact controls. **Every screen ships meeting
these principles, or it isn't finished.**

---

## 5. Enduring constraints

These hold for every version and are not up for renegotiation feature by feature.

- **Works fully offline.** Venue wifi is unreliable and must never be a dependency.
- **No server, no accounts, no network calls.** Everything lives on the device.
- **Installable to the home screen**, opening fullscreen like a native app.
- **Portrait only.** Built for phones and tablets held vertically; the app does not rotate. Casting
  to a TV shows the portrait layout — accepted, not a bug.
- **Android and Apple both.** The owner runs the app on a **Samsung Android tablet**, so Android is
  the device that has to work on the night. But the app must also run correctly on iPhone and iPad —
  other organisers will not all be on Android, and the whole point of a web app is that it does not
  care. Neither platform gets a broken experience.
- **Castable to a TV or projector** as a supported use case: large text, high contrast, readable
  from across a room.
- **Small events by design.** Spotlight format means 3–10 couples, with 5 the sweet spot and 10 a
  hard maximum — roughly 20 dancers at the outside.
- **Honest randomness.** The wheel is not steered, curated, or quietly filtered. The room believes
  it is watching chance, and it is.

---

## 6. Look and feel

**Playful and colorful.** Bright multicolor wheel, bouncy spin animation, celebratory reveal.

The one deliberate exception: **while a couple is dancing, the screen holds rather than performs.**
No looping animation, no attention-seeking motion. The dancers are the show; the screen is a
reference card. Everywhere else, the app is allowed to be the fun part.

---

## 7. What this will never be

Permanent non-goals. Not "later" — never, without a change of intent.

- **Anything with a server or an account.** No cloud sync, no hosted deck library, no shareable
  deck URLs. Deck sharing is strictly device-to-device.
  > **The one non-goal with a known pressure point.** Most ways of charging money require accounts
  > and a backend. If the app is ever monetized (§9), this is the non-goal that would come under
  > pressure — and it must be **deliberately revisited, not quietly abandoned.** See
  > [costs-and-monetization.md](costs-and-monetization.md).
- **A tool for official or sanctioned competition.** It produces no record and settles nothing.
- **A scoring, judging, or results-export system.**
- **A system of record.** Pairing history never persists across sessions. (In-session state does
  persist — that is crash recovery, not history.)
- **An app dancers use from their own phones.**
- **Bracket or heat management.**
- **A large-event tool.** The 10-couple ceiling is a design choice, not a limitation to lift.

---

## 8. How scope gets decided

**MVP first, then observe.** v1.0 is the smallest thing that runs one real event end to end.
Everything else is sequenced behind it in the [PRD](prd.md), and the ordering is deliberately
biased toward *cheap things that make the app self-sufficient* before *expensive things that make
it impressive*.

**Open questions are answered by use, not by planning.** Where a decision depends on how a real
night actually goes — whether operators want a second pass over the roster, whether the audience
vote is worth its complexity — the decision waits, and the PRD records what to watch for instead
of guessing now.

---

## 9. Commercial intent

**Free to build and free to run, and that stays true for the whole roadmap.** Every tool, library,
and host in use costs nothing, and hosting stays free at any realistic scale for this app. The
repository is public — it's a tool for dancers, and there is nothing in it worth hiding.

**Monetization is an open possibility, not a plan.** If the app gains real traction with organizers
beyond its owner, charging for it may make sense. **No model has been chosen**, and none should
influence v1 — building for a business that may never exist is how a working tool becomes a
worse one.

Two things are worth knowing now, because they cost nothing today and are expensive to reverse:

- **Charging money is an architecture decision, not a pricing one.** Donations and a one-time
  app-store purchase preserve this app exactly as it is. Anything subscription-shaped, or any
  in-app store, requires accounts and a backend — which means reopening the non-goal in §7.
- **Asset licensing is decided now, not later.** Sloth-theme art and sound (v1.5) use **free,
  CC0-or-equivalent assets only** — never non-commercial licenses — so that a future paid version
  never has to be re-illustrated. Paid or commissioned artwork remains an open door, with the
  licensing terms agreed in writing before any money changes hands.

Full analysis, cost figures, and possible avenues: [costs-and-monetization.md](costs-and-monetization.md).
