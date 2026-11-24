import { RADIO_TIERS, TOURS, money, ui } from '../game/data'
import { fameOf, incomePerHour, reachOf, tourPreview } from '../game/engine'
import type { GameState } from '../game/types'
import { Bar, Btn } from '../components/Shared'
import { useGame } from '../game/store'

export function Business({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const fame = fameOf(s)
  const mastersCost = s.label ? Math.round(s.label.advance * 2.2 + fame * 24000) : 0
  const nextRadio = RADIO_TIERS[s.radioTier + 1]

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <h1 className="h1">The Business</h1>
        <div className="tiny muted">Deals, radio rotation, and the road.</div>
      </div>

      {s.label ? (
        <div className="card glow" style={{ borderColor: 'rgba(245,196,81,.32)' }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div>
              <div className="chip gold" style={{ marginBottom: 5 }}>
                Signed
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{s.label.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#86efac' }}>×{s.label.push.toFixed(2)}</div>
              <div className="tiny muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                stream push
              </div>
            </div>
          </div>
          <div className="grid3">
            <div className="stat-tile">
              <div className="k">Royalty</div>
              <div className="v">{Math.round(s.label.royalty * 100)}%</div>
            </div>
            <div className="stat-tile">
              <div className="k">Albums owed</div>
              <div className="v">{Math.max(0, s.label.albumsRemaining)}</div>
            </div>
            <div className="stat-tile">
              <div className="k">Weeks left</div>
              <div className="v">{Math.max(0, s.label.weeksLeft)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="row between tiny muted" style={{ marginBottom: 4 }}>
              <span>Deal term</span>
              <span>
                {s.label.albumsDelivered} delivered · signed week {s.label.signedWeek}
              </span>
            </div>
            <Bar
              value={
                100 -
                (Math.max(0, s.label.weeksLeft) /
                  Math.max(1, s.label.weeksLeft + (s.week - s.label.signedWeek))) *
                  100
              }
              color="linear-gradient(90deg,#f5c451,#f59e0b)"
              height={5}
            />
          </div>
          <div className="divider" />
          <div className="row between">
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                {s.label.mastersOwned ? '📀 You own your masters' : '📀 Masters owned by the label'}
              </div>
              <div className="tiny muted">
                {s.label.mastersOwned
                  ? 'Every stream pays you properly. Forever.'
                  : 'Buy them back to stop sharing your catalog.'}
              </div>
            </div>
            {!s.label.mastersOwned && (
              <Btn
                sm
                variant="gold"
                disabled={s.money < mastersCost}
                onClick={() => dispatch({ type: 'BUY_MASTERS' })}
              >
                {money(mastersCost)}
              </Btn>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty" style={{ padding: 16 }}>
            You are <b style={{ color: '#fff' }}>independent</b>. Every stream is yours, but nobody is pushing you.
            <br />
            Labels come when fame does. Keep releasing.
          </div>
        </div>
      )}

      {!s.label && (
        <>
          <div className="section-title">
            <h2>Offers on the table</h2>
            <div className="line" />
            <span className="tiny muted">fame {Math.round(fame)}</span>
          </div>
          {s.offers.length === 0 ? (
            <div className="card">
              <div className="empty">
                No offers yet.
                <br />
                Labels start calling around fame 5.
              </div>
            </div>
          ) : (
            s.offers.map((o) => (
              <div key={o.id} className="card" style={{ marginBottom: 10 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{o.name}</div>
                    <div className="tiny muted">prestige {'★'.repeat(o.prestige)}</div>
                  </div>
                  <div className="chip gold" style={{ fontSize: 11 }}>
                    {money(o.advance)} advance
                  </div>
                </div>
                <div className="grid3">
                  <div className="stat-tile">
                    <div className="k">Label cut</div>
                    <div className="v">{Math.round(o.royalty * 100)}%</div>
                  </div>
                  <div className="stat-tile">
                    <div className="k">Albums</div>
                    <div className="v">{o.albums}</div>
                  </div>
                  <div className="stat-tile">
                    <div className="k">Term</div>
                    <div className="v">{Math.round(o.weeks / 52)}y</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <Btn block variant="gold" onClick={() => dispatch({ type: 'SIGN_OFFER', offerId: o.id })}>
                    Sign
                  </Btn>
                  <Btn variant="ghost" onClick={() => dispatch({ type: 'DECLINE_OFFER', offerId: o.id })}>
                    Walk away
                  </Btn>
                </div>
              </div>
            ))
          )}
        </>
      )}

      <div className="section-title">
        <h2>Reach</h2>
        <div className="line" />
        <span className="tiny muted">×{reachOf(s).toFixed(2)} streams</span>
      </div>
      <div className="card">
        <div className="row" style={{ gap: 4, marginBottom: 10 }}>
          {RADIO_TIERS.map((t, i) => (
            <div key={t.name} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 99,
                  background: i <= s.radioTier ? 'linear-gradient(90deg,#ff2d78,#a855f7)' : 'rgba(255,255,255,.1)',
                  boxShadow: i === s.radioTier ? '0 0 12px rgba(255,45,120,.7)' : undefined,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{RADIO_TIERS[s.radioTier].name}</div>
        <div className="tiny muted" style={{ marginBottom: 10 }}>
          {nextRadio
            ? `Next: ${nextRadio.name}. Rotations are not for sale — a programmer has to move you.`
            : 'You are the entire dial now.'}
        </div>
        <div className="divider" />
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="tiny muted">Press coverage</span>
          <span className="tiny" style={{ fontWeight: 700 }}>
            {['nobody has written about you', 'a blog post', 'a local feature', 'a city paper profile', 'a national piece', 'the cover of a magazine'][s.press.level]}
          </span>
        </div>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="tiny muted">Manager</span>
          <span className="tiny" style={{ fontWeight: 700, color: s.manager ? '#86efac' : 'var(--dim2)' }}>
            {s.manager ? `${s.manager.name} · ${Math.round(s.manager.cut * 100)}%` : 'none — doors stay shut'}
          </span>
        </div>
        <div className="row between">
          <span className="tiny muted">Income</span>
          <span className="tiny" style={{ fontWeight: 700, color: '#86efac' }}>{money(incomePerHour(s))}/hr</span>
        </div>
        <div className="tiny muted" style={{ marginTop: 9, lineHeight: 1.5 }}>
          Everyone who can make a record travel is standing in a room somewhere. Ask them in the Scene.
        </div>
      </div>

      <div className="section-title">
        <h2>Touring</h2>
        <div className="line" />
      </div>

      {s.tour ? (
        <div className="card">
          <div className="row between">
            <div>
              <div style={{ fontWeight: 700 }}>On the road — {s.tour.name}</div>
              <div className="tiny muted">
                {s.tour.nightsLeft} nights left · {money(s.tour.payoutPerNight)}/night
              </div>
            </div>
            <span className="chip violet">{s.tour.city}</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOURS.map((t) => {
            const locked = fame < t.fameNeeded || s.money < t.upfront
            const preview = tourPreview(s, t.tier)
            return (
              <div className="card tight" key={t.tier} style={{ opacity: locked ? 0.55 : 1 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 19 }}>{t.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                      <div className="tiny muted">{t.blurb}</div>
                    </div>
                  </div>
                </div>
                <div className="row between" style={{ marginTop: 8 }}>
                  <div className="tiny muted">
                    {t.cities} nights · +{ui(t.fans)} fans · {money(t.payout)} gross
                    {fame < t.fameNeeded && (
                      <span style={{ color: '#fbbf24' }}> · needs fame {t.fameNeeded}</span>
                    )}
                  </div>
                  <Btn
                    sm
                    variant={locked ? 'flat' : 'primary'}
                    disabled={locked}
                    onClick={() => dispatch({ type: 'BOOK_TOUR', tier: t.tier })}
                  >
                    {s.money < t.upfront ? money(t.upfront) : 'Book'}
                  </Btn>
                </div>
                {!locked && preview && (
                  <div className="tiny" style={{ color: '#a5b4fc', marginTop: 5 }}>
                    Projected: {money(preview.payoutPerNight * preview.totalNights)} gross,{' '}
                    {ui(preview.fansPerNight * preview.totalNights)} new fans
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
