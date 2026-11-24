import { fameTier, money, ui } from '../game/data'
import {
  fameOf,
  genreOf,
  gradeFor,
  incomePerHour,
  streamsPerHour,
  totalStreamsPerHour,
  weekOf,
} from '../game/engine'
import type { GameState } from '../game/types'
import { Art, Bar, PortraitArt, Sparkline, Stat } from '../components/Shared'
import { useGame } from '../game/store'

export function Home({ s, go }: { s: GameState; go: (tab: string) => void }) {
  const fame = fameOf(s)
  const tier = fameTier(fame)
  const perHour = totalStreamsPerHour(s)
  const income = incomePerHour(s)
  const top = [...s.songs].filter((x) => x.released).sort((a, b) => b.streamsLastHour - a.streamsLastHour).slice(0, 4)
  const myRank = s.charts.artists.findIndex((a) => a.mine) + 1
  const bestPeak = s.songs.reduce((acc, x) => (x.peak ? Math.min(acc, x.peak) : acc), 999)
  const nextWeekIn = Math.ceil((weekOf(s.hour) * 168 - s.hour))
  const unreleased = s.songs.filter((x) => !x.released)
  const today = Math.floor((s.hour % 168) / 24) + 1

  return (
    <>
      <div className="hero">
        <div className="row" style={{ gap: 13, alignItems: 'flex-start' }}>
          <PortraitArt p={s.portrait} size={70} hue={s.hue} />
          <div className="grow">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  {s.artistName}
                </div>
                <div className="muted tiny">
                  {genreOf(s.genre).emoji} {genreOf(s.genre).name} · age {s.age} ·{' '}
                  {s.label ? s.label.name : 'Independent'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="hero-fame">{Math.round(fame)}</div>
                <div className="tiny" style={{ color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 9, fontWeight: 700 }}>
                  Fame
                </div>
              </div>
            </div>
            <div style={{ marginTop: 9 }}>
              <div className="row between tiny" style={{ marginBottom: 4 }}>
                <span className="chip pink" style={{ fontSize: 9.5 }}>
                  {tier.name}
                </span>
                {tier.next && (
                  <span className="muted" style={{ fontSize: 9.5 }}>
                    {Math.round(tier.progress * 100)}% → {tier.next.name}
                  </span>
                )}
              </div>
              <Bar value={tier.progress * 100} color="linear-gradient(90deg,#ff2d78,#a855f7)" height={5} />
            </div>
          </div>
        </div>

        <div className="grid3" style={{ marginTop: 14 }}>
          <Stat k="Cash" v={money(s.money)} color="#f8d98b" />
          <Stat k="Followers" v={ui(s.followers)} color="#7dd3fc" />
          <Stat k="Listeners" v={ui(s.listeners)} color="#c4b5fd" />
        </div>
        <div className="row between" style={{ marginTop: 10, gap: 8 }}>
          <div className="tiny muted">
            <b style={{ color: '#e9e8f2' }}>{ui(perHour)}</b> streams/hr ·{' '}
            <b style={{ color: '#86efac' }}>{money(income)}</b>/hr
          </div>
          <button className="chip" onClick={() => go('charts')}>
            {myRank && myRank <= 40 ? `Artist #${myRank}` : 'Unranked'} · Week {s.week}
          </button>
        </div>
      </div>

      {s.tour && (
        <div className="card" style={{ marginTop: 12, borderColor: 'rgba(139,92,246,.4)' }}>
          <div className="row between">
            <div>
              <div className="opt-title">🎤 {s.tour.name} — {s.tour.city}</div>
              <div className="opt-sub">
                {s.tour.totalNights - s.tour.nightsLeft}/{s.tour.totalNights} nights played · +
                {money(s.tour.payoutPerNight)} per night
              </div>
            </div>
            <span className="chip violet">
              {s.tour.nightsLeft} left
            </span>
          </div>
          <div style={{ marginTop: 9 }}>
            <Bar
              value={((s.tour.totalNights - s.tour.nightsLeft) / s.tour.totalNights) * 100}
              color="linear-gradient(90deg,#8b5cf6,#22d3ee)"
              height={5}
            />
          </div>
        </div>
      )}

      {s.pending && (
        <button
          className="card glow"
          style={{ marginTop: 12, width: '100%', textAlign: 'left', display: 'block' }}
          onClick={() => go('studio')}
        >
          <div className="row between">
            <div className="grow">
              <div className="chip green" style={{ marginBottom: 6 }}>
                Ready to release
              </div>
              <div className="opt-title" style={{ fontSize: 15 }}>
                “{s.pending.title}”
              </div>
              <div className="opt-sub">
                {genreOf(s.pending.genre).name} · {s.pending.producer}
              </div>
            </div>
            <span className="grade" style={{ background: `${gradeFor(s.pending.quality).color}22`, color: gradeFor(s.pending.quality).color, width: 34, height: 34, fontSize: 17 }}>
              {gradeFor(s.pending.quality).label}
            </span>
          </div>
        </button>
      )}

      <NextMoves s={s} go={go} />

      <div className="section-title">
        <h2>This Week</h2>
        <div className="line" />
        <span className="tiny muted">
          Day {today} · resets in {nextWeekIn}h
        </span>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <div className="h2" style={{ marginBottom: 3 }}>
              Hot 100
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {findBestRank(s) > 0 ? `#${findBestRank(s)}` : 'No entry'} <span className="muted tiny">best single</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="h2" style={{ marginBottom: 3 }}>
              Career peak
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: bestPeak <= 10 ? '#f8d98b' : undefined }}>
              {bestPeak === 999 ? '—' : `#${bestPeak}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="h2" style={{ marginBottom: 3 }}>
              Awards
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {s.awards.filter((a) => a.won).length}
              <span className="muted tiny">/{s.awards.length}</span>
            </div>
          </div>
        </div>
        {(() => {
          const mine = s.charts.songs.filter((x) => x.mine).slice(0, 3)
          if (!mine.length) {
            return (
              <div className="empty" style={{ paddingBottom: 4 }}>
                Release a single to enter this week's chart.
              </div>
            )
          }
          return (
            <div className="list" style={{ marginTop: 6 }}>
              {mine.map((e) => {
                const rank = s.charts.songs.findIndex((x) => x.key === e.key) + 1
                return (
                  <div key={e.key} className="list-row">
                    <div className={`rank ${rank === 1 ? 'top1' : rank <= 10 ? 'top10' : ''}`}>{rank}</div>
                    <div className="grow">
                      <div className="truncate" style={{ fontWeight: 600, fontSize: 12.5 }}>
                        {e.title}
                      </div>
                      <div className="tiny muted">{ui(e.score)} streams this week</div>
                    </div>
                    <span className="tiny" style={{ color: '#c4b5fd' }}>
                      {ui(e.score / Math.max(1, s.hour % 168))}/h
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      <div className="section-title">
        <h2>On Rotation</h2>
        <div className="line" />
        <button className="chip" onClick={() => go('studio')}>
          Studio →
        </button>
      </div>

      {top.length === 0 ? (
        <div className="card">
          <div className="empty">
            No music out yet.
            <br />
            Head to the studio and record something. Anything.
          </div>
        </div>
      ) : (
        <div className="card tight">
          <div className="list">
            {top.map((song) => (
              <div key={song.id} className="list-row">
                <Art hue={song.hue} label={song.title} size={40} />
                <div className="grow">
                  <div className="truncate" style={{ fontWeight: 600, fontSize: 12.5 }}>
                    {song.title}
                  </div>
                  <div className="tiny muted">
                    {ui(song.streams)} streams · {song.peak ? `peaked #${song.peak}` : 'unranked'}
                  </div>
                </div>
                <div style={{ width: 54 }}>
                  <div className="tiny" style={{ color: '#ff9ec4', textAlign: 'right', fontWeight: 700 }}>
                    {ui(song.streamsLastHour)}/h
                  </div>
                  <Sparkline
                    data={[0.2, 0.5, 0.8, 1, 0.9, 0.7, 0.55, 0.45].map(
                      (x) => x * (song.streamsLastHour || 1),
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unreleased.length > 0 && (
        <>
          <div className="section-title">
            <h2>In the Vault</h2>
            <div className="line" />
            <span className="tiny muted">{unreleased.length} tracks</span>
          </div>
          <div className="card tight">
            <div className="list">
              {unreleased.slice(0, 3).map((song) => (
                <button key={song.id} className="list-row tap" onClick={() => go('studio')}>
                  <Art hue={song.hue} label={song.title} size={36} />
                  <div className="grow">
                    <div className="truncate" style={{ fontWeight: 600, fontSize: 12.5 }}>
                      {song.title}
                    </div>
                    <div className="tiny muted">unreleased · {genreOf(song.genre).name}</div>
                  </div>
                  <span className="chip">{gradeFor(song.quality).label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-title">
        <h2>The Feed</h2>
        <div className="line" />
      </div>
      <div className="card tight">
        {s.log.slice(0, 9).map((l) => (
          <div key={l.id} className={`feed-item ${l.kind}`}>
            <span className="t">W{weekOf(l.hour)}</span>
            <span className="grow">{l.text}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function NextMoves({ s, go }: { s: GameState; go: (tab: string) => void }) {
  const fame = fameOf(s)
  const moves: { icon: string; title: string; sub: string; tab: string; cta: string }[] = []

  if (s.energy < 18) {
    moves.push({
      icon: '🛌',
      title: 'You are running on empty',
      sub: 'Rest or skip a day. Tired artists write bad songs.',
      tab: 'career',
      cta: 'Recover',
    })
  }
  if (s.money < 700 && !s.tour && s.songs.filter((x) => x.released).length < 8) {
    moves.push({
      icon: '🎪',
      title: 'You need cash',
      sub: 'Play local shows for a cut of the door, or book a van tour.',
      tab: 'career',
      cta: 'Get paid',
    })
  }
  if (s.pending) {
    moves.push({
      icon: '🚀',
      title: `“${s.pending.title}” is sitting there`,
      sub: 'Release it. Hype decays and nobody streams a vault track.',
      tab: 'studio',
      cta: 'Release',
    })
  }
  if (s.songs.filter((x) => x.released).length === 0) {
    moves.push({
      icon: '🎙️',
      title: 'You have no music out',
      sub: 'Book a session and record your first single. It will be rough.',
      tab: 'studio',
      cta: 'Record',
    })
  }
  if (s.songs.filter((x) => !x.released).length >= 3 && !s.albums.some((a) => !a.released)) {
    moves.push({
      icon: '💿',
      title: 'Three tracks in the vault',
      sub: 'Bundle them into an album — albums keep streaming for months.',
      tab: 'studio',
      cta: 'Build album',
    })
  }
  if (s.offers.length > 0 && !s.label) {
    moves.push({
      icon: '📬',
      title: `${s.offers.length} label offer${s.offers.length > 1 ? 's' : ''} waiting`,
      sub: 'An advance buys studio time. The royalty clause is forever.',
      tab: 'biz',
      cta: 'Review',
    })
  }
  if (!s.label && fame >= 5 && s.offers.length === 0 && s.label === null && fame < 40) {
    moves.push({
      icon: '🏷️',
      title: 'No label yet',
      sub: 'Keep releasing and posting. Labels call around fame 5.',
      tab: 'social',
      cta: 'Build hype',
    })
  }
  if (!s.tour && fame >= 12) {
    moves.push({
      icon: '🚐',
      title: 'You can fill rooms now',
      sub: 'A tour pays nightly and converts listeners into fans.',
      tab: 'biz',
      cta: 'Book',
    })
  }
  if (s.radioTier < 3 && s.money > [0, 2500, 22000, 140000][s.radioTier + 1]) {
    moves.push({
      icon: '📡',
      title: 'Radio rotation is buyable',
      sub: 'Every tier multiplies your streams permanently.',
      tab: 'biz',
      cta: 'Buy in',
    })
  }
  if (s.money > 120000 && s.assets.length < 4) {
    moves.push({
      icon: '🏎️',
      title: 'You are sitting on cash',
      sub: 'Lifestyle buys influence, and influence buys attention.',
      tab: 'life',
      cta: 'Spend',
    })
  }
  if (s.songs.some((x) => x.peak === 1) === false && fame > 35 && s.songs.some((x) => x.peak && x.peak <= 10)) {
    moves.push({
      icon: '🏆',
      title: 'You have been close to #1',
      sub: 'A video or a playlist push could finish the climb.',
      tab: 'studio',
      cta: 'Push a single',
    })
  }
  if (s.rivals.every((r) => r.beef <= 45) && fame > 20) {
    moves.push({
      icon: '🔥',
      title: 'The scene is too quiet',
      sub: 'A diss track prints streams. It also prints enemies.',
      tab: 'social',
      cta: 'Start beef',
    })
  }

  const shown = moves.slice(0, 3)
  if (!shown.length) return null

  return (
    <>
      <div className="section-title">
        <h2>Next move</h2>
        <div className="line" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {shown.map((m, i) => (
          <button
            key={i}
            className="card tight"
            onClick={() => go(m.tab)}
            style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}
          >
            <span style={{ fontSize: 18, width: 24, textAlign: 'center', flex: 'none' }}>{m.icon}</span>
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 12.8 }}>{m.title}</div>
              <div className="tiny muted">{m.sub}</div>
            </div>
            <span className="chip pink" style={{ flex: 'none', fontSize: 9.5 }}>
              {m.cta}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function findBestRank(s: GameState): number {
  let best = 0
  s.charts.songs.forEach((e, i) => {
    if (e.mine && !best) best = i + 1
  })
  return best
}
