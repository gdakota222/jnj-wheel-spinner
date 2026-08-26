# JnJ Wheel Spinner — Product Requirements

**Status:** v1.0 (MVP) scoped and ready to build. Later versions outlined.
**Last updated:** 2026-08-10
**Companion doc:** [intent.md](intent.md) — why this exists, design principles, permanent non-goals.

This document is **what gets built, and in what order**. Detail is deliberately front-loaded
into v1.0; later versions carry their decisions but not their final polish, and are expected
to change once a real event has been run.

---

## Problem

Running a social Jack & Jill puts the organizer in charge of pairing admin — tracking who
has already danced, who is still waiting, and who ends up with whom — during the exact
stretch of the night when the room has nothing to look at. That costs the organizer
attention they would rather spend hosting, and it leaves a recurring gap where the
event's energy drains instead of building. The opportunity is that the pairing moment
already has everyone's attention: done right, the admin stops being overhead and becomes
the part of the night people watch.

### What this statement assumes
Two things are inferred from design decisions rather than stated outright, and are worth
confirming once v1.0 has been run at a real event:

- **That dead air, not time or fairness, is the primary pain.** The app consistently
  trades efficiency for spectacle, which only makes sense if the gap in the night matters
  more than the minutes it costs. If the real pain is cognitive load on an organizer who
  is also DJing, priorities change.
- **That the room is already gathered and watching.** Spotlight format depends on an
  attentive audience. Whether that attention exists at a social, or has to be created, is
  a different problem with a different solution.

---

## Devices

**Primary device: a Samsung Android tablet.** That is what the owner runs events on, so it is the
device that must work on the night and the one every rehearsal (0.8.0) is done against.

**Apple must work too.** iPhone and iPad are fully supported targets — other organisers will not
all be on Android, and a web app that only works on one platform has thrown away its main
advantage. Neither platform is allowed a broken experience.

**Where the platforms genuinely differ**, and what it means:

| | Android (Chrome) | Apple (Safari) |
|---|---|---|
| **Install to home screen** | Full install; the manifest is honoured | Add to Home Screen; more limited |
| **Portrait lock** | Manifest `orientation: portrait` is respected | Ignored — the layout must hold up if rotated anyway |
| **Second screen (v1.3)** | Presentation API supported — the private-ballot path genuinely works | Not supported; falls back to the "pause mirroring" warning |
| **Screen wake lock** | Supported | Supported from iOS 16.4 |

**Consequence worth noting early:** the audience-vote privacy feature in v1.3 was written assuming
it would usually degrade to a warning. On the primary device it will actually work, because Android
Chrome supports driving a second screen with different content. The fallback still has to exist for
Apple, but the good path is the likely one here.

---

## Users

More people use this app than "the organizer." Several design constraints come from the
ones that are easy to overlook.

| User | What they do | Why they matter |
|---|---|---|
| **The operator** | Holds the device, drives every spin. MC, DJ and organizer are often one person. | **May also be dancing** — see below. |
| **The voters** | In an audience vote, 10–20 people each take the device for one ballot. | By headcount, the **largest group of humans who touch the app**, and the least prepared: no training, one interaction each, loud room, queue waiting. |
| **The room** | Reads the app without ever touching it. | Most visual requirements — portrait on a TV, contrast, color-blind palettes, "must not be distracting" — exist for these people. |
| **The dancing couple** | Reads the prompt from the floor, at a glance, then performs it. | The prompt stays on screen mainly for *them*, not for the operator's memory. |
| **The deck author** | Same person as the operator, but at home, unhurried, two hands free. | Three of five title-screen destinations belong to this context. |
| **The second organizer** | Receives a shared deck, or picks up the tablet mid-event. | Arrives with no context and no onboarding. |

There are no accounts and no logins. **The app never knows or cares who is holding it.**

### Three contexts, not one
1. **At home — calm.** Writing decks, saving rosters, receiving a shared deck. Two hands, no time pressure, no audience.
2. **At the venue — live.** Running the session. One hand, a room waiting, a person who is also hosting.
3. **In the crowd — passed around.** Voting. Untrained hands, impatient queue, one shot.

Most requirements in this document assume context 2. Contexts 1 and 3 are where the app is
most likely to be under-designed.

### The operator may be dancing
The operator can dance in the event, or not — both are normal. When their name comes up they
**put the tablet down or hand it to whoever is nearest**, and that must be a non-event.

