# 0.8.0 — Device rehearsal

**Devices:** Samsung Android phone and Samsung Android tablet
**App:** https://gdakota222.github.io/jnj-wheel-spinner/
**Status:** Rehearsal passed, and the app has run a real event. Section 7 — the handoff test — is
the last item outstanding, planned for roughly the week of 2026-09-07 with a dancer rather than a
second organiser.

This is the first version the owner runs rather than Claude verifies. Everything up to now has
been checked in a desktop browser pane, which can prove logic, layout, wording and contrast — and
cannot prove that a thumb hits what it means to, that a name reads across a room, or that a screen
explains itself to somebody who just picked the tablet up.

**Nothing goes to a real event until this passes.**

---

## Installing

Do this on **both** devices. Use **Chrome**, not Samsung Internet — Chrome installs a proper web
app (a WebAPK), which is what makes the portrait lock and the fullscreen launch behave. Samsung
Internet can add a shortcut, but it is the weaker version of the same thing.

1. Open **Chrome** and go to
   **https://gdakota222.github.io/jnj-wheel-spinner/**
2. Wait for it to finish loading. The footer should read **"Ready to run offline"** — that means
   the service worker has cached everything. Do not skip this; installing before it caches means
   the first offline launch may fail.
3. Tap the **⋮ menu** (top right).
4. Tap **Install app** — or **Add to Home screen** if that is what it offers.
5. Confirm. The icon (a colourful wheel on a dark square) appears on the home screen.
6. **Close Chrome entirely** and launch the app from its home-screen icon.

You should get a fullscreen app with no browser address bar. If you can still see the address bar,
it added a bookmark rather than installing — remove it and try again from step 3.

### Updating later
Redeploys do not reach the device by themselves. Open the app **while online** and it picks up the
new version, sometimes on the second launch. Nothing updates mid-event; whatever you installed is
what you are running that night.

---

## The rehearsal

Work through these on both devices. **The point is to find problems**, so note anything that feels
awkward even if it technically works — "technically works" is not the bar for something running in
front of a room.

### 1. Does it feel like an app?
- [ ] Launches fullscreen from the home-screen icon, no address bar
- [ ] Icon looks right on the home screen — not a generic globe or a squashed square
- [x] **Rotate the device.** Phones stay portrait. Tablets rotate — expected, see D-034
- [x] Back gesture / back button does something sane — since 0.8.1 it warns before closing

### 2. Can you hit things?
This is the biggest gap in everything verified so far.
- [ ] `Spin` is comfortable to hit one-handed, holding the device naturally
- [ ] `Next couple` likewise
- [ ] You do **not** hit `Re-spin` or `Edit dancers` by accident when reaching for `Spin`
- [ ] `Edit dancers` is slim on purpose (44px) — is it *too* slim on your devices?
- [ ] In the Prompt Bank, the `In play` / `Set aside` toggles are easy to hit accurately
- [ ] Typing a roster is not painful — the keyboard does not cover the input or the Add button

### 3. Can you read it?
- [ ] Names on the wheel, held at arm's length
- [ ] Names on the wheel with a **full 10-dancer pool** — the tight case
- [ ] The couple's names from across the room, tablet propped up
- [ ] The challenge description from a few steps away, as a dancer would read it
- [ ] Anything that truncates with `…` — is losing the rest of a long name acceptable?

### 4. The screen staying awake
- [ ] Draw a couple, then **leave it completely alone for three minutes**
- [ ] The screen must not dim or lock. If it does, the wake lock is not holding and the operator
      would have to unlock the tablet mid-dance

### 5. Offline
- [ ] Turn on **aeroplane mode**
- [ ] Launch the app from the icon — it should open and run exactly as normal
- [ ] Run a couple of spins with no connection at all
- [ ] Turn wifi back on; nothing should break

### 6. Surviving interruption
- [ ] Start a session and draw two or three couples
- [ ] **Swipe the app away** from the recents switcher, then reopen it
- [ ] It should return to exactly where you were, saying *"Picked up where you left off"*
- [ ] Try again, closing it **mid-spin**. The wheel should come back ready to spin, not stuck
- [ ] Take a phone call or open another app mid-spin, then come back — the spin should have
      finished, not frozen

