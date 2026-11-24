import React, { useState } from 'react'
import { duration, num, randomTitle } from '../game/data'
import { useGame } from '../game/store'
import { Btn, Empty, Rating } from '../ui/parts'

export function Vault() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [albumTitle, setAlbumTitle] = useState('')

  const drafts = state.songs.filter((s) => !s.releasedAt)
  const out = state.songs.filter((s) => s.releasedAt)

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const releaseAlbum = () => {
    if (!picked.length) return
    dispatch({ type: 'RELEASE_ALBUM', title: albumTitle || randomTitle(), songIds: picked })
    setPicking(false)
    setPicked([])
    setAlbumTitle('')
  }

  return (
    <div className="stack">
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
            <Rating value={song.quality} />
            <div className="grow">
              {renaming === song.id ? (
                <input
                  autoFocus
                  className="rename"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    dispatch({ type: 'RENAME_SONG', id: song.id, title: draft })
                    setRenaming(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                />
              ) : (
                <button
                  className="title"
                  title="Rename"
                  onClick={() => {
                    setDraft(song.title)
                    setRenaming(song.id)
                  }}
                >
                  {song.title}
                </button>
              )}
              <span className="dim tiny">written {ago(now - song.createdAt)}</span>
            </div>
            {!picking && (
              <Btn small onClick={() => dispatch({ type: 'RELEASE_SONG', id: song.id })}>
                Release
              </Btn>
            )}
          </div>
        ))}

        <div className="row gap">
          {!picking ? (
            <Btn
              variant="ghost"
              small
              onClick={() => {
                setPicking(true)
                setPicked(drafts.map((d) => d.id))
              }}
              disabled={drafts.length === 0}
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
              <Btn small onClick={releaseAlbum} disabled={!picked.length}>
                Release {picked.length || ''} track{picked.length === 1 ? '' : 's'}
              </Btn>
              <Btn variant="ghost" small onClick={() => setPicking(false)}>
                Cancel
              </Btn>
            </>
          )}
        </div>
        {picking && (
          <p className="dim tiny">
            Pick any songs — one is a single, five is an album. Everything on it gets a fresh
            lifespan and the album's reach.
          </p>
        )}
      </section>

      {state.albums.length > 0 && (
        <section className="card">
          <h3>Albums</h3>
          {state.albums.map((a) => (
            <div className="row between album" key={a.id}>
              <div className="grow">
                <div className="title">{a.title}</div>
                <span className="dim tiny">
                  {a.songIds.length} track{a.songIds.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className="pill">reach {a.reach}</span>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h3>Released</h3>
          <span className="dim tiny">{out.length}</span>
        </div>
        {out.length === 0 && <Empty>Nothing out yet.</Empty>}
        {out.slice(0, 30).map((song) => (
          <div className="row song" key={song.id}>
            <Rating value={song.quality} />
            <div className="grow">
              <div className="title">{song.title}</div>
              <span className="dim tiny">
                reach {song.reach} · lasts {song.lifespanH}h
              </span>
            </div>
            <div className="right">
              <span className="mono small">{num(song.streams)}</span>
              <span className="dim tiny">streams</span>
            </div>
          </div>
        ))}
        {out.length > 30 && (
          <p className="dim tiny">Showing the last 30 of {out.length} releases.</p>
        )}
      </section>
    </div>
  )
}

function ago(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s ago`
  return `${duration(ms)} ago`
}