**The rule: the app is never tied to a person.** Anyone who picks up the device continues
from exactly where it was left. This is the same requirement as crash recovery, and the same
mechanism satisfies both — a locked tablet, a swiped-away app, a dead battery, and a tablet
handed to a friend are indistinguishable from the app's point of view.

The interface consequences are captured as standing law in
[intent.md § Design principles](intent.md) and apply to **every version**, starting with v1.0.

### Audience: built for one, legible to others
v1 is built for the owner to run their own events, with the explicit hope that other
organizers use it later.

- **Build now** — because the mid-event handoff already demands it: self-evident live
  screens, plain labels, no hidden state. A friend must be able to **continue** the app.
- **Defer** — genuinely not needed yet: first-run tutorials, help text, onboarding, anything
  that teaches the format from scratch. A stranger does not yet need to **learn** the app
  unaided.

**One asymmetry to stay conscious of:** deck sharing (v1.4) is inherently a two-organizer
feature, so the mechanism for other organizers ships before the design for them does.

> **Revisit this section** when v1.4 ships, and again if anyone outside the owner's own
> events starts using the app. The user model is written for today, not for that world.

---

## How we'll know it worked

Success is stated in [intent.md](intent.md) as: the event runs smoothly, the organizer has
less hassle, and it's fun for everyone. Those are not directly measurable, so these are the
**observable signals** to watch for at the first real events:

**Good signs**
- A full session runs start to finish without the operator opening the roster editor to fix something.
- The room's attention turns to the screen during a draw, unprompted.
- The tablet changes hands and the new person just carries on.
- People talk about the prompts afterward.

**Warning signs**
- Anyone asks "who's next?" or "whose turn is it?" — the screen is not self-describing enough.
- The operator narrates what the app is doing — the same failure, louder.
- Re-spin gets used often — worth knowing *why* each time.
- The pass-around vote stalls, or people decline to vote.
- The night sags between the last dance and whatever ends it.

**v2 signals** — specifically watch for these; they decide the parked features in v2.0:
- The operator starts a fresh session with the same roster more than once in a night.
- Dancers ask to go again, or there's time left after the pass completes.
- Someone asks for a dance style other than West Coast Swing.

---

## Version roadmap

| Version | Theme | Why here |
|---|---|---|
| **v1.0** | **One complete session** | The smallest thing that solves the stated problem at a real event. |
| **v1.1** | Self-sufficiency | Run events without editing source. Cheap, and immediately wanted after event one. |
| **v1.2** | An ending | Closes the largest experiential hole for modest cost. |
| **v1.3** | The audience decides | The most complex feature in the product. Built with real-event knowledge. |
| **v1.4** | Sharing decks | Only matters once decks are worth sharing, which requires v1.1 plus content. |
| **v1.5** | Delight | Pure polish. Deliberately last; nothing depends on it. |
| **v2.0** | Parked | Genuinely undecided. Answered by use, not by planning. |

**Ordering rationale.** v1.1 before v1.2 because a tool you can't edit without a code editor
isn't finished, and authoring is far cheaper than the winner flow. v1.2 before v1.3 because
Mode A (the operator picks) closes the "night has no ending" hole for a fraction of the cost
of ranked voting. v1.4 after v1.1 because there is nothing worth sharing until decks can be
written. v1.5 last because sloth mode and audio are the only things in the product that
nothing else depends on — and the only things whose absence no one will notice.

---

## v1.0 — MVP: one complete session

**Goal:** run one real Jack & Jill, start to finish, on a tablet, with no internet.

### Core loop
1. Title screen → **Start a Session**.
2. Build the roster: names with roles.
3. Session starts: switches assigned, spin order fixed.
4. **Spin 1** draws from the first pool. **Spin 2** draws from the second pool.
5. The couple is revealed.
6. If prompts are on, **Spin 3** draws a prompt for that couple.
7. The couple dances in the spotlight. Screen holds on the prompt.
8. **Next Couple** → back to the wheel.
9. Repeat until the larger pool empties. Session complete.

Draws and dances **alternate**. Pairings are never drawn up front — the draw is part of the
show, not preparation for it.

### Roster

**What a roster is.** A **roster** is a saved list of dancers that the app remembers
permanently, across sessions and restarts. When a roster is loaded into a spin session, its
dancers become **the dancers in that session** — and only for that session. The session is a
working copy; the saved roster is the durable thing.