### 7. The handoff test — the important one
Everything in the design principles builds to this.
- [ ] Start a session, draw a couple, and **hand the tablet to somebody who has never seen the app**
- [ ] Say nothing. Do not explain it
- [ ] Can they tell what is happening, and what to press next?
- [ ] Ask them afterwards what they were unsure about. **Write it down verbatim** — that list is
      worth more than anything measured so far

### 8. Casting, if you have a screen
- [ ] Cast the tablet to a TV
- [ ] Is the portrait layout acceptable on a landscape screen, or does it waste too much space?
- [ ] Are the couple's names readable from where the room would actually stand?

### 9. A realistic run
- [ ] Type in a roster of **real names** from one of your events, roles and all
- [ ] Run the whole session end to end, with challenges on
- [ ] Time it. Does the pacing feel right, or does the app slow the night down?
- [ ] Run a second one with challenges **off**, as a plain pairing wheel

---

## Findings

### Round 1 — 2026-08-26, Samsung phone and tablet

**Sections 1–6 and 8 all passed on both devices.** Installed cleanly, ran offline, survived being
swiped away, held the screen awake, and cast acceptably.

| # | Device | What happened | Severity | Outcome |
|---|---|---|---|---|
| 1 | Both | The back gesture closes the app outright. The session survives it, so nothing is lost — but the operator still has to relaunch while a room waits. | Annoying | **Fixed in 0.8.1** — see D-033 |
| 2 | Tablet | The tablet rotates into landscape despite the manifest's portrait lock. The phone does not. | Not a fault | Owner *prefers* landscape on the tablet and finds it better for a TV. Portrait constraint corrected; a proper landscape layout planned for v1.2. See D-034 |

| 3 | Both | The back-gesture warning worked once, then stopped: after closing the app and reopening it, back closed it immediately with no warning, and kept doing so until a full relaunch. | Annoying | **Fixed in 0.8.2** — see D-036 |

### Also added during rehearsal
- **The birthday jamboree** (D-035), for the owner's birthday event. Long-press a name in the roster
  to mark the birthday dancer; when they are drawn, the session stops for a party popper and a
  birthday jam.

---

## Round 2 — the real event, 2026-08-26

**It worked.** The session ran, the room reacted, the cast to the TV got great reactions, and the
birthday jamboree landed — everyone laughed. The core loop did its job. What follows is everything
that went wrong or felt wrong, which is the useful part.

**How it was actually run**, which differs from how it was designed:
- Followers were spun first, then **the drawn follower spun the wheel for their leader**, then
  **the leader spun for the prompt**. The operator handed the device to dancers deliberately, to
  make the draw theirs rather than something done to them.
- The roster was built on the **phone** during sign-ups, but the tablet was meant to run the night.
  The roster only existed on the phone, so the phone ran the whole event.
- The tablet was cast to a TV for the room.

### Blockers — these broke the night

| # | What happened | Why it matters |
|---|---|---|
| B1 | **A pocket press re-spun the follower** during prompt selection, wrecking the draw order. Fixing it meant removing the dancing couple via *Edit dancers*, which **also removed the re-spun follower from the session entirely** — and there was no way to put them back. | The app had no way to undo anything. One accidental touch cost a dancer their place and forced a whole second session at the end of the night. |
| B2 | **Two dancers arrived who were not on the list**, and there was no way to add them mid-session. | Late arrivals are normal at a social. The PRD had already parked "add a dancer mid-session" in v1.1; the event proved it belongs in v1.0. |

The night ended with an improvised second session for the skipped follower, the two late arrivals,
and a leader who had never been paired.

### Friction — did not break it, but was felt

| # | What happened |
|---|---|
| F1 | **Almost everyone tapped the wheel itself rather than the Spin button.** Dancers, not just the operator. |
| F2 | **Prompts were too strict.** *Anchor Detective* demands every anchor differ, which is genuinely hard; the operator softened it out loud to "as many as you can". Wanted throughout: creative-expression framing — *as many as you can*, *with as little as you can* — and hard limits **only** where a prompt is exploitable (a distance prompt needs a cap on walks, or dancers just tandem-walk the whole song). |
| F3 | **The roster could not move between devices.** Built on the phone, needed on the tablet. |
| F4 | Wanted: **cast from the tablet, control from the phone.** |

