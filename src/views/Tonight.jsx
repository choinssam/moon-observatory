import React, { useMemo } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import {
  Astronomy, moonPhase01, moonIllum, moonAge, phaseName, phaseTip,
  riseSetTransit, horizonOf, trackFrom, nightWindowStart, azName, fmtKST, kstMidnight, searchPhase
} from '../lib/astro.js'

const W = 900, H = 440, PAD_L = 46, PAD_R = 16, PAD_T = 18, PAD_B = 34
const AZ0 = 40, AZ1 = 320            // 북동 ~ 북서
const ALT1 = 90

function xOf(az) {
  const a = ((az % 360) + 360) % 360
  const t = (a - AZ0) / (AZ1 - AZ0)
  return PAD_L + Math.max(-0.05, Math.min(1.05, t)) * (W - PAD_L - PAD_R)
}
function yOf(alt) {
  const t = Math.max(-6, Math.min(ALT1, alt)) / ALT1
  return H - PAD_B - t * (H - PAD_T - PAD_B)
}

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

  function setMinutes(m) {
    setDate(new Date(winKey + m * 60000))
  }

  const segs = []
  {
    let cur = []
    for (const q of data.moon) {
      if (q.alt > -1) cur.push(q)
      else if (cur.length) { segs.push(cur); cur = [] }
    }
    if (cur.length) segs.push(cur)
  }

  const nextFull = searchPhase(180, date)
  const nextNew = searchPhase(0, date)

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(260px,320px) minmax(0,1fr)' }}>
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

        <div className="card">
          <h3>오늘 밤 달이 지나가는 길</h3>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 560, height: 'auto' }}
              role="img" aria-label="달의 하루 궤적">
              <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B}
                fill="#0C1120" stroke="var(--line)" />

              {/* 고도 눈금 */}
              {[0, 30, 60, 90].map(a => (
                <g key={a}>
                  <line x1={PAD_L} y1={yOf(a)} x2={W - PAD_R} y2={yOf(a)}
                    stroke="var(--line)" strokeDasharray={a === 0 ? '' : '3 6'} />
                  <text x={PAD_L - 8} y={yOf(a) + 4} textAnchor="end" fill="var(--muted)" fontSize="13">{a}°</text>
                </g>
              ))}
              {/* 방위 눈금 */}
              {[[90, '동'], [135, '남동'], [180, '남'], [225, '남서'], [270, '서']].map(([az, ko]) => (
                <g key={az}>
                  <line x1={xOf(az)} y1={PAD_T} x2={xOf(az)} y2={H - PAD_B} stroke="var(--line)" strokeDasharray="3 6" />
                  <text x={xOf(az)} y={H - PAD_B + 20} textAnchor="middle" fill="var(--muted)" fontSize="13">{ko}</text>
                </g>
              ))}

              {/* 태양 궤적 */}
              <polyline
                points={data.sun.filter(q => q.alt > -1).map(q => `${xOf(q.az)},${yOf(q.alt)}`).join(' ')}
                fill="none" stroke="var(--sun)" strokeOpacity=".35" strokeWidth="2.5" strokeDasharray="5 6" />

              {/* 달 궤적 */}
              {segs.map((s, i) => (
                <polyline key={i} points={s.map(q => `${xOf(q.az)},${yOf(q.alt)}`).join(' ')}
                  fill="none" stroke="var(--moon)" strokeWidth="3.4" strokeLinecap="round" />
              ))}

              {/* 시각 표시 */}
              {data.moon.filter(q => q.min % 120 === 0 && q.alt > 2).map(q => (
                <g key={q.min}>
                  <circle cx={xOf(q.az)} cy={yOf(q.alt)} r="3" fill="var(--moon)" opacity=".7" />
                  <text x={xOf(q.az)} y={yOf(q.alt) - 10} textAnchor="middle" fill="var(--text-2)" fontSize="12">
                    {clockAt(q.min).slice(0, 2)}시
                  </text>
                </g>
              ))}

              {/* 지금 위치 */}
              {now.alt > -2 && (
                <g transform={`translate(${xOf(now.az)},${yOf(now.alt)})`}>
                  <circle r="13" fill="none" stroke="var(--sky)" strokeWidth="2" />
                  <circle r="8" fill="var(--shadow-side)" />
                  <path d={moonPathD(8, p)} fill="var(--moon)" />
                </g>
              )}

              <text x={W - PAD_R} y={PAD_T - 5} textAnchor="end" fill="var(--muted)" fontSize="12">
                낮 12시부터 다음날 낮 12시까지 · 가로 = 방위, 세로 = 고도 · 점선은 태양
              </text>
            </svg>
          </div>

          <div className="toolrow" style={{ marginTop: 10 }}>
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
