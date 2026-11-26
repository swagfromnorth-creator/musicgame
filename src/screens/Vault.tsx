import React, { useEffect, useState } from 'react'
import { money, num, randomTitle } from '../game/data'
import {
  albumReachFor,
  baseSongReach,
  promoOf,
  songLifespan,
  songReachWithPromo,
} from '../game/engine'
import { useGame } from '../game/store'
import type { Album, Song } from '../game/types'
import { Btn, Empty, PromoPicker, Rating, Sheet } from '../ui/parts'

type View = { kind: 'song'; id: string } | { kind: 'album'; id: string } | null

export function Vault() {
  const { state, dispatch } = useGame()
  const [view, setView] = useState<View>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [albumTitle, setAlbumTitle] = useState('')

  const drafts = state.songs.filter((s) => !s.releasedAt && !s.albumId)
  const out = state.songs.filter((s) => s.releasedAt)
  const albumDrafts = state.albums.filter((a) => !a.releasedAt)
  const albumOut = state.albums.filter((a) => a.releasedAt)

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const createAlbum = () => {
    if (!picked.length) return
    dispatch({ type: 'CREATE_ALBUM', title: albumTitle || randomTitle(), songIds: picked })
    setPicking(false)
    setPicked([])
    setAlbumTitle('')
  }

  return (
    <div className="stack">
      {(albumDrafts.length > 0 || albumOut.length > 0) && (
        <section className="card">
          <h3>Albums</h3>
          {[...albumDrafts, ...albumOut].map((a) => (
            <button className="row album tap" key={a.id} onClick={() => setView({ kind: 'album', id: a.id })}>
              <div className="grow">
                <div className="title as-text">{a.title}</div>
                <span className="dim tiny">
                  {a.songIds.length} track{a.songIds.length === 1 ? '' : 's'} ·{' '}
                  {a.releasedAt ? 'released' : 'draft'}
                </span>
              </div>
              <span className="pill">
                {a.releasedAt ? a.reach : albumReachFor(state, a.songIds, a.promoTier)} reach
              </span>
            </button>
          ))}
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h3>Vault</h3>
          <span className="dim tiny">{drafts.length} unreleased</span>
        </div>

        {drafts.length === 0 && <Empty>Nothing in here yet. Go and write something.</Empty>}

        {drafts.map((song) => (
          <div className="row song" key={song.id}>
            {picking && (
              <input
                type="checkbox"
                className="pick"
                checked={picked.includes(song.id)}
                onChange={() => toggle(song.id)}
              />
            )}
            <button
              className="row grow tap-plain"
              onClick={() => (picking ? toggle(song.id) : setView({ kind: 'song', id: song.id }))}
            >
              <Rating value={song.quality} />
              <div className="grow">
                <div className="title as-text">{song.title}</div>
                <span className="dim tiny">
                  {song.promoTier > 0
                    ? `${promoOf(song.promoTier).name} · ${money(promoOf(song.promoTier).cost)} on release`
                    : 'no push booked'}
                </span>
              </div>
              {!picking && <span className="dim tiny">›</span>}
            </button>
          </div>
        ))}

        <div className="row gap">
          {!picking ? (
            <Btn
              variant="ghost"
              small
              disabled={drafts.length === 0}
              onClick={() => {
                setPicking(true)
                setPicked(drafts.map((d) => d.id))
              }}
            >
              Make an album
            </Btn>
          ) : (
            <>
              <input
                className="rename"
                placeholder="Album title"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
              />
              <Btn small onClick={createAlbum} disabled={!picked.length}>
                Draft {picked.length || ''} track{picked.length === 1 ? '' : 's'}
              </Btn>
              <Btn variant="ghost" small onClick={() => setPicking(false)}>
                Cancel
              </Btn>
            </>
          )}
        </div>
        {picking && (
          <p className="dim tiny">
            Pick any songs — one is a single, five is an album. The album gets its own reach, and you
            can still push it before it comes out.
          </p>
        )}
      </section>

      <section className="card">
        <div className="row between">
          <h3>Released</h3>
          <span className="dim tiny">{out.length}</span>
        </div>
        {out.length === 0 && <Empty>Nothing out yet.</Empty>}
        {out.slice(0, 30).map((song) => (
          <button
            className="row song tap-plain"
            key={song.id}
            onClick={() => setView({ kind: 'song', id: song.id })}
          >
            <Rating value={song.quality} />
            <div className="grow">
              <div className="title as-text">{song.title}</div>
              <span className="dim tiny">
                reach {song.reach} · lasts {song.lifespanH}h
              </span>
            </div>
            <div className="right">
              <span className="mono small">{num(song.streams)}</span>
              <span className="dim tiny">streams</span>
            </div>
          </button>
        ))}
        {out.length > 30 && <p className="dim tiny">Showing the last 30 of {out.length} releases.</p>}
      </section>

      <SongSheet view={view} onClose={() => setView(null)} />
      <AlbumSheet view={view} onClose={() => setView(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail sheets — every single and every album can be opened and edited here.
// ---------------------------------------------------------------------------
function SongSheet({ view, onClose }: { view: View; onClose: () => void }) {
  const { state, dispatch } = useGame()
  const song: Song | undefined = view?.kind === 'song' ? state.songs.find((s) => s.id === view.id) : undefined
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (song) setTitle(song.title)
  }, [song?.id])

  if (!song) return null
  const released = !!song.releasedAt
  const base = baseSongReach(state.skills.virality, song.quality)
  const total = songReachWithPromo(state.skills.virality, song.quality, song.promoTier)
  const promo = promoOf(song.promoTier)
  const life = songLifespan(state.skills.virality)

  return (
    <Sheet open onClose={onClose}>
      <div className="row between">
        <h2>{released ? 'Single' : 'Edit single'}</h2>
        <Rating value={song.quality} />
      </div>

      {released ? (
        <div className="title as-text">{song.title}</div>
      ) : (
        <input
          className="rename"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => dispatch({ type: 'RENAME_SONG', id: song.id, title })}
        />
      )}

      <div className="kv">
        <div>
          <span className="dim tiny">Base reach</span>
          <span className="mono">{base}</span>
        </div>
        <div>
          <span className="dim tiny">Lifespan</span>
          <span className="mono">{life}h</span>
        </div>
        <div>
          <span className="dim tiny">Total reach</span>
          <span className="mono accent">{released ? song.reach : total}</span>
        </div>
      </div>

      {released ? (
        <>
          <div className="kv">
            <div>
              <span className="dim tiny">Streams</span>
              <span className="mono">{num(song.streams)}</span>
            </div>
            <div>
              <span className="dim tiny">Push paid</span>
              <span className="mono">{money(promo.cost)}</span>
            </div>
          </div>
          <p className="dim tiny">Out now. What it reaches is already decided.</p>
        </>
      ) : (
        <>
          <PromoPicker
            value={song.promoTier}
            onChange={(tier) => dispatch({ type: 'SET_SONG_PROMO', id: song.id, tier })}
            baseReach={base}
            cash={state.cash}
          />
          <Btn
            block
            disabled={state.cash < promo.cost}
            onClick={() => {
              dispatch({ type: 'RELEASE_SONG', id: song.id })
              onClose()
            }}
          >
            {promo.cost > 0 ? `Release · pay ${money(promo.cost)}` : 'Release'}
          </Btn>
        </>
      )}
    </Sheet>
  )
}

function AlbumSheet({ view, onClose }: { view: View; onClose: () => void }) {
  const { state, dispatch } = useGame()
  const album: Album | undefined =
    view?.kind === 'album' ? state.albums.find((a) => a.id === view.id) : undefined
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (album) setTitle(album.title)
  }, [album?.id])

  if (!album) return null
  const released = !!album.releasedAt
  const tracks = album.songIds
    .map((id) => state.songs.find((s) => s.id === id))
    .filter((x): x is Song => !!x)
  const draftReach = albumReachFor(state, album.songIds, album.promoTier)
  const promo = promoOf(album.promoTier)

  return (
    <Sheet open onClose={onClose}>
      <div className="row between">
        <h2>{released ? 'Album' : 'Edit album'}</h2>
        <span className="pill">{released ? album.reach : draftReach} reach</span>
      </div>

      {released ? (
        <div className="title as-text">{album.title}</div>
      ) : (
        <input
          className="rename"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => dispatch({ type: 'RENAME_ALBUM', id: album.id, title })}
        />
      )}

      <div className="tracks">
        {tracks.map((t, i) => (
          <div className="row between track" key={t.id}>
            <span className="dim tiny">{String(i + 1).padStart(2, '0')}</span>
            <span className="grow title as-text">{t.title}</span>
            <Rating value={t.quality} />
          </div>
        ))}
      </div>

      {released ? (
        <p className="dim tiny">Out now — every track on it got the album's reach and a longer life.</p>
      ) : (
        <>
          <PromoPicker
            value={album.promoTier}
            onChange={(tier) => dispatch({ type: 'SET_ALBUM_PROMO', id: album.id, tier })}
            baseReach={Math.round((draftReach - promo.reach) * 10) / 10}
            cash={state.cash}
          />
          <Btn
            block
            disabled={state.cash < promo.cost}
            onClick={() => {
              dispatch({ type: 'RELEASE_ALBUM', id: album.id })
              onClose()
            }}
          >
            {promo.cost > 0 ? `Release album · pay ${money(promo.cost)}` : 'Release album'}
          </Btn>
          <Btn
            block
            variant="ghost"
            onClick={() => {
              dispatch({ type: 'DISSOLVE_ALBUM', id: album.id })
              onClose()
            }}
          >
            Break it up — back to the vault
          </Btn>
        </>
      )}
    </Sheet>
  )
}