- The app **always remembers saved rosters**. Ending a session never discards one.
- Changes made to dancers during a session belong to that session. Whether they are written
  back to the saved roster is the operator's explicit choice, never automatic — a one-night
  guest should not silently join the regulars.
- **v1.0 as built collapses the two.** There is a single stored list, and editing it during a
  session edits the same object the session draws from. This is a deliberate simplification
  while the session loop is built; the separation arrives with multiple saved rosters in v1.1.

- Add and remove dancers; each marked **Leader**, **Follower**, or **Switch**.
- **Rename a dancer.** Typos happen, and a wrong name on the wheel is visible to the whole room.
  Renaming is confirmed before it applies.
- **Names must be unique, and must include a last name or at least a last initial.**
  "Sarah" is rejected; "Sarah M" is accepted. Validated at entry, with the reason shown.
- If two dancers still collide (same first name and last initial), the operator may **use a
  number in place of the last name** — "Sarah M 1", "Sarah M 2". Inelegant on purpose: it
  always works and takes a second.
- **One roster, persisted on the device.** Multiple saved rosters are v1.1.
- **Removing a dancer mid-session requires confirmation.** If removal unbalances the pools,
  the confirmation says so plainly — that the short pool will be recycled — *before* the
  removal happens. The operator is never surprised by recycling.
- A removed dancer who already danced **stays in the session log**. Their dance happened.

### Roles and switches
- Switches are **auto-balanced**: assigned to whichever pool is short, evening the two pools.
- **Assignment happens once, at session start, and is locked for the session.** A switch does
  not float between pools and never appears on both wheels. A dancer needs to know which role
  they are dancing tonight.
- **An all-switch roster is fine** — the app randomly splits it into two pools, randomizing
  both roles and the resulting couples.

### Spin order
- Set **once at session start**: leaders first, followers first, or let the app randomize and
  announce the result.
- **Locked for the whole session.** The room learns the rhythm of the draw; a changing order
  would read as a bug.
- **The wheel must always display which pool it is spinning** — *Now spinning: Followers*.
  That fact otherwise lives only in the head of whoever set it up.

### The wheel
- One wheel, reloaded with the appropriate pool between spins.
- Names rendered legibly on the wheel. **No adaptive rendering needed** — at most ~20 dancers,
  names always fit.
- Playful, colorful, bouncy. Landing is the moment; give it weight.

#### The last dancer in a pool
When a pool is down to one name the outcome is already known, and the room knows it too.
**The wheel still spins — and the app acknowledges the joke rather than pretending.**

- The spin happens, so the session's rhythm never breaks. The room has learned this rhythm over
  the whole night; skipping the spin at the end would land as a bug.
- **The app winks at it.** Different copy, and a spin that plays on the inevitability — slower,
  sillier, or comically brief. Exact copy and timing are a build-time detail to try on the device.
- The tone is *shared joke*, not *system message*. Everyone present already knows who it is; the
  app being in on it is funnier than the app being solemn about it.

### Pools, recycling, and why repeats are impossible
- A drawn dancer leaves their pool and stays out until everyone has danced.
- When one pool empties while the other still has dancers, the app **auto-recycles the short
  pool** — silently, no operator action — so nobody sits out.
- **No repeat-avoidance logic is needed, and none should be built.** The larger pool drains
  exactly once, so each of its dancers is drawn at most once; the smaller pool recycles, but
  each time is matched against a fresh, not-yet-drawn partner. A repeat needs *both* dancers
  to come around again, and the larger pool never does. Recycling cannot manufacture a repeat.
- Consequence: the app **tracks no pairing history**. The session log exists to be read, not
  to constrain draws.

### Re-spinning
The wheel is fine; the world around it isn't — a dancer stepped outside, is injured, declines,
or the operator double-tapped. One correction tool: **re-spin the current draw.**

- Discards the name just drawn and spins that pool again. The discarded dancer **returns to
  the pool immediately** and stays eligible.
- Applies only to a draw **in progress**. Once a couple is complete it stands. There is no
  undo of a finished pairing — this keeps the log honest.
- A dancer who genuinely cannot dance is handled by **removing them from the roster**, not by
  re-spinning around them each time.

