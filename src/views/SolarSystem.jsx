import React, { useEffect, useRef, useState } from 'react'
import { PLANETS, planetXY, addDays, fmtDateKST } from '../lib/astro.js'

const FACTS = {
  수성: { period: 0.241, day: '58.6일', note: '태양에 가장 가깝고 가장 작습니다. 공기가 없어 낮과 밤의 온도 차가 600도가 넘습니다.' },
  금성: { period: 0.615, day: '243일', note: '두꺼운 이산화탄소 구름에 덮여 표면이 460도나 됩니다. 새벽이나 초저녁에 아주 밝게 보입니다.' },
  지구: { period: 1.0, day: '24시간', note: '물과 공기가 있어 생물이 사는, 지금까지 알려진 유일한 행성입니다.' },
  화성: { period: 1.881, day: '24.6시간', note: '산화철 때문에 붉게 보입니다. 태양계에서 가장 높은 화산 올림푸스산이 있습니다.' },
  목성: { period: 11.86, day: '9.9시간', note: '가장 큰 행성. 지구 1300개가 들어갑니다. 대적점이라는 거대한 소용돌이가 있습니다.' },
  토성: { period: 29.46, day: '10.7시간', note: '얼음과 돌로 된 뚜렷한 고리가 있습니다. 물보다 가벼워 물에 넣으면 뜹니다.' },
  천왕성: { period: 84.01, day: '17.2시간', note: '옆으로 누워서 돕니다. 메탄 때문에 청록색으로 보입니다.' },
  해왕성: { period: 164.8, day: '16.1시간', note: '가장 바깥 행성. 시속 2000km가 넘는 바람이 붑니다.' }
}

const W = 1080, H = 800, CX = W / 2, CY = H / 2, RMAX = 358

export default function SolarSystem({ date, big }) {
  const [mode, setMode] = useState('even')      // even | real
  const [offset, setOffset] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [picked, setPicked] = useState('지구')
  const raf = useRef(0)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const step = now => {
      const dt = (now - last) / 1000; last = now
      setOffset(v => v + dt * 60)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  const at = addDays(date, offset)

  function radiusOf(p, i) {
    if (mode === 'real') return 34 + (p.au / 30.07) * (RMAX - 34)
    return 52 + (i / (PLANETS.length - 1)) * (RMAX - 52)
  }

  const maxDia = 142984
  const sel = PLANETS.find(p => p.ko === picked)

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        태양계를 북쪽 위에서 내려다본 그림입니다. 행성의 위치는 오늘 실제 위치를 계산한 것입니다.
        재생을 누르면 안쪽 행성이 훨씬 빨리 도는 것을 볼 수 있습니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(270px,1fr)' }}>
        <div className="stage">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="태양계">
            <defs>
              <radialGradient id="sun2">
                <stop offset="0%" stopColor="#FFF3C4" />
                <stop offset="55%" stopColor="#FFAE33" />
                <stop offset="100%" stopColor="#C25A00" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r="30" fill="url(#sun2)" />
            <text x={CX} y={CY + 54} textAnchor="middle" fill="var(--sun)" fontSize="24" fontWeight="700">태양</text>

            {PLANETS.map((p, i) => {
              const R = radiusOf(p, i)
              const v = planetXY(p, at)
              const ang = Math.atan2(v.y, v.x)
              const x = CX + R * Math.cos(ang)
              const y = CY - R * Math.sin(ang)
              const rr = 6 + 10 * Math.sqrt(p.dia / maxDia)
              const on = p.ko === picked
              return (
                <g key={p.ko}>
                  <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke={on ? 'var(--moon)' : 'var(--line)'} strokeOpacity={on ? 0.75 : 1} strokeWidth="1.2" />
                  <g onClick={() => setPicked(p.ko)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={rr + 10} fill="transparent" />
                    {on && <circle cx={x} cy={y} r={rr + 7} fill="none" stroke="var(--moon)" strokeWidth="2" />}
                    <circle cx={x} cy={y} r={rr} fill={p.color} />
                    <text x={x} y={y - rr - 11} textAnchor="middle"
                      fill={on ? 'var(--moon)' : 'var(--text-2)'} fontSize="23" fontWeight={on ? 700 : 500}>
                      {p.ko}
                    </text>
                  </g>
                </g>
              )
            })}
            <text x={W - 16} y={H - 16} textAnchor="end" fill="var(--muted)" fontSize="19">
              {fmtDateKST(at)} · {mode === 'real' ? '거리 실제 비율' : '거리를 고르게 벌린 그림'}
            </text>
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="toolrow">
              <div className="seg">
                <button aria-pressed={mode === 'even'} onClick={() => setMode('even')}>고르게</button>
                <button aria-pressed={mode === 'real'} onClick={() => setMode('real')}>실제 비율</button>
              </div>
              <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
                {playing ? '멈춤' : '돌려보기'}
              </button>
              <button className="btn" onClick={() => { setPlaying(false); setOffset(0) }}>오늘로</button>
            </div>
            <p className="hint">
              실제 비율로 보면 안쪽 네 행성이 태양 가까이 몰려 있습니다. 태양계는 거의 텅 빈 공간입니다.
            </p>
          </div>

          <div className="card">
            <h3>{sel.ko}</h3>
            <div className="rows">
              <div className="r"><span>지름</span><b>{sel.dia.toLocaleString()} km</b></div>
              <div className="r"><span>지구의 몇 배</span><b>{(sel.dia / 12756).toFixed(2)}배</b></div>
              <div className="r"><span>태양까지 거리</span><b>{sel.au.toFixed(3)} AU</b></div>
              <div className="r"><span>공전 주기</span><b>{FACTS[sel.ko].period < 1 ? (FACTS[sel.ko].period * 365.25).toFixed(0) + '일' : FACTS[sel.ko].period + '년'}</b></div>
              <div className="r"><span>자전 주기</span><b>{FACTS[sel.ko].day}</b></div>
            </div>
            <p className="hint">{FACTS[sel.ko].note}</p>
          </div>

          <div className="card">
            <h3>크기 비교 (실제 비율)</h3>
            <svg viewBox="0 0 440 100" style={{ width: '100%', height: 'auto' }} role="img" aria-label="행성 크기 비교">
              {(() => {
                let x = 6
                return PLANETS.map((p, i) => {
                  const r = 3 + 40 * (p.dia / maxDia)
                  const cx = x + r
                  x += r * 2 + 9
                  const small = r < 12
                  const ly = small ? (i % 2 ? 92 : 80) : 92
                  return (
                    <g key={p.ko} onClick={() => setPicked(p.ko)} style={{ cursor: 'pointer' }}>
                      <circle cx={cx} cy={52} r={r} fill={p.color}
                        stroke={p.ko === picked ? 'var(--moon)' : 'none'} strokeWidth="2" />
                      {small && <line x1={cx} y1={52 + r + 2} x2={cx} y2={ly - 9}
                        stroke="var(--line)" strokeWidth="1" />}
                      <text x={cx} y={ly} textAnchor="middle"
                        fill={p.ko === picked ? 'var(--moon)' : 'var(--muted)'} fontSize="11">{p.ko}</text>
                    </g>
                  )
                })
              })()}
            </svg>
            <p className="hint">1 AU = 태양과 지구 사이 거리 약 1억 5천만 km</p>
          </div>
        </div>
      </div>
    </>
  )
}
