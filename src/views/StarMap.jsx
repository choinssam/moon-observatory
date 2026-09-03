import React, { useMemo } from 'react'
import { Astronomy, kstMidnight, fmtKST } from '../lib/astro.js'

/* 적경(시), 적위(도), 밝기 */
const UMA = [
  { ko: '두베', ra: 11.062, dec: 61.751, m: 1.8, pointer: true },
  { ko: '메라크', ra: 11.031, dec: 56.382, m: 2.3, pointer: 'below' },
  { ko: '페크다', ra: 11.897, dec: 53.695, m: 2.4 },
  { ko: '메그레즈', ra: 12.257, dec: 57.033, m: 3.3 },
  { ko: '알리오트', ra: 12.900, dec: 55.960, m: 1.8 },
  { ko: '미자르', ra: 13.399, dec: 54.925, m: 2.2 },
  { ko: '알카이드', ra: 13.792, dec: 49.313, m: 1.9 }
]
const CAS = [
  { ko: '카프', ra: 0.153, dec: 59.150, m: 2.3 },
  { ko: '쉐다르', ra: 0.675, dec: 56.537, m: 2.2 },
  { ko: '감마', ra: 0.945, dec: 60.717, m: 2.5 },
  { ko: '루크바', ra: 1.430, dec: 60.235, m: 2.7 },
  { ko: '세긴', ra: 1.906, dec: 63.670, m: 3.4 }
]
const UMI = [
  { ko: '북극성', ra: 2.530, dec: 89.264, m: 2.0, polaris: true },
  { ko: '델타', ra: 17.537, dec: 86.586, m: 4.4 },
  { ko: '엡실론', ra: 16.766, dec: 82.037, m: 4.2 },
  { ko: '제타', ra: 15.734, dec: 77.794, m: 4.3 },
  { ko: '코카브', ra: 14.845, dec: 74.155, m: 2.1 },
  { ko: '페르카드', ra: 15.345, dec: 71.834, m: 3.0 },
  { ko: '에타', ra: 16.291, dec: 75.755, m: 5.0 }
]