### Prompts
- A prompt has **two parts**: a **short catchy name** (the headline, punchy enough to read off
  a spinning wheel) and a **brief description** of how the challenge works.
  > **A Whole New Level** — Dancers must add as many level changes to their dance as they can.
  > The more drastic the level change, the better.
- **On the wheel: the name only.** Descriptions don't fit on a wheel segment; the short name is
  doing real work, not just being fun.
- **On the reveal: both**, name large and bold, description beneath, sized for the room.
- **Built-in decks, read-only in v1.0.** Authoring is v1.1. The owner is also the developer and
  can edit deck contents in source before an event.
- **One prompt per couple**, drawn immediately after the couple forms.
- **Prompts do not repeat within a session.** A drawn prompt is out for the night.
- If the pool runs dry, the app **says so plainly** ("You've used all 24 prompts") and only then
  starts recycling. Exhaustion is surfaced, never silent.
- **Prompts are toggleable** — the app runs as a pure pairing tool with the wheel switched off.
- **The choice is made explicitly during setup**, on the roster screen, before the session starts.
  There is no default to discover: the operator sees a clear on/off control and picks.
- **Why asked rather than defaulted:** a default set the wrong way is only discovered mid-session,
  when changing it is disruptive. Asking costs one tap and makes the feature visible to a second
  organizer who has never seen the app — which a buried toggle would not.

### While the couple dances
The longest-lived state in the app: two or three minutes, up to ten times a night, on a screen
a room may be watching. It must **hold, not perform**.

- Shows **the prompt** (name and description) and nothing competing with it.
- Background uses the current theme's colors — it should still look like the app.
- **Must not be distracting.** No looping animation, no attention-seeking motion. The dancers
  are the show; the screen is a reference card. This is the deliberate exception to the app's
  "fun to watch" bias.
- **A single `Next Couple` button** returns to the wheel. **No timer, no auto-advance** — only
  the operator knows when a dance is over, and anything on a clock punishes a handoff.
- `Next Couple` must be the **most obvious control on the screen**. It is the one thing a
  stranger has to find instantly.

### Session log
- A running on-screen list of the session's pairings, so the operator can see who has danced.
- **Display-only and session-only.** Not exported, does not survive a new session, drives no logic.
- **Lives as a slide-up panel on the wheel screen** — tap to open over the wheel, tap to dismiss.
  It is never a destination the app navigates to.
- **Why a panel, not a screen:** a separate screen is one more place the tablet can be put down.
  Whoever picks it up would find a log instead of the wheel, with no idea what they were looking
  at — a direct violation of the self-describing principle at the exact moment it matters most.
- **Alternative held in reserve:** if the panel proves to crowd the portrait layout in real use,
  moving the log to its own screen is the fallback. Revisit after the first event; if it moves,
  the handoff problem above has to be solved rather than accepted.

### Ending a session
- **A session is one pass through the roster.** It ends when the **larger pool empties**.
- Starting a fresh session is a **clean slate**: pools refill, log clears, no memory of who
  danced with whom. Nothing carries over.

### Persistence and crash recovery
**The session is saved to the device continuously and the app always resumes exactly where it
left off.** A locked tablet, a dropped tab, a swiped-away app, a dead battery, or a handoff to
another person must not cost the night.

- Persist on **every state change** — each draw, each `Next Couple` — not on a timer. The event
  is slow, the writes are tiny.
- The saved session is cleared **only when the session ends** or the operator deliberately
  starts a fresh one.
- **Stored on the device in v1.0:** the roster, the built-in decks' used/unused state, and the
  in-flight session.

### Event size guidance
- **3 couples minimum for a normal session, 5 is the sweet spot, 10 is a hard maximum.** Past
  ten, the people who danced first are bored before the last pair takes the floor.
- Because the short pool recycles, **couples = the size of the larger pool** — so the cap is on
  the larger pool, not the headcount. Ten couples means roughly **20 dancers at the outside**.
- **The app says this, it doesn't just enforce it.** Surface the guidance while the roster is
  built, and warn as it grows past the sweet spot toward the maximum.
- Rosters below three couples get special modes in later versions (v1.1 and v1.3). In v1.0 the
  app simply warns.

