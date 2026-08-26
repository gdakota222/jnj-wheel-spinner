# 0.8.0 — Device rehearsal

**Devices:** Samsung Android phone and Samsung Android tablet
**App:** https://gdakota222.github.io/jnj-wheel-spinner/
**Status:** Sections 1–6 and 8 passed on both devices. 7 and 9 outstanding.

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

### Still to run
- **Section 7 — the handoff test.** The one that matters most, and the only one no amount of
  desktop verification could reach.
- **Section 9 — a realistic full run**, including timing the pacing.
- **A real event**, which will produce more evidence in one night than everything above combined.

**Severity:** *blocker* (cannot run an event), *annoying* (would irritate mid-event),
*polish* (noticed it, would not stop anything).
