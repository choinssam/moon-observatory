import React, { useMemo, useState } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import {
  Astronomy, moonPhase01, moonIllum, moonAge, phaseName, phaseTerm, phaseTip,
  riseSetTransit, horizonOf, trackFrom, nightWindowStart, azName, fmtKST, kstMidnight, searchPhase, lunarDate
} from '../lib/astro.js'

/*
 * 남쪽을 바라보고 선 사람 머리 위로 펼쳐진 하늘의 반구.
 * 동쪽 지평선에서 떠서 남쪽 하늘을 지나 서쪽으로 지는 길이 매끈한 호로 보인다.
 * 4학년은 달을, 6학년은 태양을 앞에 놓고 본다 ([6과12-01] 하루 동안 태양의 위치 변화).
 */
const W = 900, H = 470, CX = W / 2, HY = 392, R = 366
const RAD = Math.PI / 180
function pt(alt, az) {
  const a = alt * RAD, z = az * RAD
  return { x: CX - R * Math.cos(a) * Math.sin(z), y: HY - R * Math.sin(a) }
}
const P = q => { const p = pt(q.alt, q.az); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }
const DOME = `M${CX - R},${HY} A${R},${R} 0 0 1 ${CX + R},${HY} Z`

export default function Tonight({ date, setDate, obs, loc, big, grade }) {
  const vp = useViewport()
  const [focus, setFocus] = useState(grade === '6' ? 'sun' : 'moon')
  const sunMode = focus === 'sun'
  const dayKey = kstMidnight(date).getTime()

  /* 달은 밤이 가운데 오도록 낮 12시부터, 태양은 하루 0시부터 */
  const win = sunMode ? new Date(dayKey) : nightWindowStart(date)
  const winKey = win.getTime()
  const base = sunMode ? 0 : 12 * 60

  /* 지금 떠 있으면 그 호(뜸→짐), 아니면 다음에 뜨는 호 하나만 그린다.
     하루 창을 통째로 그리면 이틀치 호가 겹쳐 끊어져 보인다. */
  const arcOf = body => {
    const up = horizonOf(body, obs, date).alt > 0
    let rise = null, set = null
    try {
      if (up) {
        rise = Astronomy.SearchRiseSet(body, obs, +1, date, -2)
        set = Astronomy.SearchRiseSet(body, obs, -1, date, 2)
      } else {
        rise = Astronomy.SearchRiseSet(body, obs, +1, date, 2)
        set = rise ? Astronomy.SearchRiseSet(body, obs, -1, rise.date, 2) : null
      }
    } catch (e) { rise = null; set = null }
    if (!rise || !set) return { pts: trackFrom(body, obs, win, 24 * 60, 10).filter(q => q.alt > -0.5), marks: [], rise: null, set: null }
    const r = rise.date, s = set.date
    const minutes = (s - r) / 60000
    const pts = trackFrom(body, obs, r, minutes, Math.max(5, Math.min(15, minutes / 90)))
    const hs = horizonOf(body, obs, s)
    pts.push({ t: s, min: minutes, az: hs.az, alt: hs.alt })
    const marks = []
    const step = 7200000, off = 9 * 3600000                     // 한국 시각 짝수 시마다 표시
    for (let t = Math.ceil((r.getTime() + off) / step) * step - off; t < s.getTime(); t += step) {
      const h = horizonOf(body, obs, new Date(t))
      if (h.alt > 3) marks.push({ t, az: h.az, alt: h.alt, label: fmtKST(new Date(t)).slice(0, 2) })
    }
    return { pts, marks, rise: r, set: s }
  }
  const arcs = useMemo(() => ({ moon: arcOf(Astronomy.Body.Moon), sun: arcOf(Astronomy.Body.Sun) }),
    [Math.floor(date.getTime() / 300000), loc.lat, loc.lon])

  const rs = useMemo(() => riseSetTransit(Astronomy.Body.Moon, obs, date), [dayKey, loc.lat, loc.lon])
  const sunRs = useMemo(() => riseSetTransit(Astronomy.Body.Sun, obs, date), [dayKey, loc.lat, loc.lon])
  const now = horizonOf(Astronomy.Body.Moon, obs, date)
  const sunNow = horizonOf(Astronomy.Body.Sun, obs, date)

  const p = moonPhase01(date)
  const lib = Astronomy.Libration(date)
  const illum = moonIllum(date)
  const discR = moonSize(vp, big, { min: 96, max: 230 })

  const minInWin = Math.max(0, Math.min(1439, Math.round((date.getTime() - winKey) / 60000)))
  const clockAt = m => {
    const h = Math.floor(((base + m) % 1440) / 60)
    const mm = ((base + m) % 1440) % 60
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
  }
  function setMinutes(m) { setDate(new Date(winKey + m * 60000)) }

  const meridian = az => Array.from({ length: 19 }, (_, i) => P({ alt: i * 5, az })).join(' ')

  const nextFull = searchPhase(180, date)
  const nextNew = searchPhase(0, date)
  const main = sunMode ? sunNow : now
  const mainPt = pt(main.alt, main.az)
  const mainArc = sunMode ? arcs.sun : arcs.moon
  const otherArc = sunMode ? arcs.moon : arcs.sun
  const endPt = arr => arr.length ? pt(0, arr[arr.length - 1].az) : null
  const startPt = arr => arr.length ? pt(0, arr[0].az) : null

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(240px,22%) minmax(0,1fr)', alignItems: 'stretch' }}>
        {/* 왼쪽: 지금 보고 있는 천체 */}
        <div className="card center" style={{ flexDirection: 'column', gap: 12 }}>
          {sunMode ? (
            <>
              <svg width={discR} height={discR} viewBox="-50 -50 100 100" role="img" aria-label="태양">
                <defs>
                  <radialGradient id="sunDisc">
                    <stop offset="0%" stopColor="#FFF6D6" />
                    <stop offset="55%" stopColor="#FFB03A" />
                    <stop offset="100%" stopColor="#C85A00" />
                  </radialGradient>
                </defs>
                <circle r="46" fill="url(#sunDisc)" />
                <circle r="46" fill="none" stroke="#FFD27A" strokeOpacity=".5" />
              </svg>
              <div className="big" style={{ color: 'var(--sun)' }}>{sunNow.alt > 0 ? '태양이 떠 있음' : '태양이 진 뒤'}</div>
              <div className="rows" style={{ width: '100%' }}>
                <div className="r"><span>일출</span><b>{fmtKST(sunRs.rise)}</b></div>
                <div className="r"><span>남중 (가장 높이)</span><b>{fmtKST(sunRs.transit)} · {sunRs.transitAlt != null ? sunRs.transitAlt.toFixed(0) + '°' : '—'}</b></div>
                <div className="r"><span>일몰</span><b>{fmtKST(sunRs.set)}</b></div>
                <div className="r"><span>지금 고도</span><b>{sunNow.alt.toFixed(1)}°</b></div>
                <div className="r"><span>지금 방위</span><b>{azName(sunNow.az)}쪽 {sunNow.az.toFixed(0)}°</b></div>
              </div>
              <div className="note" style={{ width: '100%' }}>
                태양은 동쪽에서 떠서 남쪽 하늘을 지나 서쪽으로 집니다. 한 시간에 약 15°씩 움직입니다.
                태양이 움직이는 게 아니라, <b>지구가 서에서 동으로 자전</b>하기 때문에 그렇게 보입니다.
              </div>
            </>
          ) : (
            <>
              <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
              <div className="big" style={{ color: 'var(--moon)' }}>
                {phaseName(p)}{phaseTerm(p) && <span className="term">{phaseTerm(p)}</span>}
              </div>
              <div className="rows" style={{ width: '100%' }}>
                <div className="r"><span>음력</span><b>{lunarDate(date)?.ko || '—'}</b></div>
                <div className="r"><span>밝은 부분</span><b>{(illum * 100).toFixed(0)}%</b></div>
                <div className="r"><span>지금 고도</span><b>{now.alt.toFixed(1)}°</b></div>
                <div className="r"><span>지금 방위</span><b>{azName(now.az)}쪽 {now.az.toFixed(0)}°</b></div>
              </div>
              <div className="note" style={{ width: '100%' }}>{phaseTip(p)}</div>
            </>
          )}
        </div>

        {/* 오른쪽: 하늘 반구 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="toolrow" style={{ marginBottom: 6 }}>
            <h3 style={{ marginBottom: 0 }}>
              {sunMode ? '하루 동안 태양이 지나가는 길' : '오늘 밤 달이 지나가는 길'}
              <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>남쪽을 바라보고 선 사람 머리 위의 하늘</span>
            </h3>
            <div className="spacer" />
            <div className="seg">
              <button aria-pressed={sunMode} onClick={() => setFocus('sun')}>태양</button>
              <button aria-pressed={!sunMode} onClick={() => setFocus('moon')}>달</button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
              role="img" aria-label={sunMode ? '하루 동안 태양이 지나가는 길' : '오늘 밤 달이 지나가는 길'}>
              <defs>
                <radialGradient id="domeG" cx="50%" cy="100%" r="78%">
                  <stop offset="0%" stopColor={sunMode ? '#2C4A86' : '#1C2C56'} />
                  <stop offset="65%" stopColor={sunMode ? '#17264C' : '#0F1734'} />
                  <stop offset="100%" stopColor="#090D20" />
                </radialGradient>
              </defs>

              <path d={DOME} fill="url(#domeG)" stroke="var(--line)" strokeWidth="1.5" />

              {[30, 60].map(a => {
                const hw = R * Math.cos(a * RAD), y = HY - R * Math.sin(a * RAD)
                return (
                  <g key={a}>
                    <line x1={CX - hw} y1={y} x2={CX + hw} y2={y} stroke="var(--line)" strokeDasharray="3 7" />
                    <text x={CX + 8} y={y - 5} fill="var(--muted)" fontSize="12">고도 {a}°</text>
                  </g>
                )
              })}
              {[135, 180, 225].map(az => (
                <polyline key={az} points={meridian(az)} fill="none" stroke="var(--line)" strokeDasharray="3 7" />
              ))}

              <rect x="0" y={HY} width={W} height={H - HY} fill="#0E1712" />
              <line x1="0" y1={HY} x2={W} y2={HY} stroke="var(--muted)" strokeOpacity=".7" strokeWidth="1.5" />
              {[[90, '동'], [135, '남동'], [180, '남'], [225, '남서'], [270, '서']].map(([az, ko]) => (
                <text key={az} x={CX - R * Math.sin(az * RAD)} y={HY + 24} textAnchor="middle"
                  fill="var(--text-2)" fontSize="15" fontWeight="600">{ko}</text>
              ))}
              <g transform={`translate(${CX},${HY})`} stroke="var(--text-2)" strokeWidth="2.2" strokeLinecap="round">
                <circle cy="-24" r="5" fill="var(--text-2)" stroke="none" />
                <path d="M0,-18 V-5 M-7,-13 H7 M0,-5 L-5,4 M0,-5 L5,4" fill="none" />
              </g>

              {/* 뒤에 놓이는 천체는 점선으로 */}
              <polyline points={otherArc.pts.map(P).join(' ')} fill="none"
                stroke={sunMode ? 'var(--moon)' : 'var(--sun)'} strokeOpacity=".4" strokeWidth="2.5" strokeDasharray="5 6" />
              {/* 앞에 놓이는 천체의 길: 뜰 때부터 질 때까지 하나의 호 */}
              <polyline points={mainArc.pts.map(P).join(' ')} fill="none"
                stroke={sunMode ? 'var(--sun)' : 'var(--moon)'} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />

              {/* 시각 표시 */}
              {mainArc.marks.map(q => {
                const c = pt(q.alt, q.az)
                return (
                  <g key={q.t}>
                    <circle cx={c.x} cy={c.y} r="3.2" fill={sunMode ? 'var(--sun)' : 'var(--moon)'} opacity=".85" />
                    <text x={c.x} y={c.y - 10} textAnchor="middle" fill="var(--text-2)" fontSize="12">{q.label}시</text>
                  </g>
                )
              })}
              {/* 뜨는 곳 · 지는 곳 */}
              {mainArc.rise && startPt(mainArc.pts) && (
                <text x={startPt(mainArc.pts).x} y={HY + 44} textAnchor="middle" fill={sunMode ? 'var(--sun)' : 'var(--moon)'} fontSize="12">
                  {fmtKST(mainArc.rise)} {sunMode ? '해돋이' : '달돋이'}
                </text>
              )}
              {mainArc.set && endPt(mainArc.pts) && (
                <text x={endPt(mainArc.pts).x} y={HY + 44} textAnchor="middle" fill={sunMode ? 'var(--sun)' : 'var(--moon)'} fontSize="12">
                  {fmtKST(mainArc.set)} {sunMode ? '해넘이' : '달넘이'}
                </text>
              )}

              {/* 지금 위치 */}
              {main.alt > -1 && (
                <g transform={`translate(${mainPt.x},${mainPt.y})`}>
                  <circle r="14" fill="none" stroke="var(--sky)" strokeWidth="2" />
                  {sunMode
                    ? <circle r="9" fill="url(#sunDisc)" />
                    : <><circle r="9" fill="var(--shadow-side)" /><path d={moonPathD(9, p)} fill="var(--moon)" /></>}
                </g>
              )}

              <text x={14} y={H - 14} fill="var(--muted)" fontSize="12">
                지평선 0° · 점선은 고도 30°·60° · 반구 꼭대기가 머리 위 90°
              </text>
              <text x={W - 14} y={H - 14} textAnchor="end" fill="var(--muted)" fontSize="12">
                {sunMode ? '실선은 태양이 뜰 때부터 질 때까지 · 점선 호는 달' : '실선은 달이 뜰 때부터 질 때까지 · 점선 호는 태양'}
              </text>
            </svg>
          </div>

          <div className="toolrow" style={{ marginTop: 8 }}>
            <span className="mono" style={{ color: 'var(--muted)' }}>시각</span>
            <input className="slider" style={{ flex: 1 }} type="range" min="0" max="1439" step="10"
              value={minInWin} onChange={e => setMinutes(Number(e.target.value))}
              aria-label="하루 중 시각" />
            <b className="mono" style={{ minWidth: '4.5em', textAlign: 'right' }}>{clockAt(minInWin)}</b>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
        {sunMode ? (
          <div className="card">
            <h3>규칙을 찾아봅시다</h3>
            <div className="rows">
              <div className="r"><span>뜨는 곳 → 지는 곳</span><b>동쪽 → 서쪽</b></div>
              <div className="r"><span>가장 높이 뜨는 때</span><b>낮 12시 30분쯤 · 남쪽</b></div>
              <div className="r"><span>한 시간에 움직이는 각</span><b>약 15°</b></div>
            </div>
            <p className="hint">달과 별도 같은 방향으로 움직입니다. 셋 다 지구의 자전 때문입니다. '별자리' 화면에서 시각을 밀어 확인해 보세요.</p>
          </div>
        ) : (
          <div className="card">
            <h3>달이 뜨고 지는 시각</h3>
            <div className="rows">
              <div className="r"><span>월출</span><b>{fmtKST(rs.rise)}</b></div>
              <div className="r"><span>남중 (가장 높이)</span><b>{fmtKST(rs.transit)} · {rs.transitAlt != null ? rs.transitAlt.toFixed(0) + '°' : '—'}</b></div>
              <div className="r"><span>월몰</span><b>{fmtKST(rs.set)}</b></div>
            </div>
          </div>
        )}
        <div className="card">
          <h3>해가 뜨고 지는 시각</h3>
          <div className="rows">
            <div className="r"><span>일출</span><b>{fmtKST(sunRs.rise)}</b></div>
            <div className="r"><span>일몰</span><b>{fmtKST(sunRs.set)}</b></div>
            <div className="r"><span>낮의 길이</span><b>{sunRs.rise && sunRs.set ? ((sunRs.set - sunRs.rise) / 3600000).toFixed(1) + '시간' : '—'}</b></div>
          </div>
          <p className="hint">해가 지고 나서 하늘이 충분히 어두워지는 데 30분쯤 더 걸립니다.</p>
        </div>
        <div className="card">
          <h3>{sunMode ? '달은 어디에' : '다음 보름과 삭'}</h3>
          <div className="rows">
            {sunMode ? (
              <>
                <div className="r"><span>오늘의 달</span><b>{phaseName(p)}</b></div>
                <div className="r"><span>월출</span><b>{fmtKST(rs.rise)}</b></div>
                <div className="r"><span>월몰</span><b>{fmtKST(rs.set)}</b></div>
              </>
            ) : (
              <>
                <div className="r"><span>다음 보름달</span><b>{fmtKST(nextFull, true)}</b></div>
                <div className="r"><span>다음 삭</span><b>{fmtKST(nextNew, true)}</b></div>
              </>
            )}
          </div>
          <p className="hint">
            {sunMode
              ? '달도 하루 동안 동에서 서로 움직이지만, 뜨는 시각은 날마다 50분쯤 늦어집니다.'
              : (rs.rise && rs.set && now.alt < 0
                ? '지금은 지평선 아래에 있습니다. 위 슬라이더로 시각을 옮겨 보세요.'
                : '지금 하늘에 떠 있습니다.')}
          </p>
        </div>
      </div>
    </>
  )
}