const GROUPS = [
  { key: 'uma', ko: '북두칠성 (큰곰자리)', color: '#F2C879', stars: UMA, links: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
  { key: 'cas', ko: '카시오페이아자리', color: '#8ED3E0', stars: CAS, links: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { key: 'umi', ko: '작은곰자리', color: '#B7C0DA', stars: UMI, links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }
]

/*
 * 하늘의 북극을 한가운데 두고, 거기서 떨어진 각도를 그대로 반지름으로 삼는다.
 * 이렇게 그려야 별들이 북극성을 중심으로 '동그랗게' 돈다.
 * (방위·고도를 가로세로에 그대로 놓으면 원이 찌그러진다)
 */
const W = 700, H = 700, CX = W / 2, CY = W / 2
const SCALE = 2.8                    // 1도 = 2.8px
const RAD = Math.PI / 180

function project(polarAlt, alt, az) {
  const aC = polarAlt * RAD, aS = alt * RAD, dz = az * RAD    // 북극의 방위는 0°(정북)
  const cosR = Math.sin(aC) * Math.sin(aS) + Math.cos(aC) * Math.cos(aS) * Math.cos(dz)
  const rho = Math.acos(Math.max(-1, Math.min(1, cosR)))
  const sinR = Math.sin(rho)
  if (sinR < 1e-9) return { x: CX, y: CY, deg: 0 }
  const sinPhi = (Math.cos(aS) * Math.sin(dz)) / sinR
  const cosPhi = (Math.sin(aS) - Math.sin(aC) * cosR) / (Math.cos(aC) * sinR)
  const phi = Math.atan2(sinPhi, cosPhi)                      // 0 = 천정 쪽(위)
  const r = (rho / RAD) * SCALE
  return { x: CX + r * Math.sin(phi), y: CY - r * Math.cos(phi), deg: rho / RAD }
}

export default function StarMap({ date, setDate, obs, loc }) {
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)
  const polarAlt = loc.lat                                    // 북극의 고도 = 그 지역의 위도

  const placed = useMemo(() => GROUPS.map(g => ({
    ...g,
    pts: g.stars.map(s => {
      const h = Astronomy.Horizon(date, obs, s.ra, s.dec, 'normal')
      return { ...s, ...project(polarAlt, h.altitude, h.azimuth), alt: h.altitude }
    })
  })), [date.getTime(), loc.lat, loc.lon])

  /* 지평선 — 별이 도는 동안에도 관측자에게 고정된 곡선 */
  const horizon = useMemo(() => {
    const pts = []
    for (let az = 0; az <= 360; az += 2) {
      const p = project(polarAlt, 0, az)
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [loc.lat])

  const labels = useMemo(() => {
    const all = []
    placed.forEach(g => g.pts.forEach(s => {
      if (s.alt < 0) return
      if (!(s.polaris || s.pointer || s.m < 2.4)) return
      all.push({ ...s, color: g.color })
    }))
    const rank = s => (s.polaris ? 0 : s.pointer ? 1 : 2 + s.m)
    all.sort((a, b) => rank(a) - rank(b))
    const keep = []
    for (const l of all) {
      const dy = l.pointer === 'below' ? 26 : 0
      if (keep.some(k => Math.abs(k.x - l.x) < 68 && Math.abs(k.y - (l.y + dy)) < 20)) continue
      keep.push({ ...l, y: l.y + dy, below: l.pointer === 'below' })
    }
    return keep
  }, [placed])

  const polaris = placed[2].pts[0]
  const merak = placed[0].pts[1]

  const sunEq = Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true)
  const sunAlt = Astronomy.Horizon(date, obs, sunEq.ra, sunEq.dec, 'normal').altitude
  const dark = sunAlt < -12

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: 'none' }}>
        북쪽 하늘을 올려다본 모습입니다.
        <b style={{ color: 'var(--moon)' }}> 북극성을 한가운데 두고 그려서, 시각을 밀면 별들이 동그랗게 돕니다.</b>
        실제로 도는 것은 별이 아니라 지구입니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(280px,1fr)', alignItems: 'start' }}>
        <div className="stage">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
          role="img" aria-label="북쪽 하늘 별자리">
          <defs>
            <clipPath id="skyClip"><polygon points={horizon} /></clipPath>
            <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dark ? '#0C1228' : '#1A2D54'} />
              <stop offset="85%" stopColor={dark ? '#060A18' : '#152040'} />
              <stop offset="100%" stopColor="#030610" />
            </radialGradient>
            <clipPath id="domeClip"><circle cx={CX} cy={CY} r={Math.min(CX, CY) - 4} /></clipPath>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="#030610" />
          <circle cx={CX} cy={CY} r={Math.min(CX, CY) - 4} fill="url(#skyGrad)" />
          <polygon points={horizon} fill={dark ? '#070B16' : '#16233E'} />

          <g clipPath="url(#domeClip)">
            <g clipPath="url(#skyClip)">
              {[20, 40, 60].map(d => (
                <circle key={d} cx={CX} cy={CY} r={d * SCALE} fill="none"
                  stroke="var(--line)" strokeDasharray="3 7" />
              ))}
            </g>

            <polygon points={horizon} fill="none" stroke="var(--muted)" strokeOpacity=".5" strokeWidth="1.6" />

          {/* 북극성 찾는 길잡이 */}
          {merak.alt > 0 && polaris.alt > 0 && (
            <line x1={merak.x} y1={merak.y} x2={polaris.x} y2={polaris.y}
              stroke="var(--moon)" strokeOpacity=".45" strokeWidth="1.6" strokeDasharray="6 7" />
          )}

          {placed.map(g => (
            <g key={g.key}>
              {g.links.map(([a, b], i) => {
                const p1 = g.pts[a], p2 = g.pts[b]
                if (p1.alt < 0 || p2.alt < 0) return null
                return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={g.color} strokeOpacity=".55" strokeWidth="1.8" />
              })}
              {g.pts.map((s, i) => {
                if (s.alt < 0) return null
                const r = Math.max(2.2, 7.4 - s.m * 1.15)
                return (
                  <g key={i}>
                    {s.polaris && <circle cx={s.x} cy={s.y} r={r + 5} fill="none" stroke="var(--moon)" strokeWidth="2" />}
                    <circle cx={s.x} cy={s.y} r={r} fill={s.polaris ? 'var(--moon)' : '#fff'} />
                  </g>
                )
              })}
            </g>
          ))}

          {labels.map((l, i) => (
            <text key={i} x={l.x}
              y={l.below ? l.y + 4 : l.y - Math.max(2.2, 7.4 - l.m * 1.15) - (l.polaris ? 15 : 9)}
              textAnchor="middle" fill={l.polaris ? 'var(--moon)' : 'var(--text-2)'} fontSize="14"
              fontWeight={l.polaris ? 700 : 400}
              stroke="#070B16" strokeWidth="3.5" paintOrder="stroke">{l.ko}</text>
          ))}

          {/* 지평선 위의 방위 */}
          {[[0, '북'], [90, '동'], [270, '서']].map(([az, ko]) => {
            const p = project(polarAlt, 0, az)
            const dx = p.x - CX, dy = p.y - CY
            const len = Math.hypot(dx, dy) || 1
            return (
              <text key={az} x={p.x + dx / len * 20} y={p.y + dy / len * 20 + 5} textAnchor="middle"
                fill="var(--muted)" fontSize="16" fontWeight="600">{ko}</text>
            )
          })}
          </g>

          <circle cx={CX} cy={CY} r={Math.min(CX, CY) - 4} fill="none"
            stroke="var(--line)" strokeOpacity=".4" strokeWidth="1.5" />

          <text x={W - 14} y={24} textAnchor="end" fill="var(--muted)" fontSize="13">
            {dark ? '하늘이 충분히 어둡습니다' : '아직 밝아 별이 보이지 않는 시각입니다'}
          </text>
          <text x={14} y={H - 12} fill="var(--muted)" fontSize="12">
            가운데 = 하늘의 북극 · 점선 원은 북극에서 20°·40°·60° 떨어진 거리 · 바깥 곡선이 지평선
          </text>
        </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div className="toolrow">
          <span className="mono" style={{ color: 'var(--muted)' }}>시각</span>
          <input className="slider" style={{ flex: 1 }} type="range" min="0" max="1439" step="5"
            value={minutesOfDay} onChange={e => setDate(new Date(dayKey + Number(e.target.value) * 60000))}
            aria-label="시각" />
          <b className="mono" style={{ minWidth: '4.5em', textAlign: 'right' }}>
            {String(Math.floor(minutesOfDay / 60)).padStart(2, '0')}:{String(minutesOfDay % 60).padStart(2, '0')}
          </b>
          <button className="btn" onClick={() => setDate(new Date(dayKey + 21 * 3600000))}>밤 9시</button>
          <button className="btn" onClick={() => setDate(new Date(dayKey + 3 * 3600000))}>새벽 3시</button>
        </div>
        <p className="hint">
          별자리 모양은 그대로인 채 통째로 돌아갑니다. 하루에 한 바퀴, 시계 반대 방향입니다.
        </p>
      </div>

        <div className="card">
          <h3>북극성 찾는 법</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            북두칠성 국자의 끝 두 별(메라크 → 두베)을 이어 그 간격의 <b>5배</b>만큼 늘이면 북극성입니다.
            그림의 노란 점선이 그 길입니다. 북두칠성이 지평선 아래일 때는 반대편 카시오페이아자리로 찾습니다.
          </p>
        </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <div className="card">
          <h3>왜 북극성만 안 움직일까</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            지구의 자전축을 하늘 쪽으로 쭉 늘이면 그 끝 근처에 북극성이 있습니다.
            축 위에 있으니 지구가 아무리 돌아도 자리가 거의 바뀌지 않고, 나머지 별들이 그 둘레를 도는 것처럼 보입니다.
          </p>
        </div>
        <div className="card">
          <h3>지금 하늘</h3>
          <div className="rows">
            <div className="r"><span>보고 있는 시각</span><b>{fmtKST(date, true)}</b></div>
            <div className="r"><span>북극성의 고도</span><b>{polarAlt.toFixed(1)}°</b></div>
            <div className="r"><span>이 지역의 위도</span><b>{loc.lat.toFixed(2)}°</b></div>
          </div>
          <p className="hint">북극성의 고도는 그 지역의 위도와 같습니다. 제주에서는 낮게, 강원도에서는 높게 보입니다.</p>
        </div>
      </div>
    </>
  )
}