### Screens in v1.0
| Screen | Notes |
|---|---|
| Title | Only **Start a Session** is live. Other destinations arrive in v1.1. Also the permanent home of the app title. |
| Roster setup | Add/remove/role, validation, size guidance, spin-order choice. |
| Wheel | Labeled with the pool being spun. Re-spin available. |
| Couple reveal | Both names, big. |
| Prompt reveal | Name and description. |
| Dance hold | Prompt + `Next Couple`. |
| Session log | Reachable during the session. |
| Session complete | End of the pass. No winner in v1.0. |

### Explicitly not in v1.0
The winner feature in any form, deck authoring, deck sharing, the all-skate, sloth mode, audio,
color-blind palettes, multiple saved rosters, adding a dancer mid-session, the announce-a-re-spin
option, and the one- and two-couple special modes.

**What cutting the winner costs:** the night loses its ending. This is the largest experiential
hole in v1.0, closed by the operator announcing a winner out loud — which is what happens today
anyway. It is cut because it is by a wide margin the most complex thing in the product, and
building it after a real event means building it with real knowledge.

### Open questions — v1.0
**None. All three resolved 2026-08-25** — prompts asked during setup, session log as a slide-up
panel, last-dancer spin with a special treatment. v1.0 is fully specified and ready to build.

---

## v1.1 — Self-sufficiency

**Goal:** run events without touching source code.

- **Create Decks** — full prompt and deck authoring. The editor captures **both** fields and
  must not save a prompt with either blank.
- **The session prompt pool.** A session draws from a live pool, not a deck directly.
  - **Adding a deck mid-session merges it into the pool** — it does not replace or reset anything.
  - **Prompts already drawn stay out.** Used-prompt tracking is **session-scoped, not
    deck-scoped**; re-adding a deck can never resurrect a spent prompt.
  - If the same prompt appears in two decks it counts as one — **match on name**, so a duplicate
    cannot sneak back in through a second deck.
- **Three built-in decks ship**, all editable: **West Coast Swing starter**, **Sudden Death**
  (harder, for head-to-head), **All Skate** (silly, low-pressure, whole-floor).
- **Saved Rosters / Data** — multiple named rosters, saved indefinitely with each dancer's role.
  This is where the roster/session split defined in v1.0 above becomes real: loading a roster
  copies its dancers into the session, and write-back is an explicit action.
  Mid-session edits affect the live session; writing them back to the saved roster is the
  operator's explicit choice, never automatic. A one-night guest shouldn't silently join the regulars.
- **Options screen** — the configurable layer on top of the always-on accessibility baseline:
  - **Color-blind palettes** that shift the bright default scheme into distinguishable ranges.
  - **Large touch targets.** When switched on, *every* control in the app is raised to a minimum
    of **56px**, including ones deliberately slimmed for visual hierarchy (the `Edit dancers`
    button being the first such case — see D-025). Off by default, because the slimmer treatment
    is what makes secondary controls read as secondary; on by request, because hierarchy is worth
    less than being able to hit the thing.
- **Add a dancer mid-session.** Requires confirmation, like removal. A switch added mid-session
  is assigned to whichever pool is short at that moment, and locked from then on.
- **Announce a re-spin.** Per re-spin, the operator chooses whether the room is told
  ("Re-spinning — Marco is sitting out") or it happens silently. Announcing protects the draw's
  credibility when a name visibly disappears; silence is kinder when the reason is personal.
- **Prompt-only mode (one couple).** With a single pairing there is nothing to draw and nothing
  to judge: the pairing wheel is put away and the app becomes just the prompt wheel. Two people
  practicing together is a real way this app will be used.
- Full title screen: **Start a Session · Create Decks · Saved Rosters / Data · Options**
  (Share/Receive Decks arrives in v1.4).

### Open questions — v1.1
- Should a saved roster remember its **last-used deck and prompts on/off**, or is that per-session?
- When a deck is edited **mid-session**, do the edits affect the live pool immediately?

---

## v1.2 — An ending

**Goal:** give the night a finish, cheaply.

