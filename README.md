# JnJ Wheel Spinner

A spinning wheel for social Jack & Jill partner draws: spin for a leader, spin for a follower, then
a challenge for the couple, with the whole room watching. Built for West Coast Swing social nights,
and since 0.15.0, a Quick list for practice groups that just want fair pairings fast.

**Use it:** https://gdakota222.github.io/jnj-wheel-spinner/ — open it once online and install it to
your home screen (Chrome on Android, Safari on iPhone and iPad). After that it runs with no signal.
No accounts, no ads, no server: everything stays on the device.

## Docs

| Doc | What it holds |
|---|---|
| [intent.md](docs/intent.md) | Why it exists, the design principles, permanent non-goals |
| [prd.md](docs/prd.md) | What gets built, version by version |
| [build-tracker.md](docs/build-tracker.md) | What actually shipped, and every decision with its reasoning |
| [stack.md](docs/stack.md) | Technical choices |
| [rehearsal.md](docs/rehearsal.md) | Device testing, the first real event, the handoff rehearsal |
| [prompts.md](docs/prompts.md) | Every challenge, current and archived |
| [costs-and-monetization.md](docs/costs-and-monetization.md) | What it costs to run, and the asset licensing rule |
| [share/](docs/share/) | Install-and-run guide to send another organizer — Word for Drive, text for a message |

## Development

Vite, React and TypeScript, installed as a PWA via vite-plugin-pwa.

```bash
npm install
npm run dev       # local dev server (no service worker in dev, D-021)
npx vitest run    # domain-logic tests
npm run lint
npm run build
npm run share     # regenerate the organizer guide in docs/share/
```

Every push to `main` deploys to GitHub Pages.

Made by Slow Jam Labs. Tips: [ko-fi.com/slowjamslabs](https://ko-fi.com/slowjamslabs).
