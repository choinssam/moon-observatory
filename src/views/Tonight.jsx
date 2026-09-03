import React, { useMemo } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import {
  Astronomy, moonPhase01, moonIllum, moonAge, phaseName, phaseTip,
  riseSetTransit, horizonOf, trackFrom, nightWindowStart, azName, fmtKST, kstMidnight, searchPhase
} from '../lib/astro.js'

/*
 * 남쪽을 바라보고 선 사람 머리 위로 펼쳐진 하늘의 반구.
 * 동쪽 지평선에서 떠서 남쪽 하늘을 지나 서쪽으로 지는 길이 매끈한 호로 보인다.
 * (방위와 고도를 가로세로 눈금에 그대로 놓으면 호가 찌그러진다)
 */
const W = 900, H = 470, CX = W / 2, HY = 392, R = 366
const RAD = Math.PI / 180
function pt(alt, az) {
  const a = alt * RAD, z = az * RAD
  return { x: CX - R * Math.cos(a) * Math.sin(z), y: HY - R * Math.sin(a) }
}
const P = q => { const p = pt(q.alt, q.az); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }
const DOME = `M${CX - R},${HY} A${R},${R} 0 0 1 ${CX + R},${HY} Z`

export default function Tonight({ date, setDate, obs, loc, big }) {
  const vp = useViewport()
  const dayKey = kstMidnight(date).getTime()
  const win = nightWindowStart(date)            // 낮 12시 ~ 다음날 낮 12시
  const winKey = win.getTime()

  const data = useMemo(() => ({
    moon: trackFrom(Astronomy.Body.Moon, obs, win, 24 * 60, 10),
    sun: trackFrom(Astronomy.Body.Sun, obs, win, 24 * 60, 10)
  }), [winKey, loc.lat, loc.lon])

  const rs = useMemo(() => riseSetTransit(Astronomy.Body.Moon, obs, date), [dayKey, loc.lat, loc.lon])
  const sunRs = useMemo(() => riseSetTransit(Astronomy.Body.Sun, obs, date), [dayKey, loc.lat, loc.lon])
  const now = horizonOf(Astronomy.Body.Moon, obs, date)
  const sunNow = horizonOf(Astronomy.Body.Sun, obs, date)

  const p = moonPhase01(date)
  const lib = Astronomy.Libration(date)
  const illum = moonIllum(date)
  const discR = moonSize(vp, big, { min: 96, max: 230 })

  // 슬라이더는 '창' 안에서의 위치. 표시는 실제 시계 시각.
  const minInWin = Math.max(0, Math.min(1439, Math.round((date.getTime() - winKey) / 60000)))
  const clockAt = m => {
    const h = Math.floor(((12 * 60 + m) % 1440) / 60)
    const mm = ((12 * 60 + m) % 1440) % 60
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
  }
  function setMinutes(m) { setDate(new Date(winKey + m * 60000)) }

  const segs = []
  {
    let cur = []
    for (const q of data.moon) {
      if (q.alt > -0.5) cur.push(q)
      else if (cur.length) { segs.push(cur); cur = [] }
    }
    if (cur.length) segs.push(cur)
  }
  const sunPts = data.sun.filter(q => q.alt > -0.5).map(P).join(' ')

  /* 방위선 — 지평선에서 천정까지 올라가는 곡선 */
  const meridian = az => Array.from({ length: 19 }, (_, i) => P({ alt: i * 5, az })).join(' ')

  const nextFull = searchPhase(180, date)
  const nextNew = searchPhase(0, date)
  const nowPt = pt(now.alt, now.az)

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(250px,300px) minmax(0,1fr)', alignItems: 'stretch' }}>
        <div className="card center" style={{ flexDirection: 'column', gap: 12 }}>
          <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
          <div className="big" style={{ color: 'var(--moon)' }}>{phaseName(p)}</div>
          <div className="rows" style={{ width: '100%' }}>
            <div className="r"><span>달의 나이</span><b>{moonAge(date).toFixed(1)}일</b></div>
            <div className="r"><span>밝은 부분</span><b>{(illum * 100).toFixed(0)}%</b></div>
            <div className="r"><span>지금 고도</span><b>{now.alt.toFixed(1)}°</b></div>
            <div className="r"><span>지금 방위</span><b>{azName(now.az)}쪽 {now.az.toFixed(0)}°</b></div>
          </div>
          <div className="note" style={{ width: '100%' }}>{phaseTip(p)}</div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>오늘 밤 달이 지나가는 길
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>남쪽을 바라보고 선 사람 머리 위의 하늘</span>
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
              role="img" aria-label="오늘 밤 달이 지나가는 길">
              <defs>
                <radialGradient id="domeG" cx="50%" cy="100%" r="78%">
                  <stop offset="0%" stopColor="#1C2C56" />
                  <stop offset="65%" stopColor="#0F1734" />
                  <stop offset="100%" stopColor="#090D20" />
                </radialGradient>
              </defs>

              {/* 하늘 반구 */}
              <path d={DOME} fill="url(#domeG)" stroke="var(--line)" strokeWidth="1.5" />

              {/* 고도 눈금 */}
              {[30, 60].map(a => {
                const hw = R * Math.cos(a * RAD), y = HY - R * Math.sin(a * RAD)
                return (
                  <g key={a}>
                    <line x1={CX - hw} y1={y} x2={CX + hw} y2={y} stroke="var(--line)" strokeDasharray="3 7" />
                    <text x={CX - hw + 6} y={y - 6} fill="var(--muted)" fontSize="12">고도 {a}°</text>
                  </g>
                )
              })}

              {/* 방위선 */}
              {[135, 180, 225].map(az => (
                <polyline key={az} points={meridian(az)} fill="none" stroke="var(--line)" strokeDasharray="3 7" />
              ))}

              {/* 땅과 지평선 */}
              <rect x="0" y={HY} width={W} height={H - HY} fill="#0E1712" />
              <line x1="0" y1={HY} x2={W} y2={HY} stroke="var(--muted)" strokeOpacity=".7" strokeWidth="1.5" />
              {[[90, '동'], [135, '남동'], [180, '남'], [225, '남서'], [270, '서']].map(([az, ko]) => (
                <text key={az} x={CX - R * Math.sin(az * RAD)} y={HY + 24} textAnchor="middle"
                  fill="var(--text-2)" fontSize="15" fontWeight="600">{ko}</text>
              ))}

              {/* 관찰자 */}
              <g transform={`translate(${CX},${HY})`} stroke="var(--text-2)" strokeWidth="2.2" strokeLinecap="round">
                <circle cy="-24" r="5" fill="var(--text-2)" stroke="none" />
                <path d="M0,-18 V-5 M-7,-13 H7 M0,-5 L-5,4 M0,-5 L5,4" fill="none" />
              </g>

              {/* 태양의 길 */}
              <polyline points={sunPts} fill="none" stroke="var(--sun)" strokeOpacity=".4" strokeWidth="2.5" strokeDasharray="5 6" />

              {/* 달의 길 */}
              {segs.map((s, i) => (
                <polyline key={i} points={s.map(P).join(' ')}
                  fill="none" stroke="var(--moon)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              ))}

              {/* 시각 표시 */}
              {data.moon.filter(q => q.min % 120 === 0 && q.alt > 3).map(q => {
                const c = pt(q.alt, q.az)
                return (
                  <g key={q.min}>
                    <circle cx={c.x} cy={c.y} r="3.2" fill="var(--moon)" opacity=".8" />
                    <text x={c.x} y={c.y - 10} textAnchor="middle" fill="var(--text-2)" fontSize="12">
                      {clockAt(q.min).slice(0, 2)}시
                    </text>
                  </g>
                )
              })}

              {/* 지금 위치 */}
              {now.alt > -1 && (
                <g transform={`translate(${nowPt.x},${nowPt.y})`}>
                  <circle r="14" fill="none" stroke="var(--sky)" strokeWidth="2" />
                  <circle r="9" fill="var(--shadow-side)" />
                  <path d={moonPathD(9, p)} fill="var(--moon)" />
                </g>
              )}

              <text x={14} y={H - 14} fill="var(--muted)" fontSize="12">
                지평선 0° · 점선은 고도 30°·60° · 반구 꼭대기가 머리 위 90°
              </text>
              <text x={W - 14} y={H - 14} textAnchor="end" fill="var(--muted)" fontSize="12">
                동쪽에서 떠서 남쪽 하늘을 지나 서쪽으로 집니다 · 점선 호는 태양
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
        <div className="card">
          <h3>달이 뜨고 지는 시각</h3>
          <div className="rows">
            <div className="r"><span>월출</span><b>{fmtKST(rs.rise)}</b></div>
            <div className="r"><span>남중 (가장 높이)</span><b>{fmtKST(rs.transit)} · {rs.transitAlt != null ? rs.transitAlt.toFixed(0) + '°' : '—'}</b></div>
            <div className="r"><span>월몰</span><b>{fmtKST(rs.set)}</b></div>
          </div>
        </div>
        <div className="card">
          <h3>해가 뜨고 지는 시각</h3>
          <div className="rows">
            <div className="r"><span>일출</span><b>{fmtKST(sunRs.rise)}</b></div>
            <div className="r"><span>일몰</span><b>{fmtKST(sunRs.set)}</b></div>
            <div className="r"><span>지금 태양 고도</span><b>{sunNow.alt.toFixed(1)}°</b></div>
          </div>
          <p className="hint">해가 지고 나서 하늘이 충분히 어두워지는 데 30분쯤 더 걸립니다.</p>
        </div>
        <div className="card">
          <h3>다음 보름과 삭</h3>
          <div className="rows">
            <div className="r"><span>다음 보름달</span><b>{fmtKST(nextFull, true)}</b></div>
            <div className="r"><span>다음 삭</span><b>{fmtKST(nextNew, true)}</b></div>
          </div>
          <p className="hint">
            {rs.rise && rs.set && now.alt < 0
              ? '지금은 지평선 아래에 있습니다. 위 슬라이더로 시각을 옮겨 보세요.'
              : '지금 하늘에 떠 있습니다.'}
          </p>
        </div>
      </div>
    </>
  )
}
