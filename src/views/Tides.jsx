import React, { useEffect, useRef, useState } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import { Astronomy, moonPhase01, phaseName, riseSetTransit, fmtKST, kstMidnight } from '../lib/astro.js'

const W = 660, H = 400, CX = 250, CY = 205, ER = 92

export default function Tides({ date, obs, loc }) {
  const [t, setT] = useState(0)          // 0~1 : 지구가 한 바퀴 자전
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const step = now => {
      const dt = (now - last) / 1000; last = now
      setT(v => (v + dt / 14) % 1)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  const p = moonPhase01(date)
  const spring = Math.min(
    Math.abs(((p % 0.5) + 0.5) % 0.5),
    0.5 - Math.abs(((p % 0.5) + 0.5) % 0.5)
  ) < 0.06                                  // 삭·보름 근처면 사리
  const rs = riseSetTransit(Astronomy.Body.Moon, obs, date)

  // 달은 오른쪽에 둔다. 관측 지점은 지구 자전에 따라 돈다.
  const spot = -t * 2 * Math.PI
  const sx = CX + ER * Math.cos(spot)
  const sy = CY - ER * Math.sin(spot)
  const bulge = Math.abs(Math.cos(spot))     // 1 = 만조, 0 = 간조
  const level = bulge > 0.72 ? '만조 (밀물의 끝)' : bulge < 0.28 ? '간조 (썰물의 끝)' : bulge > 0.5 ? '밀물' : '썰물'
  const hours = (t * 24.84).toFixed(1)

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        달이 바닷물을 끌어당겨 달 쪽과 그 반대쪽 바닷물이 부풀어 오릅니다.
        지구가 하루에 한 바퀴 자전하면서 이 부푼 곳을 두 번 지나기 때문에, 밀물과 썰물이 하루에 약 두 번씩 되풀이됩니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(270px,1fr)' }}>
        <div className="stage">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="밀물과 썰물">
            {/* 부푼 바닷물 */}
            <ellipse cx={CX} cy={CY} rx={ER + 30} ry={ER + 6} fill="#1B3A6B" opacity=".85" />
            <ellipse cx={CX} cy={CY} rx={ER + 30} ry={ER + 6} fill="none" stroke="var(--sky)" strokeOpacity=".45" />
            {/* 지구 */}
            <circle cx={CX} cy={CY} r={ER} fill="#2C4A2E" />
            <circle cx={CX} cy={CY} r={ER} fill="none" stroke="rgba(255,255,255,.2)" />
            <text x={CX} y={CY + 5} textAnchor="middle" fill="#BFD8C2" fontSize="17" fontWeight="700">지구</text>

            {/* 관측 지점 */}
            <g>
              <line x1={CX} y1={CY} x2={sx} y2={sy} stroke="var(--line)" strokeDasharray="3 5" />
              <circle cx={sx} cy={sy} r="9" fill="var(--warn)" stroke="#000" strokeWidth="1.5" />
              <text x={sx} y={sy - 16} textAnchor="middle" fill="var(--warn)" fontSize="14" fontWeight="700">바닷가</text>
            </g>

            {/* 달 */}
            <g transform={`translate(${W - 78},${CY})`}>
              <circle r="30" fill="var(--shadow-side)" />
              <path d={moonPathD(30, p)} fill="var(--moon)" />
              <circle r="30" fill="none" stroke="rgba(255,255,255,.25)" />
              <text y="52" textAnchor="middle" fill="var(--moon)" fontSize="15" fontWeight="700">달</text>
            </g>
            {Array.from({ length: 5 }, (_, i) => (
              <line key={i} x1={CX + ER + 34} y1={CY - 40 + i * 20} x2={W - 112} y2={CY - 40 + i * 20}
                stroke="var(--moon)" strokeOpacity=".25" strokeWidth="1.5" strokeDasharray="4 6" />
            ))}
            <text x={W / 2} y={32} textAnchor="middle" fill="var(--muted)" fontSize="14">
              북극 위에서 내려다본 그림 · 바닷물의 부풀기는 크게 과장했습니다
            </text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <h3>바닷가의 지금</h3>
            <div className="big" style={{ color: bulge > 0.5 ? 'var(--sky)' : 'var(--moon)' }}>{level}</div>
            <div className="rows" style={{ marginTop: 10 }}>
              <div className="r"><span>자전 시작부터</span><b>{hours}시간</b></div>
              <div className="r"><span>바닷물 높이</span><b>{(bulge * 100).toFixed(0)}%</b></div>
            </div>
            <div className="toolrow" style={{ marginTop: 10 }}>
              <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
                {playing ? '멈춤' : '하루 재생'}
              </button>
              <button className="btn" onClick={() => { setPlaying(false); setT(0) }}>처음으로</button>
            </div>
            <input className="slider" type="range" min="0" max="0.999" step="0.001" value={t}
              onChange={e => { setPlaying(false); setT(Number(e.target.value)) }} aria-label="하루 중 시각" />
            <p className="hint">
              밀물과 썰물이 한 번 되풀이되는 데 약 12시간 25분이 걸립니다.
              달도 지구를 도는 중이라 하루가 24시간보다 약 50분 깁니다.
            </p>
          </div>

          <div className="card">
            <h3>오늘은 사리일까 조금일까</h3>
            <div className="rows">
              <div className="r"><span>오늘의 달</span><b>{phaseName(p)}</b></div>
              <div className="r"><span>조수</span>
                <b style={{ color: spring ? 'var(--warn)' : 'var(--sky)' }}>{spring ? '사리 (차이가 큼)' : '조금 (차이가 작음)'}</b>
              </div>
              <div className="r"><span>달의 남중</span><b>{fmtKST(rs.transit)}</b></div>
            </div>
            <p className="hint">
              보름과 삭에는 태양과 달이 한 줄로 서서 끌어당기는 힘이 합쳐져 <b>사리</b>가 되고,
              상현·하현에는 힘이 어긋나 <b>조금</b>이 됩니다. 실제 만조 시각은 지역마다 달라
              국립해양조사원의 조석 예보를 함께 보면 좋습니다.
            </p>
          </div>
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
        </div>
      </div>
    </>
  )
}
