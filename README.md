# STARMAKER

A music-industry sim. Write songs, work a day job to fund it, gig to build a
crowd, and hope a record travels.

**v1 — early.** No avatars, no story, no bloat. Just the loop.

## Play

```bash
npm install
npm run dev      # → http://localhost:5173
```

Or build the single file and double-click it:

```bash
npm run single   # → starmaker.html (no server needed)
```

## The loop

| Tab | What you do |
| --- | --- |
| **Studio** | Press write. A session runs on a timer (1:30 at the start, faster as Songwriting rises) and the finished song drops into the vault by itself. |
| **Vault** | Rename anything unreleased. Release singles, or pick any number of songs — one is a single, five is an album. Albums refresh the lifespan of everything on them and carry their own reach figure. |
| **Work** | Jobs pay the bills. Three listings at a time, re-rolled every 80 seconds, one shift running at once, 8–30 seconds a shift. Gigs pay, bring fans, and double your streaming for two minutes. |
| **Biz** | Buy a better studio (raises the floor on every song), run promotion (five minutes of 2× reach), watch the numbers. |

## Numbers

Four things matter: **cash, fans, streams, reach**.

- **Songwriting** — how fast you write, and how good the songs land.
- **Virality** — how *wide* your records go and how *long* they last. The headline
  "reach / life" figure is your catalogue's average reach and, next to it, the
  hours each record keeps earning.
- **Fans** come from streams, and streams come from reach. Without reach a good
  song just sits there.
- Songs decay: `exp(-age / lifespan)`. An album restarts that clock.

## Dev

```bash
npx tsc --noEmit                     # types
npm run smoke                        # mounts the real app in jsdom, clicks through
npx esbuild scripts/sim.ts --bundle --platform=node --format=esm \
  --outfile=.cache/test/sim.mjs && node .cache/test/sim.mjs   # pacing curve
```

Timers are wall-clock (`Date.now()`), so closing the tab does not freeze the
world and progress resumes on reopen. Everything lives in `localStorage`
under `starmaker.v1.save`.

Balance knobs sit at the top of `src/game/data.ts`.