### Cold read — a non-dancer colleague, before the event

Given the app with no explanation. Liked it overall: called out the **sleekness of the UI and the
colour palette**, and understood how it worked. Unprompted, she saw uses **beyond dance** — a
general spinner, something for gamers, a decision-maker.

| # | What she said |
|---|---|
| C1 | **Too much scrolling**, especially on the session setup screen. She did not scroll at first, so the options below the fold were not obviously there. Suggested **tabs along the bottom** to move around the app, and breaking session setup into **stages** rather than one long screen. ✅ *Fixed in 0.9.1 (session screen) and 0.9.5 (staged setup).* |
| C2 | **Disliked names being cut off on the challenge wheel.** Suggested a **vertical, Price-is-Right style reel** for prompts so full names are readable. ⏳ *Partly addressed in 0.9.3 — the rewritten prompt names are short enough that a full 20-challenge wheel truncates nothing. The reel itself is still open, and is now polish rather than a fix.* |
| C3 | **Pressed the spinning wheel expecting it to stop.** Wanted a way to stop it, or to get to the result faster. ✅ *Fixed in 0.9.1 — a tap spins fast to the result rather than cutting to it, so the showmanship survives.* |
| C4 | Wanted an **About page** — who made this — with a way for early adopters to **donate or buy a coffee**. Suggested it appear on first open after install, with an **About button on the title screen** to find it again later. ✅ *Fixed in 0.9.5. The donate link is unset until a Ko-fi account exists.* |

### Still to run
- **Section 7 — the handoff test.** Still outstanding: the operator ran the whole event alone, so
  no second organiser ever took over. Dancers *did* hold the device to spin, which is a partial
  signal, but not the test. **Planned for roughly the week of 2026-09-07**, and deliberately
  harder than the original checklist item: the device goes to **a dancer**, not a second organiser.
  An organiser who has watched the app run all night is not a cold start; a dancer is. See
  Round 3 below for what that run needs to answer.
- ~~Section 9 — a realistic full run~~ — done, at the event itself.
- ~~A real event~~ — done 2026-08-26.

## Round 3 — second cold read, 2026-08-31

The same colleague, shown the app again after the 0.9.x work. Not a fresh cold read — she has seen
it before — so this is a check on whether the fixes landed, not new first-contact evidence.

| # | What she said | Standing |
|---|---|---|
| D1 | **The staged setup worked.** The tabs on session setup were called out specifically. | ✅ Confirms C1 |
| D2 | **Less scrolling overall**, and the session screen not scrolling at all. | ✅ Confirms C1 |
| D3 | **The About page is wordy.** | ⏸ Logged, not acted on. One reader on a page they see once is thin evidence for a rewrite; the owner's call is to wait and see whether it comes back from anyone else. If it does, the two cards worth keeping are who made it and what it does with your data. |

## The handoff rehearsal — planned, roughly the week of 2026-09-07

The last outstanding item on the original checklist, and the last thing between here and 1.0.0.

**Who:** a dancer, not a second organiser. Someone who has never run the app and was not watching
over the operator's shoulder while it ran.

**On what:** the owner's tablet, with a roster already on it. Chosen deliberately over handing them
a blank device. This is a test of whether the app explains itself, and making them install a PWA
and type forty names first would spend the whole session on setup and tell us nothing about the
part that matters. It also means **roster transfer (F3) is not on the path to 1.0.0** — it stays a
real finding, but it is workflow convenience rather than a blocker.

**What it has to answer:**
1. Can they get from a cold title screen to a running session without being told anything?
2. Do the three setup steps read as a sequence, or does step 1 look like the whole job?
3. When something goes wrong mid-session, do they find **Undo** and **Tools** on their own?
4. Does the wheel invite a tap, or do they wait to be told they can touch it?
5. Does anything on the screen need a human standing next to it to explain?

**What must not happen:** the operator narrating. The value of this test is entirely in what the
app fails to say for itself, and a helpful voice erases the finding.

**Severity:** *blocker* (cannot run an event), *annoying* (would irritate mid-event),
*polish* (noticed it, would not stop anything).
