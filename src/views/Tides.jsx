import React, { useEffect, useRef, useState } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import { Astronomy, moonPhase01, phaseName, riseSetTransit, fmtKST } from '../lib/astro.js'

/* ---------- 바닷가 옆모습 ---------- */
const SW = 900, SH = 430
const HIGH_Y = 196          // 만조선
const LOW_Y = 330           // 간조선
/* 바닥 단면 — 왼쪽은 뭍, 오른쪽으로 완만하게 깊어진다 */
const GROUND = `0,120 150,122 250,168 380,232 520,286 680,330 800,356 900,368 900,${SH} 0,${SH}`

/* ---------- 위에서 내려다본 그림 ---------- */
const TW = 560, TH = 330, TCX = 210, TCY = 168, ER = 78

export default function Tides({ date, obs }) {
  const [t, setT] = useState(0.0)            // 0~1 : 지구가 한 바퀴 자전
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const step = now => {
      const dt = (now - last) / 1000; last = now
      setT(v => (v + dt / 16) % 1)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  const p = moonPhase01(date)
  const off = Math.abs(((p % 0.5) + 0.5) % 0.5)
  const spring = Math.min(off, 0.5 - off) < 0.06          // 삭·보름 근처면 사리
  const rs = riseSetTransit(Astronomy.Body.Moon, obs, date)

  const spot = -t * 2 * Math.PI
  const bulge = Math.abs(Math.cos(spot))                   // 1 = 만조, 0 = 간조
  const range = spring ? 1 : 0.55                          // 사리면 차이가 크다
  const lvl = 0.5 - range / 2 + bulge * range              // 0~1 사이 실제 물 높이
  const waterY = LOW_Y - (LOW_Y - HIGH_Y) * lvl

  const rising = Math.sin(spot) * Math.cos(spot) > 0
  const level = bulge > 0.75 ? '만조' : bulge < 0.25 ? '간조' : rising ? '밀물' : '썰물'
  const hours = (t * 24.84).toFixed(1)
  const meters = (1.2 + lvl * 7.6).toFixed(1)              // 서해안 정도의 조차로 환산

  /* 물에 잠기지 않은 갯벌 위의 생물 */
  const CREATURES = [[430, 252], [500, 279], [560, 292], [620, 311], [470, 268], [660, 322]]

  const sx = TCX + ER * Math.cos(spot)
  const sy = TCY - ER * Math.sin(spot)

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: 'none' }}>
        달이 바닷물을 끌어당겨 달 쪽과 그 반대쪽 바닷물이 부풀어 오릅니다.
        지구가 하루에 한 바퀴 자전하면서 이 부푼 곳을 두 번 지나기 때문에, 밀물과 썰물이 하루에 약 두 번씩 되풀이됩니다.
      </p>

      {/* ---------- 바닷가에서 본 모습 ---------- */}
      <div className="stage">
        <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: '100%', height: 'auto' }}
          role="img" aria-label="바닷가의 밀물과 썰물">
          <defs>
            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#101A33" />
              <stop offset="100%" stopColor="#1E2C4E" />
            </linearGradient>
            <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2E6FB8" stopOpacity=".78" />
              <stop offset="100%" stopColor="#123A6B" stopOpacity=".92" />
            </linearGradient>
            <clipPath id="landClip"><polygon points={GROUND} /></clipPath>
          </defs>

          <rect width={SW} height={SH} fill="url(#skyG)" />

          {/* 바닥 — 갯벌 색, 위쪽만 뭍 */}
          <polygon points={GROUND} fill="#6B5A44" />
          <g clipPath="url(#landClip)">
            <rect x="0" y="0" width={SW} height={HIGH_Y} fill="#3B5A3C" />
          </g>

          {/* 드러난 갯벌의 생물 */}
          {CREATURES.map(([x, y], i) => y < waterY && (
            <g key={i} opacity=".85">
              <ellipse cx={x} cy={y} rx="6" ry="4" fill="#C9B48E" />
              <ellipse cx={x} cy={y - 1} rx="3" ry="2" fill="#8B7A5C" />
            </g>
          ))}

          {/* 바닷물 */}
          <rect x="0" y={waterY} width={SW} height={SH - waterY} fill="url(#seaG)" />
          <path d={`M0,${waterY} ${Array.from({ length: 19 }, (_, i) =>
            `Q ${i * 50 + 25},${waterY + (i % 2 ? 5 : -5)} ${i * 50 + 50},${waterY}`).join(' ')}`}
            fill="none" stroke="#8FC4F0" strokeOpacity=".7" strokeWidth="2" />

          {/* 만조선·간조선 */}
          <line x1="0" y1={HIGH_Y} x2={SW} y2={HIGH_Y} stroke="var(--warn)" strokeOpacity=".55" strokeDasharray="7 7" />
          <text x="10" y={HIGH_Y - 8} fill="var(--warn)" fontSize="14" fontWeight="600">만조선</text>
          <line x1="0" y1={LOW_Y} x2={SW} y2={LOW_Y} stroke="var(--sky)" strokeOpacity=".45" strokeDasharray="7 7" />
          <text x="10" y={LOW_Y + 20} fill="var(--sky)" fontSize="14" fontWeight="600">간조선</text>

          {/* 배 — 물이 깊으면 뜨고, 빠지면 갯벌에 앉는다 */}
          {(() => {
            const boatX = 560
            const groundY = 292
            const afloat = waterY < groundY - 8
            const by = afloat ? waterY : groundY
            const tiltDeg = afloat ? 0 : -12
            return (
              <g transform={`translate(${boatX},${by}) rotate(${tiltDeg})`}>
                <path d="M-34,0 L34,0 L24,17 L-24,17 Z" fill="#C6552F" />
                <rect x="-2" y="-30" width="3" height="30" fill="#E3D9C6" />
                <path d="M2,-28 L24,-6 L2,-6 Z" fill="#E3D9C6" />
              </g>
            )
          })()}

          {/* 물 높이 눈금 */}
          <g transform={`translate(${SW - 74},0)`}>
            <rect x="0" y={HIGH_Y - 14} width="30" height={LOW_Y - HIGH_Y + 28} rx="7"
              fill="#0C1120" stroke="var(--line)" />
            <rect x="4" y={waterY} width="22" height={LOW_Y + 14 - waterY} rx="4" fill="#2E6FB8" opacity=".85" />
            <text x="15" y={HIGH_Y - 22} textAnchor="middle" fill="var(--muted)" fontSize="12">높이</text>
            <text x="15" y={LOW_Y + 44} textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">{meters}m</text>
          </g>

          <text x={SW / 2} y={26} textAnchor="middle" fill="var(--muted)" fontSize="14">
            바닷가에서 본 모습 · 물 높이는 서해안 정도의 조차로 나타냈습니다
          </text>
        </svg>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(320px,1fr) minmax(0,1.1fr)', alignItems: 'start' }}>
        <div className="card">
          <h3>바닷가의 지금</h3>
          <div className="big" style={{ color: bulge > 0.5 ? 'var(--sky)' : 'var(--moon)' }}>{level}</div>
          <div className="rows" style={{ marginTop: 10 }}>
            <div className="r"><span>자전 시작부터</span><b>{hours}시간</b></div>
            <div className="r"><span>물 높이</span><b>{meters} m</b></div>
            <div className="r"><span>오늘의 달</span><b>{phaseName(p)}</b></div>
            <div className="r"><span>조수</span>
              <b style={{ color: spring ? 'var(--warn)' : 'var(--sky)' }}>
                {spring ? '사리 (차이가 큼)' : '조금 (차이가 작음)'}
              </b>
            </div>
            <div className="r"><span>달의 남중</span><b>{fmtKST(rs.transit)}</b></div>
          </div>
          <div className="toolrow" style={{ marginTop: 12 }}>
            <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
              {playing ? '멈춤' : '하루 재생'}
            </button>
            <button className="btn" onClick={() => { setPlaying(false); setT(0) }}>만조로</button>
            <button className="btn" onClick={() => { setPlaying(false); setT(0.25) }}>간조로</button>
          </div>
          <input className="slider" type="range" min="0" max="0.999" step="0.001" value={t}
            onChange={e => { setPlaying(false); setT(Number(e.target.value)) }} aria-label="하루 중 시각" />
          <p className="hint">
            밀물과 썰물이 한 번 되풀이되는 데 약 12시간 25분이 걸립니다.
            보름과 삭에는 태양까지 한 줄로 서서 힘이 합쳐지므로 물 높이 차가 커집니다(사리).
          </p>
        </div>

        <div className="stage">
          <svg viewBox={`0 0 ${TW} ${TH}`} style={{ width: '100%', height: 'auto' }}
            role="img" aria-label="위에서 내려다본 밀물과 썰물">
            <ellipse cx={TCX} cy={TCY} rx={ER + 26} ry={ER + 5} fill="#1B3A6B" opacity=".85" />
            <ellipse cx={TCX} cy={TCY} rx={ER + 26} ry={ER + 5} fill="none" stroke="var(--sky)" strokeOpacity=".45" />
            <circle cx={TCX} cy={TCY} r={ER} fill="#2C4A2E" />
            <circle cx={TCX} cy={TCY} r={ER} fill="none" stroke="rgba(255,255,255,.2)" />
            <text x={TCX} y={TCY + 5} textAnchor="middle" fill="#BFD8C2" fontSize="16" fontWeight="700">지구</text>

            <line x1={TCX} y1={TCY} x2={sx} y2={sy} stroke="var(--line)" strokeDasharray="3 5" />
            <circle cx={sx} cy={sy} r="8" fill="var(--warn)" stroke="#000" strokeWidth="1.5" />
            <text x={sx} y={sy - 15} textAnchor="middle" fill="var(--warn)" fontSize="13" fontWeight="700">바닷가</text>

            <g transform={`translate(${TW - 62},${TCY})`}>
              <circle r="26" fill="var(--shadow-side)" />
              <path d={moonPathD(26, p)} fill="var(--moon)" />
              <circle r="26" fill="none" stroke="rgba(255,255,255,.25)" />
              <text y="46" textAnchor="middle" fill="var(--moon)" fontSize="14" fontWeight="700">달</text>
            </g>
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1={TCX + ER + 30} y1={TCY - 36 + i * 18} x2={TW - 92} y2={TCY - 36 + i * 18}
                stroke="var(--moon)" strokeOpacity=".25" strokeWidth="1.5" strokeDasharray="4 6" />
            ))}
            <text x={TW / 2} y={26} textAnchor="middle" fill="var(--muted)" fontSize="13">
              북극 위에서 내려다본 그림 · 부풀기는 크게 과장했습니다
            </text>
          </svg>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div className="card">
          <h3>갯벌이 생기는 곳</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            우리나라 서해안은 물의 높이 차가 크고 바닥이 완만해서, 썰물 때 넓은 바닥이 드러납니다.
            이곳이 갯벌입니다. 조개·게·짱뚱어 같은 생물이 살고, 바닷물을 깨끗하게 걸러 주며,
            태풍이 왔을 때 파도의 힘을 줄여 줍니다.
          </p>
        </div>
        <div className="card">
          <h3>바다가 주는 것</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            썰물 때 조개를 캐고, 밀물과 썰물의 높이 차로 전기를 만들기도 합니다(조력 발전).
            갯벌을 메워 땅으로 만들면 이런 것들이 함께 사라집니다.
          </p>
        </div>
        <div className="card">
          <h3>왜 반대쪽도 부풀까</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            달과 가까운 쪽은 더 세게 끌리고, 지구 반대쪽은 덜 끌립니다.
            그 차이 때문에 바닷물이 양쪽으로 부풀어, 하루에 밀물과 썰물이 두 번씩 생깁니다.
          </p>
          <p className="hint">
            실제 만조 시각은 지역마다 크게 달라, 국립해양조사원의 조석 예보를 함께 보시면 좋습니다.
          </p>
        </div>
      </div>
    </>
  )
}
