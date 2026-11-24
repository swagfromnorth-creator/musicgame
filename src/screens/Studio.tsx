import { useMemo, useState } from 'react'
import { GENRES, MOODS, PRODUCERS, STYLES, genreNameOf, money, moodNameOf, randomTitle, styleNameOf, ui } from '../game/data'
import { gradeFor, streamsPerHour } from '../game/engine'
import type { GameState, MoodId, Song, StyleId } from '../game/types'
import { Art, Bar, Btn, Grade, Sheet } from '../components/Shared'
import { useGame } from '../game/store'

type Tab = 'out' | 'vault' | 'albums'

export function Studio({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const [tab, setTab] = useState<Tab>('out')
  const [writing, setWriting] = useState(false)
  const [detail, setDetail] = useState<Song | null>(null)
  const [albumSheet, setAlbumSheet] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const released = s.songs.filter((x) => x.released)
  const vault = s.songs.filter((x) => !x.released)

  const makeAlbum = () => {
    if (selected.length < 3) return
    dispatch({ type: 'MAKE_ALBUM', title: albumTitle.trim() || randomTitle(), songIds: selected })
    setAlbumSheet(false)
    setSelected([])
    setAlbumTitle('')
    setTab('albums')
  }

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1">The Studio</h1>
          <div className="tiny muted">
            Studio tier {s.studioLevel} · {s.videos.length} video{s.videos.length === 1 ? '' : 's'} in production
          </div>
        </div>
        <Btn variant="primary" onClick={() => setWriting(true)}>
          + New Song
        </Btn>
      </div>

      {s.pending && (
        <div className="card glow" style={{ borderColor: 'rgba(74,222,128,.4)', marginBottom: 12 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="chip green">Master take</span>
            <span className="tiny muted">{s.pending.producer}</span>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <Art hue={s.hue} label={s.pending.title} size={54} />
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>“{s.pending.title}”</div>
              <div className="tiny muted">
                {genreOf(s.pending.genre)} · {moodNameOf(s.pending.mood)} · {styleNameOf(s.pending.style)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                className="grade"
                style={{
                  width: 40,
                  height: 40,
                  fontSize: 21,
                  background: `${gradeFor(s.pending.quality).color}22`,
                  color: gradeFor(s.pending.quality).color,
                  border: `1px solid ${gradeFor(s.pending.quality).color}55`,
                }}
              >
                {gradeFor(s.pending.quality).label}
              </div>
              <div className="tiny muted" style={{ marginTop: 3 }}>
                {s.pending.quality}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <Btn variant="primary" block onClick={() => dispatch({ type: 'RELEASE_PENDING' })}>
              Release as single
            </Btn>
            <Btn variant="flat" onClick={() => dispatch({ type: 'HOLD_PENDING' })}>
              Hold
            </Btn>
            <Btn variant="ghost" onClick={() => dispatch({ type: 'DISCARD_PENDING' })}>
              Scrap
            </Btn>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: 5, marginBottom: 12 }}>
        {(
          [
            ['out', 'Out Now', released.length],
            ['vault', 'Vault', vault.length],
            ['albums', 'Albums', s.albums.length],
          ] as [Tab, string, number][]
        ).map(([id, label, n]) => (
          <button
            key={id}
            className="btn sm"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              background: tab === id ? 'rgba(255,45,120,.16)' : 'rgba(255,255,255,.04)',
              borderColor: tab === id ? 'rgba(255,45,120,.45)' : 'var(--line)',
            }}
          >
            {label} <span className="muted">{n}</span>
          </button>
        ))}
      </div>

      {tab === 'out' && (
        <div className="card tight">
          {released.length === 0 ? (
            <div className="empty">
              Nothing released yet.
              <br />
              Write a song — you have {money(s.money)} and everything to prove.
            </div>
          ) : (
            <div className="list">
              {released.map((song) => (
                <button key={song.id} className="list-row tap" onClick={() => setDetail(song)}>
                  <Art hue={song.hue} label={song.title} size={44} />
                  <div className="grow">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>
                        {song.title}
                      </span>
                      {song.video !== 'none' && <span className="tiny">🎬</span>}
                      {song.playlistTier > 0 && <span className="tiny">📻</span>}
                      {song.isDiss && <span className="tiny">🔥</span>}
                    </div>
                    <div className="tiny muted">
                      {ui(song.streams)} streams · {ui(streamsPerHour(s, song))}/h
                      {song.peak ? ` · peak #${song.peak}` : ''}
                    </div>
                  </div>
                  <Grade grade={gradeFor(song.quality).label} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'vault' && (
        <>
          <div className="card tight">
            {vault.length === 0 ? (
              <div className="empty">The vault is empty. Record something.</div>
            ) : (
              <div className="list">
                {vault.map((song) => (
                  <div key={song.id} className="list-row">
                    <Art hue={song.hue} label={song.title} size={40} />
                    <div className="grow">
                      <div className="truncate" style={{ fontWeight: 600, fontSize: 12.5 }}>
                        {song.title}
                      </div>
                      <div className="tiny muted">{genreOf(song.genre)} · never released</div>
                    </div>
                    <Grade grade={gradeFor(song.quality).label} />
                    <Btn sm variant="flat" onClick={() => dispatch({ type: 'RELEASE_VAULT', songId: song.id })}>
                      Release
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
          {vault.length >= 3 && (
            <Btn
              block
              variant="gold"
              style={{ marginTop: 10 }}
              onClick={() => {
                setSelected(vault.slice(0, Math.min(6, vault.length)).map((x) => x.id))
                setAlbumSheet(true)
              }}
            >
              💿 Build an album from the vault
            </Btn>
          )}
        </>
      )}

      {tab === 'albums' && (
        <>
          {s.albums.length === 0 && (
            <div className="card">
              <div className="empty">
                An album is how a single becomes a career.
                <br />
                Gather three or more tracks to start one.
              </div>
            </div>
          )}
          {s.albums.map((album) => (
            <div key={album.id} className="card" style={{ marginBottom: 10 }}>
              <div className="row" style={{ gap: 12 }}>
                <Art hue={album.hue} label={album.title} size={58} />
                <div className="grow">
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{album.title}</div>
                  <div className="tiny muted">
                    {album.songIds.length} tracks · {album.released ? `${ui(album.streams)} streams` : 'unreleased'}
                    {album.peak ? ` · peak #${album.peak}` : ''}
                  </div>
                  <div className="row" style={{ gap: 5, marginTop: 6 }}>
                    <span className="chip">{gradeFor(album.quality).label}-grade</span>
                    {album.released ? (
                      <span className="chip green">Out now</span>
                    ) : (
                      <span className="chip gold">Draft</span>
                    )}
                  </div>
                </div>
              </div>
              {!album.released && (
                <Btn
                  block
                  variant="primary"
                  style={{ marginTop: 10 }}
                  onClick={() => dispatch({ type: 'RELEASE_ALBUM', albumId: album.id })}
                >
                  Release album 💿
                </Btn>
              )}
              <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {album.songIds.map((id) => {
                  const song = s.songs.find((x) => x.id === id)
                  if (!song) return null
                  return (
                    <span key={id} className="chip" style={{ fontSize: 9.5 }}>
                      {song.title}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
          <Btn
            block
            variant="flat"
            style={{ marginTop: 4 }}
            onClick={() => {
              setSelected([])
              setAlbumSheet(true)
            }}
          >
            + New album draft
          </Btn>
        </>
      )}

      <div className="section-title">
        <h2>Songwriting</h2>
        <div className="line" />
      </div>
      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div className="tiny muted">A session costs energy and cash. Quality depends on your skills.</div>
        </div>
        <div className="grid3">
          <MiniStat k="Songwriting" v={Math.floor(s.skills.songwriting)} />
          <MiniStat k="Vocals" v={Math.floor(s.skills.vocals)} />
          <MiniStat k="Production" v={Math.floor(s.skills.production)} />
        </div>
        <Btn block variant="primary" style={{ marginTop: 10 }} onClick={() => setWriting(true)} disabled={s.energy < 18}>
          Write & record (−18 energy)
        </Btn>
      </div>

      <WriteSheet open={writing} onClose={() => setWriting(false)} s={s} />

      <SongSheet song={detail} onClose={() => setDetail(null)} s={s} />

      <Sheet open={albumSheet} onClose={() => setAlbumSheet(false)} title="New Album">
        <input
          placeholder="Album title"
          value={albumTitle}
          onChange={(e) => setAlbumTitle(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div className="tiny muted" style={{ marginBottom: 8 }}>
          Pick at least 3 tracks. Unreleased tracks will be released with the album.
        </div>
        <div className="list" style={{ maxHeight: '42vh', overflowY: 'auto' }}>
          {s.songs.map((song) => {
            const on = selected.includes(song.id)
            return (
              <button
                key={song.id}
                className="list-row tap"
                onClick={() =>
                  setSelected(on ? selected.filter((x) => x !== song.id) : [...selected, song.id])
                }
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `1.5px solid ${on ? '#ff2d78' : 'rgba(255,255,255,.22)'}`,
                    background: on ? '#ff2d78' : 'transparent',
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#fff',
                  }}
                >
                  {on ? '✓' : ''}
                </span>
                <div className="grow" style={{ textAlign: 'left' }}>
                  <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {song.title}
                  </div>
                  <div className="tiny muted">
                    {song.released ? 'released single' : 'unreleased'} · {gradeFor(song.quality).label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <Btn block variant="gold" style={{ marginTop: 12 }} disabled={selected.length < 3} onClick={makeAlbum}>
          Create album ({selected.length} tracks)
        </Btn>
      </Sheet>
    </>
  )
}

function MiniStat({ k, v }: { k: string; v: number }) {
  return (
    <div className="stat-tile" style={{ padding: '8px 9px' }}>
      <div className="k" style={{ fontSize: 8.5 }}>
        {k}
      </div>
      <div className="v" style={{ fontSize: 15 }}>
        {v}
      </div>
    </div>
  )
}

function genreOf(id: string) {
  return genreNameOf(id)
}

// ---------------------------------------------------------------------------

function WriteSheet({ open, onClose, s }: { open: boolean; onClose: () => void; s: GameState }) {
  const { dispatch } = useGame()
  const [title, setTitle] = useState(() => randomTitle())
  const [genre, setGenre] = useState(s.genre)
  const [mood, setMood] = useState<MoodId>('anthem')
  const [style, setStyle] = useState<StyleId>('hooky')
  const [producerId, setProducerId] = useState('self')
  const [featureId, setFeatureId] = useState<string | null>(null)

  const producer = PRODUCERS.find((p) => p.id === producerId) ?? PRODUCERS[0]
  const feature = s.rivals.find((r) => r.id === featureId) ?? null
  const featureCost = feature ? Math.round(400 + feature.followers * 0.018) : 0
  const cost = producer.cost + 30 + featureCost
  const canWrite = s.money >= cost && s.energy >= 18

  const doWrite = () => {
    dispatch({
      type: 'WRITE_SONG',
      payload: { title: title.trim() || randomTitle(), genre, mood, style, producerId, featureId },
    })
    onClose()
    setTitle(randomTitle())
    setFeatureId(null)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Write & Record">
      <div className="row" style={{ gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" maxLength={34} />
        <Btn sm variant="flat" onClick={() => setTitle(randomTitle())}>
          🎲
        </Btn>
      </div>

      <div className="h2" style={{ fontSize: 10, margin: '13px 0 6px' }}>
        Genre
      </div>
      <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
        {GENRES.map((g) => (
          <button
            key={g.id}
            className="chip"
            onClick={() => setGenre(g.id)}
            style={{
              cursor: 'pointer',
              background: genre === g.id ? 'rgba(255,45,120,.18)' : undefined,
              borderColor: genre === g.id ? 'rgba(255,45,120,.5)' : undefined,
              color: genre === g.id ? '#ffb3cf' : undefined,
            }}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>
      {genre !== s.genre && (
        <div className="tiny" style={{ color: '#fbbf24', marginTop: 5 }}>
          Not your lane — expect a quality penalty.
        </div>
      )}

      <div className="h2" style={{ fontSize: 10, margin: '13px 0 6px' }}>
        Mood
      </div>
      <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
        {MOODS.map((m) => (
          <button
            key={m.id}
            className="chip"
            onClick={() => setMood(m.id)}
            style={{
              cursor: 'pointer',
              background: mood === m.id ? 'rgba(139,92,246,.22)' : undefined,
              borderColor: mood === m.id ? 'rgba(139,92,246,.55)' : undefined,
              color: mood === m.id ? '#c4b5fd' : undefined,
            }}
          >
            {m.emoji} {m.name}
          </button>
        ))}
      </div>
      <div className="tiny muted" style={{ marginTop: 5 }}>
        {MOODS.find((m) => m.id === mood)?.blurb}
      </div>

      <div className="h2" style={{ fontSize: 10, margin: '13px 0 6px' }}>
        Approach
      </div>
      <div className="grid3">
        {STYLES.map((st) => (
          <button
            key={st.id}
            className="opt"
            onClick={() => setStyle(st.id)}
            style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              padding: 8,
              borderColor: style === st.id ? 'rgba(255,45,120,.6)' : undefined,
              background: style === st.id ? 'rgba(255,45,120,.11)' : undefined,
            }}
          >
            <span style={{ fontSize: 14 }}>{st.emoji}</span>
            <div className="opt-title" style={{ fontSize: 11 }}>
              {st.name}
            </div>
            <div className="opt-sub" style={{ fontSize: 9, lineHeight: 1.25 }}>
              {st.uses.map((u) => u.slice(0, 4)).join(' + ')}
            </div>
          </button>
        ))}
      </div>

      <div className="h2" style={{ fontSize: 10, margin: '13px 0 6px' }}>
        Producer
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {PRODUCERS.map((p) => (
          <button
            key={p.id}
            className="opt"
            onClick={() => setProducerId(p.id)}
            disabled={p.cost > s.money}
            style={{
              opacity: p.cost > s.money ? 0.4 : 1,
              padding: '8px 10px',
              borderColor: producerId === p.id ? 'rgba(255,45,120,.6)' : undefined,
              background: producerId === p.id ? 'rgba(255,45,120,.11)' : undefined,
            }}
          >
            <span className="grow">
              <div className="opt-title" style={{ fontSize: 12 }}>
                {p.name}
                <span className="muted tiny" style={{ fontWeight: 500 }}>
                  {' '}
                  +{p.bonus}
                </span>
              </div>
            </span>
            <span className="tiny" style={{ color: '#f8d98b', fontWeight: 700 }}>
              {p.cost === 0 ? 'Free' : money(p.cost)}
            </span>
          </button>
        ))}
      </div>

      <div className="h2" style={{ fontSize: 10, margin: '13px 0 6px' }}>
        Feature
      </div>
      <select
        value={featureId ?? ''}
        onChange={(e) => setFeatureId(e.target.value || null)}
        style={{ fontSize: 13 }}
      >
        <option value="">Solo record</option>
        {s.rivals
          .filter((r) => r.beef < 45)
          .sort((a, b) => b.fame - a.fame)
          .map((r) => {
            const fc = Math.round(400 + r.followers * 0.018)
            return (
              <option key={r.id} value={r.id} disabled={s.money < fc}>
                {r.name} — fame {Math.round(r.fame)} — {money(fc)}
              </option>
            )
          })}
      </select>

      <div className="sheet-cta">
        <div className="row between" style={{ marginBottom: 7 }}>
          <span className="tiny muted">
            Session {money(cost)} · 18 energy
            {feature ? ` · feat. ${feature.name}` : ''}
          </span>
          <span className="tiny" style={{ color: s.energy < 18 ? '#fda4af' : 'var(--dim)' }}>
            {Math.floor(s.energy)}⚡ left
          </span>
        </div>
        <Btn block variant="primary" disabled={!canWrite} onClick={doWrite}>
          {canWrite ? 'Record the session 🎙️' : s.energy < 18 ? 'Too tired — rest first' : 'Not enough cash'}
        </Btn>
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------

function SongSheet({ song, onClose, s }: { song: Song | null; onClose: () => void; s: GameState }) {
  const { dispatch } = useGame()
  if (!song) return null
  const live = s.songs.find((x) => x.id === song.id) ?? song
  const g = gradeFor(live.quality)
  const videoCostLyric = 650 + s.followers * 0.004
  const videoCostConcept = 4200 + s.followers * 0.02
  const playlistCosts = [900, 7000, 60000, 500000]

  return (
    <Sheet open={!!song} onClose={onClose}>
      <div className="row" style={{ gap: 13, marginBottom: 12 }}>
        <Art hue={live.hue} label={live.title} size={70} />
        <div className="grow">
          <div className="h1" style={{ fontSize: 22, lineHeight: 1.05 }}>
            {live.title}
          </div>
          <div className="tiny muted">
            {genreOf(live.genre)} · {moodNameOf(live.mood)} · {styleNameOf(live.style)}
          </div>
          <div className="row" style={{ gap: 5, marginTop: 6 }}>
            <span className="chip" style={{ color: g.color, borderColor: `${g.color}55` }}>
              {g.label}-grade
            </span>
            {live.isDiss && <span className="chip red">diss track</span>}
            {live.video !== 'none' && <span className="chip violet">{live.video} video</span>}
          </div>
        </div>
      </div>

      <div className="grid3">
        <div className="stat-tile">
          <div className="k">Streams</div>
          <div className="v">{ui(live.streams)}</div>
        </div>
        <div className="stat-tile">
          <div className="k">Per hour</div>
          <div className="v">{ui(live.streamsLastHour)}</div>
        </div>
        <div className="stat-tile">
          <div className="k">Peak</div>
          <div className="v">{live.peak ? `#${live.peak}` : '—'}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="row between tiny muted" style={{ marginBottom: 4 }}>
          <span>Hype</span>
          <span>{Math.round(live.hype)}</span>
        </div>
        <Bar value={live.hype} max={100} color="linear-gradient(90deg,#f5c451,#ff2d78)" height={5} />
      </div>

      <div className="section-title">
        <h2>Promotion</h2>
        <div className="line" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="row between" style={{ gap: 8 }}>
          <div className="grow">
            <div className="opt-title" style={{ fontSize: 12.5 }}>
              🎬 Lyric video
            </div>
            <div className="opt-sub">Fast turnaround, +10% streams forever.</div>
          </div>
          <Btn
            sm
            variant="flat"
            disabled={live.video !== 'none' || s.money < videoCostLyric}
            onClick={() => dispatch({ type: 'SHOOT_VIDEO', songId: live.id, kind: 'lyric' })}
          >
            {money(videoCostLyric)}
          </Btn>
        </div>
        <div className="row between" style={{ gap: 8 }}>
          <div className="grow">
            <div className="opt-title" style={{ fontSize: 12.5 }}>
              🎥 Concept video
            </div>
            <div className="opt-sub">Three days of production. +22% streams forever.</div>
          </div>
          <Btn
            sm
            variant="flat"
            disabled={live.video !== 'none' || s.money < videoCostConcept}
            onClick={() => dispatch({ type: 'SHOOT_VIDEO', songId: live.id, kind: 'concept' })}
          >
            {money(videoCostConcept)}
          </Btn>
        </div>
        {[0, 1, 2, 3].map((tier) => {
          const names = ['Fresh Finds', 'Genre Pulse', 'Global Rotation', 'Cultural Moment']
          const done = live.playlistTier >= tier + 1
          return (
            <div className="row between" key={tier} style={{ gap: 8, opacity: live.playlistTier > tier ? 0.5 : 1 }}>
              <div className="grow">
                <div className="opt-title" style={{ fontSize: 12.5 }}>
                  📻 {names[tier]}
                </div>
                <div className="opt-sub">
                  {done ? 'Already placed' : 'Multiplies streams while it lasts.'}
                </div>
              </div>
              <Btn
                sm
                variant="flat"
                disabled={done || live.playlistTier !== tier || s.money < playlistCosts[tier]}
                onClick={() => dispatch({ type: 'BUY_PLAYLIST', songId: live.id, tier })}
              >
                {done ? '✓' : money(playlistCosts[tier])}
              </Btn>
            </div>
          )
        })}
      </div>

      <Btn block variant="primary" style={{ marginTop: 14 }} onClick={onClose}>
        Done
      </Btn>
    </Sheet>
  )
}
