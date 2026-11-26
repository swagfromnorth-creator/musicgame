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
| **Studio** | Press write and a session runs on a timer (1:30 at the start). Train one skill at a time — each level takes longer than the last, up to 100. |
| **Vault** | Click any single or album to open it: rename it, book a promotional push, release it. Pick any number of songs for an album — one is a single, five is an album. |
| **Work** | Jobs pay the bills. Three listings at a time, re-rolled every 80 seconds, one shift running at once. The work on offer is decided by your audience. Gigs pay, bring fans, and double your streaming for two minutes. |
| **Biz** | Buy a better studio (raises the floor on every song), run a five-minute ad campaign (2× reach on everything), watch the numbers. |

## Numbers

Four things matter: **cash, fans, streams, reach**.

- **Songwriting** — the number a finished song lands on.
- **Rhythm** — how fast you write. 1:30 becomes 0:40 with both speed skills maxed.
- **Virality** — how *wide* your records go and how *long* they last. The headline
  "reach / life" figure is your catalogue's average reach and, next to it, the
  hours each record keeps earning.

Skills only move by training: one at a time, and level *n* takes `10s × 1.045^n`
(≈1:30 at 50, ≈6 minutes at 90).
- **Fans** come from streams, and streams come from reach. Without reach a good
  song just sits there.
- Songs decay: `exp(-age / lifespan)`. An album restarts that clock.

## Promotion

Every single and every album can be opened before release and attached to a
promotional push — local, regional, national, global. The sheet shows the base
reach, the reach you are buying, and the total. **Nothing is charged until the
record actually comes out.**

## Work

Job listings are tiered by fan count: bar work at zero fans, session playing at
500, studio and jingle work at 5,000, brand deals and sync licences at 50,000.
Past that the work stops improving — by then you should be living off records.

## Dev

```bash
npx tsc --noEmit                     # types
npm run smoke                        # mounts the real app in jsdom, clicks through
npx esbuild scripts/sim.ts --bundle --platform=node --format=esm \
  --outfile=.cache/test/sim.mjs && node .cache/test/sim.mjs   # pacing curve
```

Timers are wall-clock (`Date.now()`), so closing the tab does not freeze the
world and progress resumes on reopen. Everything lives in `localStorage`
under `starmaker.save`.

Saves are treated as untrusted input: `sanitizeSave()` fills in or drops
anything it does not recognise (including the older flat-skill format), and an
error boundary catches anything that still gets through, so a bad save can
never leave you staring at a black screen.

Balance knobs sit at the top of `src/game/data.ts`.