- **Winner — Mode A (operator's choice).** The operator picks. How they decided is entirely
  off-app: their own judgment, a panel, applause. The app records and reveals it.
- **The curtain.** The winner must stay secret on a device the room may be watching.
  1. Operator triggers the winner step; the display immediately drops a **full-screen illustrated
     curtain**.
  2. The curtain is **softly animated** — a gentle sway, never static. This is functional, not
     decorative: a frozen screen in front of a room reads as a crashed app.
  3. Behind it, the winner is decided.
  4. The operator triggers the reveal: **curtains part with a countdown**, then the winning
     couple's names land big with celebration effects.
- **All-skate finale (optional).** After the reveal, the operator can trigger one last spin:
  everyone dances one prompt together. No pairs, no spotlight, no judging, no winner.
  - **Operator-triggered, never automatic.** Some nights end better on the crown.
  - **Source:** the session's prompt pool, or the built-in **All Skate** deck.
  - **Three draw modes:** **Full Random** (spins across everything, including prompts already
    danced — a crowd favorite can come back, which is often the better ending); **Surprise Me**
    (only prompts not yet used); **Choose** (no spin — the operator picks any prompt directly
    from a list, used or unused, with used ones marked). Choose is the only place in the app
    where a prompt is selected rather than drawn.
  - However it is landed on, **the reveal looks identical**. Only the operator knows.
  - If Surprise Me is chosen and everything is spent, the app says so and offers Full Random.
  - Works **even with prompts switched off** — the operator opts in deliberately and nobody is
    being judged.

### Open questions — v1.2
- **What does the curtain say in Mode A?** "VOTING IN SESSION" is written for the audience vote
  and would be a lie here.
- Does the curtain make sense **when not casting to a TV** — is it theatre, or just a delay
  between the operator and their own screen?

---

## v1.3 — The audience decides

**Goal:** hand the ending to the room. The most complex feature in the product.

- **Mode B — audience ranked vote.** The room votes by passing the device around.
- **Voters rank their top 3 only.** 1st = 3 points, 2nd = 2, 3rd = 1; highest total wins
  (a Borda count). Unranked couples score zero.
- **Rank up to 3, capped by couples in contention** — a two-couple revote asks for a top 2.
- Why three: with up to ten couples, ranking the full field stalls the pass-around, and the
  pass-around is what risks the event's pace.
- Borda because it rewards broad appeal over a passionate minority, and is easy to explain.
- **Tallies are never displayed** — not during, not at the reveal, not after. Only the winner is
  shown. Nobody learns they came last.
- **The ballot resets after every vote**, clearing to a fresh empty ballot so the device hands
  straight along with nothing to tap first and nothing left on screen.
- No voter's screen may reveal how anyone before them voted.
- **A dancer who danced twice appears twice, as two separate couples** — different pairings that
  produced different dances, scored independently.
- **The app warns** that this mode suits roughly **10–20 voters**, at the moment the mode is
  selected, not buried in settings.
- **Closing the vote:** a **vote cap** set up front, or **manual**. Either way, an **`End Voting`
  button is always available** — the escape hatch for a head count off by two, someone wandering
  off mid-circulation, or a cap set too high. Without it, cap mode can strand the operator in
  front of a waiting room.
  - **Deliberately hard to hit but easy to find.** Resistant to a stray thumb is not the same as
    hidden — a second operator may be exactly the person who needs it.
  - **Gated behind a confirmation** that says what is about to happen.

### Keeping the vote off the TV
**Intent: the TV shows only the swaying curtain while the ballot lives on the tablet.**

- **Where it works — a true second screen.** When the app can drive the TV as its own display
  (a cast session or connected external display, via the Presentation API), it sends different
  content to each: curtain to the TV, ballot to the tablet. This is the supported path.
- **Where it cannot work — OS screen mirroring.** AirPlay mirroring and Android "cast screen"
  copy the display wholesale. **No popup, overlay, or layer can be hidden from them.** This is
  an operating-system behavior, not something the app can code around.
- **What the app does:** detect what it has; if there's no true second screen, **warn before
  voting opens** that the ballot will be visible and the operator should pause mirroring for the
  vote and resume for the reveal. **Never claim privacy it cannot deliver.**
- Regardless: keep the voting panel visually compact rather than full-bleed, and never show a
  running tally or any prior voter's choices.
- Platform support varies — notably Safari on iPad has no Presentation API, so an iPad over
  AirPlay is mirroring-only. The app degrades to the warning rather than breaking.

### Ties
The app does **not** decide. It presents the tied couples with three options and lets them choose:

1. **Coin flip** — the app decides at random, with its own suspense.
2. **Share the win** — all tied couples are crowned; the reveal shows every name together.
3. **Sudden death** — the tied couples dance again, **at the same time, battle style**, all
   dancing the same new prompt. The one moment the spotlight is shared.

- **Three or more couples can tie**, and the flow is unchanged — every tied couple goes into
  sudden death together. The field is never narrowed first.
- **Couples may opt out.** Withdrawing removes them from contention. If opt-outs leave one couple
  standing, that couple wins outright.
- **If every tied couple opts out, nobody wins** — and the app leans in rather than erroring: a
  **crying sloth** and **NO WINNER** in big bold text, with a defeated sound. A deliberate joke
  ending, not a failure state. (This sloth appears in **both** themes — it predates the easter
  egg and is not a hint toward it.)

### Sudden death rules
- **Always uses a prompt**, even when prompts are off for the event — the prompt is what makes
  the rematch a fair, comparable head-to-head.
- Therefore the app must **warn the couples before they choose it** that sudden death requires a
  prompt, explicitly noting this holds even with prompts off. A couple that opted out of prompts
  all night should never be ambushed — and this warning is exactly when a couple might opt out instead.
- **Prompt source is the operator's choice:** the session's prompt pool (with everything already
  danced still excluded), or the built-in **Sudden Death** deck. With prompts disabled there is
  no pool, so that option falls back to the last-used deck, then the WCS starter.
- **After the sudden-death dance**, winner selection reopens, scoped to the couples who danced it.
  The operator picks Mode A or Mode B; it need not match what was used earlier. If that also ties,
  the same three options are offered again.
- **Two-couple rosters enter sudden death automatically.** There is no point running a two-couple
  pass and then a vote — that *is* a head-to-head. **The app warns while the roster is being
  built**, not at the start button, so the operator can add dancers if that wasn't the intent.

### Open questions — v1.3
- **How is the ballot ordered?** Draw order, random per voter, or fixed? Ranked ballots have known
  order bias, and this decides whether the app inherits it.
- **Can the operator vote?** They're a dancer too, often.
- **What happens if a voter walks off with the tablet** or abandons a half-filled ballot — does it
  reset on a timeout, and does that violate the no-timers rule?
- Should the app show **how many ballots have been cast** so far, given tallies are secret?

---

## v1.4 — Sharing decks

**Goal:** hand a deck to another device. All methods work with **no server and no internet**.

- **QR code** — one device displays, the other scans. The primary method: nothing to send,
  nothing to install, works with dead venue wifi. **Capacity is tighter than it looks** — each
  prompt carries a name *and* a description, so a realistic deck fits perhaps **15–30 prompts**
  per code rather than the 50–100 a name-only prompt would allow. The app must **measure the
  actual deck**, detect when it won't fit, and steer the user to another method rather than
  producing an unscannable code.
- **File export/import** — save a deck to a file, send it by AirDrop, email, chat, anything. No
  size limit; the fallback for large decks.
- **Share code** — a block of text copied into any messaging app and pasted back in on the other side.
- **Importing is non-destructive** — an incoming deck is **added alongside** existing decks, never
  silently overwriting one with the same name.
- Adds **Share / Receive Decks** to the title screen.

### Open questions — v1.4
- What happens on **import of a deck you already have** — duplicate, merge, or rename?
- Should a shared deck carry **attribution** (who wrote it), given there are no accounts?

---

## v1.5 — Delight

**Goal:** the parts nothing depends on. Deliberately last.

### Sloth theme (hidden easter egg)
A second full theme — still colorful and playful, but **sloth-themed throughout**: sloth artwork,
sloth-flavored copy, sloths in the wheel, the curtain, and the celebration.

- Not just a reskin — **the animations and sound effects get sillier**. The wheel can wobble,
  lurch, or slow absurdly before landing; the reveal can flop in rather than pop; the celebration
  and defeat sounds lean goofier. Where the default theme is fun, sloth mode is ridiculous.
- **Silly and clear, both.** Sloth mode is held to every design principle the default theme is:
  names legible, labels plain, contrast and touch targets honest, screen still self-describing.
  The wheel may lurch absurdly on its way to a name — it must still land on a name anyone can read.
  **Ridiculousness is added on top of clarity, never traded against it.**
- **Deliberately undiscoverable.** Nothing in the normal UI hints it exists — no settings entry,
  no toggle, no menu item. Someone else operating the app should never stumble in or wonder what
  they're missing.
- **Two unlocks:** **seven taps on the app title** (quick, one-handed, works mid-event; the same
  seven taps toggle it back off), or **adding "Dakota Gibbs" / "Dakota G" to the roster**
  (case-insensitive, whitespace-tolerant). The name **stays on the roster as a real dancer** — it
  is not consumed, since that person may genuinely be dancing.
- **Survival is opt-in.** While sloth mode is active the app asks once — at session end, or on the
  way out — whether to keep it. **Yes** → remembered across sessions. **No** → reverts immediately.
  **No answer** (dismissed, ignored, app closed) → **reverts**. Silence always means revert.
  - That rule doubles as the safety net: a web app cannot reliably intercept being closed, so
    best-effort detection is fine — worst case is the intended default. **Session end is the
    reliable hook** and the one that must work.
- **Toggling off fully re-locks it** — it is never "unlocked and available" as a known setting.
- Removing the trigger name from the roster does **not** switch the theme off. Unlocking and
  disabling are separate acts.

### Assets — licensing before aesthetics
Sloth artwork and all sound effects use **free assets, CC0 or equivalently permissive only.**

- **Never use non-commercial (CC-BY-NC) assets**, even though v1.5 is free today. If the app is
  ever monetized, every NC-licensed asset must be found and replaced — a full re-illustration.
  Choosing CC0 now costs nothing; choosing NC now is a trap that springs later.
- **CC-BY is acceptable** but requires visible attribution, so it implies a credits screen.
- **Keep a credits/licensing file in the repo**, updated as each asset is added. Reconstructing
  asset provenance after the fact is miserable.
- Sources: OpenGameArt and Kenney.nl (CC0), freesound.org (filter to CC0), Public Domain Vectors.
- **Paid or commissioned art stays an open door** — roughly $10–50 per stock asset, or $150–800 for
  a commissioned sloth set. The roadblock is legal, not financial: commissioned work needs an
  explicit written license permitting commercial use, agreed **before** payment. Without it the
  project is in the same position as an NC asset.

See [costs-and-monetization.md](costs-and-monetization.md).

### Audio
- **Full sound design, muted by default.** Spin whirr, ticking as the wheel slows, a reveal sting,
  the winner celebration — all exist, but the app starts silent with an obvious mute toggle.
- The venue almost always has music playing. Sound is opt-in for moments the operator judges worth
  it, rather than something to scramble to switch off.

### Open questions — v1.5
- Does sloth mode persist **per device** or should it be attached to a saved roster?
- If the tablet changes hands while sloth mode is on, the new operator inherits a sloth-themed app
  with no explanation and no visible way out. Acceptable, or does it need an escape?

---

## v2.0 — Parked pending real-world use

### Multiple rounds over one roster
**The question:** should a session run a second or third pass over the same roster, remembering
who already danced with whom?

**Why parked, not rejected.** A single pass is enough for an event that ends when everyone has
danced. Whether operators reach for a second pass is genuinely unknown and better answered by
running v1.0 in a room than by guessing.

**What building it would cost — analysis already done, so it needn't be redone.** In v1 repeats
are impossible *by construction*. **A second round breaks that guarantee** and drags in everything
v1 gets for free:

1. **Pairing history must be tracked and stored** across rounds within a session.
2. **A fallback rule is required for exhaustion.** With N leaders and N followers, everyone can
   dance everyone in exactly N rounds; on round N+1 no non-repeat partner exists. Small rosters
   hit this fast. Options: announce and allow repeats, allow silently, or prefer the longest-ago partner.
3. **The wheel can strand a dancer long before exhaustion.** Avoiding repeats is a *global*
   constraint, but the wheel draws one couple at a time. If Zoe's only valid partner is Marco and
   the wheel pairs Marco elsewhere first, Zoe is stranded even though a valid arrangement existed.
4. **Fixing (3) means steering the draw** — quietly removing candidates that would dead-end. That
   works, but the wheel is then curated rather than random while the room believes it is watching
   chance. v1 chose **honest randomness with no steering**; revisiting that is a values decision,
   not a technical one.

**If built:** decide (2) then (4), in that order, and revisit whether the app should tell the room
that repeats are now possible.

### Additional dance styles
West Coast Swing is the only shipped style. The prompt system is deck-agnostic so others slot in
without rework, but no second style is chosen. Operators who want one can write their own deck.

### Open questions — v2.0
- Which style comes second, and does the app **ship** those decks or just let operators build them?
- Does a second style need anything beyond a deck — different prompt vocabulary, different event
  shape, a different sweet-spot size?
