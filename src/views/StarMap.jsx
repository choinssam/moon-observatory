import React, { useMemo } from 'react'
import { Astronomy, kstMidnight, fmtKST } from '../lib/astro.js'

/* 적경(시), 적위(도), 밝기 */
const UMA = [
  { ko: '두베', ra: 11.062, dec: 61.751, m: 1.8 },
  { ko: '메라크', ra: 11.031, dec: 56.382, m: 2.3 },
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

const W = 960, H = 460, PAD_L = 46, PAD_R = 16, PAD_T = 16, PAD_B = 34
const SPAN = 95

function xOf(azn) { return PAD_L + ((azn + SPAN) / (2 * SPAN)) * (W - PAD_L - PAD_R) }
function yOf(alt) { return H - PAD_B - (Math.max(0, Math.min(90, alt)) / 90) * (H - PAD_T - PAD_B) }
function norm(az) { let a = ((az % 360) + 360) % 360; if (a > 180) a -= 360; return a }

export default function StarMap({ date, setDate, obs, loc }) {
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)

  const placed = useMemo(() => GROUPS.map(g => ({
    ...g,
    pts: g.stars.map(s => {
      const h = Astronomy.Horizon(date, obs, s.ra, s.dec, 'normal')
      return { ...s, azn: norm(h.azimuth), alt: h.altitude }
    })
  })), [date.getTime(), loc.lat, loc.lon])

  const polaris = placed[2].pts[0]
  const merak = placed[0].pts[1]
  const dubhe = placed[0].pts[0]

  const sunAlt = Astronomy.Horizon(date, obs,
    Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true).ra,
    Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true).dec, 'normal').altitude
  const dark = sunAlt < -12

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        북쪽 하늘을 바라본 모습입니다. 별은 스스로 빛을 내고, 행성은 태양 빛을 반사해 빛납니다.
        북극성은 거의 움직이지 않아서 밤에 방향을 찾는 기준이 됩니다.
      </p>

      <div className="stage">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="북쪽 하늘 별자리">
          <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B}
            fill={dark ? '#070B16' : '#16233E'} stroke="var(--line)" />

          {[0, 30, 60, 90].map(a => (
            <g key={a}>
              <line x1={PAD_L} y1={yOf(a)} x2={W - PAD_R} y2={yOf(a)} stroke="var(--line)" strokeDasharray={a === 0 ? '' : '3 7'} />
              <text x={PAD_L - 8} y={yOf(a) + 4} textAnchor="end" fill="var(--muted)" fontSize="13">{a}°</text>
            </g>
          ))}
          {[[-90, '서북서'], [-45, '북서'], [0, '북'], [45, '북동'], [90, '동북동']].map(([a, ko]) => (
            <g key={a}>
              <line x1={xOf(a)} y1={PAD_T} x2={xOf(a)} y2={H - PAD_B} stroke="var(--line)" strokeDasharray="3 7" />
              <text x={xOf(a)} y={H - PAD_B + 20} textAnchor="middle" fill="var(--muted)" fontSize="13">{ko}</text>
            </g>
          ))}

          {/* 북극성 찾는 길잡이 */}
          {merak.alt > 0 && dubhe.alt > 0 && polaris.alt > 0 && (
            <line x1={xOf(merak.azn)} y1={yOf(merak.alt)} x2={xOf(polaris.azn)} y2={yOf(polaris.alt)}
              stroke="var(--moon)" strokeOpacity=".45" strokeWidth="1.6" strokeDasharray="6 7" />
          )}

          {placed.map(g => (
            <g key={g.key}>
              {g.links.map(([a, b], i) => {
                const p1 = g.pts[a], p2 = g.pts[b]
                if (p1.alt < 0 || p2.alt < 0) return null
                return <line key={i} x1={xOf(p1.azn)} y1={yOf(p1.alt)} x2={xOf(p2.azn)} y2={yOf(p2.alt)}
                  stroke={g.color} strokeOpacity=".5" strokeWidth="1.8" />
              })}
              {g.pts.map((s, i) => {
                if (s.alt < 0 || Math.abs(s.azn) > SPAN) return null
                const r = Math.max(2.2, 7.4 - s.m * 1.15)
                return (
                  <g key={i}>
                    <circle cx={xOf(s.azn)} cy={yOf(s.alt)} r={r + (s.polaris ? 4 : 0)}
                      fill={s.polaris ? 'none' : '#fff'}
                      stroke={s.polaris ? 'var(--moon)' : 'none'} strokeWidth="2" />
                    {s.polaris && <circle cx={xOf(s.azn)} cy={yOf(s.alt)} r={r} fill="var(--moon)" />}
                    {(s.polaris || s.m < 2.4) && (
                      <text x={xOf(s.azn)} y={yOf(s.alt) - r - 8} textAnchor="middle"
                        fill={s.polaris ? 'var(--moon)' : 'var(--text-2)'} fontSize="13"
                        fontWeight={s.polaris ? 700 : 400}>{s.ko}</text>
                    )}
                  </g>
                )
              })}
            </g>
          ))}

          <text x={W - PAD_R} y={PAD_T + 16} textAnchor="end" fill="var(--muted)" fontSize="13">
            {dark ? '하늘이 충분히 어둡습니다' : '아직 밝아 별이 보이지 않는 시각입니다'}
          </text>
        </svg>
      </div>

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
        </div>
        <p className="hint">
          시각을 밀어 보면 별자리가 북극성을 중심으로 도는 것이 보입니다. 실제로 도는 것은 별이 아니라 지구입니다.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
        <div className="card">
          <h3>북극성 찾는 법</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            북두칠성 국자의 끝 두 별(메라크 → 두베)을 이어 그 간격의 <b>5배</b>만큼 늘이면 북극성입니다.
            그림의 노란 점선이 그 길입니다. 북두칠성이 지평선 아래일 때는 반대편 카시오페이아자리로 찾습니다.
          </p>
        </div>
        <div className="card">
          <h3>별과 행성</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            별은 태양처럼 스스로 빛을 내는 천체입니다. 너무 멀어서 하룻밤 사이에는 서로의 자리가 바뀌지 않아
            늘 같은 모양의 별자리를 이룹니다. 반대로 행성은 별들 사이를 옮겨 다녀서 <b>떠돌이별</b>이라 불립니다.
          </p>
        </div>
        <div className="card">
          <h3>지금 시각</h3>
          <div className="rows">
            <div className="r"><span>보고 있는 시각</span><b>{fmtKST(date, true)}</b></div>
            <div className="r"><span>북극성의 고도</span><b>{polaris.alt.toFixed(1)}°</b></div>
            <div className="r"><span>이 지역의 위도</span><b>{loc.lat.toFixed(2)}°</b></div>
          </div>
          <p className="hint">북극성의 고도는 그 지역의 위도와 거의 같습니다. 직접 견주어 보세요.</p>
        </div>
      </div>
    </>
  )
}
