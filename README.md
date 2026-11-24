# STARMAKER

A music-industry life & idle simulator for the browser. You start with $750, a bedroom, and 32
followers — and try to end up with a catalog, a label, a cabinet of awards, and an island.

It's a mash-up of the three games that defined the genre:

| Reference | What it contributes |
| --- | --- |
| **Music Star Idle Life Simulator** | Idle/offline streaming income, energy, weekly charts, label negotiation, awards, fortune-spending |
| **Music Star – Life Simulator** | Skill training, one-session songwriting, music videos, albums, health/age, legacy |
| **Music Wars Rockstar** | Rival artists, beef meters, diss tracks, collabs, features, social following |

## Running it

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production bundle
npm run smoke   # headless render test of every screen (jsdom)
```

Progress saves to `localStorage` every few seconds. Closing the tab does not stop the world —
streams, royalties, fans and tours keep running while you're gone (capped at ~12 game weeks,
and only the *calendar* slows, so deadlines never slip past you).

## The loop

1. **Write & record** in the Studio. Quality is rolled from your five skills, the producer you
   hire, your studio tier, genre fit, health, and a little luck.
2. **Release**. Singles chart individually; albums gather tracks and keep streaming for months.
3. **Grow**. Streams convert into followers, followers into fame, fame into tours, deals and awards.
4. **Spend**. Studio gear, producers, playlist placement, radio rotation, features, cars, jets.
5. **Retire** and pass the name to the next generation for a legacy head start.

## Systems

- **Time** — 1 real second ≈ 1 game hour, ×1/×2/×4, pausable. Weeks roll over on Sunday and the
  Hot 100 / Albums / Artists charts are re-cut from that week's streams.
- **Energy** — every meaningful action costs it; it regenerates 3.1/hour. Sleep resets it.
- **Skills** — songwriting, vocals, performance, production, charisma. Returns diminish, so the
  last 20 points of any skill are the expensive ones.
- **Hype & exposure** — hype multiplies every stream a song earns and decays constantly. Run
  exposure too hot and a scandal hits.
- **Churn** — big audiences leak. Holding 10M followers requires a live catalog and momentum;
  the churn term scales as `followers^1.45`.
- **Rivals** — twelve artists with their own fame curve that rubber-bands toward yours, so the
  charts stay competitive. Compliment, collab, subtweet or drop a diss track.
- **Labels** — advance vs. royalty vs. album commitment. Push terms, walk away, or sign and buy
  your masters back later.
- **Awards** — a ceremony every 13 weeks. Mostly you lose to a famous name.

## Code map

```
src/game/types.ts    all state shapes
src/game/data.ts     genres, producers, assets, tours, labels, name generators
src/game/engine.ts   pure simulation: streams, churn, charts, awards, ticking
src/game/store.tsx   reducer (all player actions), save/load, clock
src/screens/*        one file per tab
src/components/      shared UI: album art, portrait SVG, sheets, bars
```

The engine is pure and framework-free — `advance(state, hours)` returns a new state. That's what
makes offline catch-up, the balance simulations in `scripts/`, and the headless smoke test possible.
