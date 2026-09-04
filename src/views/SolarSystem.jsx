import React, { useEffect, useRef, useState } from 'react'
import { PLANETS, planetXY, addDays, fmtDateKST } from '../lib/astro.js'
import PlanetGlobe from '../lib/PlanetGlobe.jsx'
import More from '../lib/More.jsx'

const FACTS = {
  태양: { tex: 'sun.jpg', tilt: 7.2, day: '25일 (적도)', period: null,
    note: '태양계에서 유일하게 스스로 빛을 내는 별입니다. 지구 130만 개가 들어갈 만큼 크고, 표면은 약 5,500도입니다. 우리가 받는 빛과 열이 모두 여기서 옵니다.' },
  수성: { tex: 'mercury.jpg', tilt: 0.03, day: '58.6일', period: 0.241,
    note: '태양에 가장 가깝고 가장 작습니다. 공기가 없어 낮에는 430도, 밤에는 영하 180도까지 떨어집니다. 달처럼 크레이터가 가득합니다.' },
  금성: { tex: 'venus.jpg', tilt: 177.4, day: '243일', period: 0.615,
    note: '두꺼운 이산화탄소 구름에 덮여 온실효과로 표면이 460도나 됩니다. 새벽이나 초저녁에 아주 밝게 보여 샛별이라고 부릅니다. 혼자 거꾸로 돕니다.' },
  지구: { tex: 'earth.jpg', tilt: 23.4, day: '24시간', period: 1.0,
    note: '물과 공기가 있어 생물이 사는, 지금까지 알려진 유일한 행성입니다. 표면의 70%가 바다입니다.' },
  화성: { tex: 'mars.jpg', tilt: 25.2, day: '24.6시간', period: 1.881,
    note: '흙에 든 산화철 때문에 붉게 보입니다. 태양계에서 가장 높은 화산 올림푸스산(높이 22km)이 있습니다. 얼음으로 된 극관도 보입니다.' },
  목성: { tex: 'jupiter.jpg', tilt: 3.1, day: '9.9시간', period: 11.86,
    note: '가장 큰 행성으로 지구 1,300개가 들어갑니다. 단단한 땅이 없는 가스 행성입니다. 줄무늬는 빠른 자전이 만든 구름 띠이고, 붉은 점은 지구보다 큰 소용돌이입니다.' },
  토성: { tex: 'saturn.jpg', tilt: 26.7, day: '10.7시간', period: 29.46, ring: true,
    note: '얼음과 돌 부스러기로 된 뚜렷한 고리가 있습니다. 고리의 두께는 수십 미터밖에 안 됩니다. 밀도가 물보다 작아서, 물에 넣으면 뜹니다.' },
  천왕성: { tex: 'uranus.jpg', tilt: 97.8, day: '17.2시간', period: 84.01,
    note: '자전축이 98도나 기울어 거의 누운 채로 돕니다. 대기 속 메탄이 붉은빛을 흡수해 청록색으로 보입니다.' },
  해왕성: { tex: 'neptune.jpg', tilt: 28.3, day: '16.1시간', period: 164.8,
    note: '가장 바깥 행성입니다. 시속 2,000km가 넘는, 태양계에서 가장 빠른 바람이 붑니다. 햇빛이 지구의 900분의 1밖에 닿지 않습니다.' }
}

const W = 900, H = 720, CX = W / 2, CY = H / 2, RMAX = 330
const maxDia = 142984

function Fact({ k, v }) {
  return (
    <div style={{ background: 'var(--panel-2)', borderRadius: 9, padding: '7px 11px', minWidth: 0 }}>
      <div style={{ color: 'var(--muted)', fontSize: '.78em' }}>{k}</div>
      <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontSize: '.95em' }}>{v}</div>
    </div>
  )
}

export default function SolarSystem({ date }) {
  const [mode, setMode] = useState('even')      // even | real
  const [offset, setOffset] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [picked, setPicked] = useState('지구')
  const [fs, setFs] = useState(false)
  const raf = useRef(0)
  const globeRef = useRef(null)

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

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else globeRef.current?.requestFullscreen?.()
  }

  const at = addDays(date, offset)
  const radiusOf = (p, i) => mode === 'real'
    ? 34 + (p.au / 30.07) * (RMAX - 34)
    : 52 + (i / (PLANETS.length - 1)) * (RMAX - 52)

  const sel = PLANETS.find(p => p.ko === picked)
  const f = FACTS[picked]
  const isSun = picked === '태양'

  return (
    <>
      {/* 윗줄: 궤도 그림 | 고른 천체 (정사각 사진 + 설명 + 숫자) */}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(320px,1fr)', alignItems: 'stretch' }}>
        <div className="stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, maxHeight: '70vh' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', maxHeight: 'none' }} role="img" aria-label="태양계">
            <defs>
              <radialGradient id="sun2">
                <stop offset="0%" stopColor="#FFF3C4" />
                <stop offset="55%" stopColor="#FFAE33" />
                <stop offset="100%" stopColor="#C25A00" />
              </radialGradient>
            </defs>

            <text x="16" y="28" fill="var(--muted)" fontSize="15">북쪽 위에서 내려다본 태양계 · 행성을 누르면 오른쪽에 실제 모습</text>

            <g onClick={() => setPicked('태양')} style={{ cursor: 'pointer' }}>
              {isSun && <circle cx={CX} cy={CY} r="40" fill="none" stroke="var(--moon)" strokeWidth="2" />}
              <circle cx={CX} cy={CY} r="30" fill="url(#sun2)" />
              <text x={CX} y={CY + 52} textAnchor="middle" fill="var(--sun)" fontSize="20" fontWeight="700">태양</text>
            </g>

            {(() => {
              /* 이름표가 겹치면 아래로, 그래도 겹치면 옆으로 옮긴다 */
              const items = PLANETS.map((p, i) => {
                const R = radiusOf(p, i)
                const v = planetXY(p, at)
                const ang = Math.atan2(v.y, v.x)
                const rr = 6 + 10 * Math.sqrt(p.dia / maxDia)
                return { p, R, x: CX + R * Math.cos(ang), y: CY - R * Math.sin(ang), rr }
              })
              const taken = [{ x: CX, y: CY + 52 }]
              const clash = (x, y) => taken.some(t => Math.abs(t.x - x) < 64 && Math.abs(t.y - y) < 22)
              items.forEach(q => {
                let lx = q.x, ly = q.y - q.rr - 10
                if (clash(lx, ly)) ly = q.y + q.rr + 22
                if (clash(lx, ly)) { lx = q.x + q.rr + 34; ly = q.y + 6 }
                q.lx = lx; q.ly = ly; taken.push({ x: lx, y: ly })
              })
              return items
            })().map(({ p, R, x, y, rr, lx, ly }) => {
              const on = p.ko === picked
              return (
                <g key={p.ko}>
                  <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke={on ? 'var(--moon)' : 'var(--line)'} strokeOpacity={on ? 0.75 : 1} strokeWidth="1.2" />
                  <g onClick={() => setPicked(p.ko)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={rr + 12} fill="transparent" />
                    {on && <circle cx={x} cy={y} r={rr + 8} fill="none" stroke="var(--moon)" strokeWidth="2" />}
                    <circle cx={x} cy={y} r={rr} fill={p.color} />
                    <text x={lx} y={ly} textAnchor="middle"
                      fill={on ? 'var(--moon)' : 'var(--text-2)'} fontSize="19" fontWeight={on ? 700 : 500}>
                      {p.ko}
                    </text>
                  </g>
                </g>
              )
            })}
            <text x={W - 16} y={H - 16} textAnchor="end" fill="var(--muted)" fontSize="15">
              {fmtDateKST(at)} · {mode === 'real' ? '거리 실제 비율' : '거리를 고르게 벌린 그림'}
            </text>
          </svg>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', minHeight: 0, flexWrap: 'wrap' }}>
            {/* 행성은 둥글다 — 보기 칸도 정사각형으로 */}
            <div ref={globeRef} className="globe-sq"
              style={{ flex: '1 1 300px', maxWidth: 'min(62%, 56vh)', aspectRatio: '1 / 1', position: 'relative', background: '#05070E' }}>
              <PlanetGlobe texture={f.tex} ring={!!f.ring} tilt={f.tilt} sun={isSun} fill />
              <button className="fsbtn" onClick={toggleFs} aria-label={fs ? '전체 화면 닫기' : '전체 화면으로 보기'}>
                {fs ? '✕ 닫기' : '⛶ 전체 화면'}
              </button>
            </div>
            <div style={{ flex: '1 1 180px', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <h3 style={{ marginBottom: 0 }}>{picked}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '.92em', margin: 0 }}>{f.note}</p>
              <p className="hint" style={{ marginTop: 'auto' }}>끌어서 돌리고, 휠로 확대합니다. 전체 화면으로 크게 볼 수도 있습니다.</p>
            </div>
          </div>
          <div style={{ padding: '10px 16px 16px', marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {sel && <>
              <Fact k="지름" v={sel.dia.toLocaleString() + ' km'} />
              <Fact k="지구의 몇 배" v={(sel.dia / 12756).toFixed(2) + '배'} />
              <Fact k="태양까지 거리" v={sel.au.toFixed(2) + ' AU'} />
            </>}
            {isSun && <>
              <Fact k="지름" v="1,392,700 km" />
              <Fact k="지구의 몇 배" v="109배" />
              <Fact k="표면 온도" v="약 5,500 ℃" />
            </>}
            {f.period && <Fact k="공전 주기" v={f.period < 1 ? (f.period * 365.25).toFixed(0) + '일' : f.period + '년'} />}
            <Fact k="자전 주기" v={f.day} />
            <Fact k="자전축 기울기" v={f.tilt + '°'} />
          </div>
        </div>
      </div>

      {/* 아랫줄: 궤도 그림 도구 | 크기 비교 | 태양계의 다른 식구들 */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', alignItems: 'stretch' }}>
        <div className="card">
          <h3>궤도 그림 움직이기</h3>
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
          <p className="hint">행성 위치는 오늘의 실제 위치입니다.</p>
        </div>

        <div className="card">
          <h3>크기 비교 (실제 비율)</h3>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox="0 0 440 100" style={{ width: '100%', minWidth: 300, height: 'auto', maxHeight: 150 }}
              role="img" aria-label="행성 크기 비교">
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
                      {small && <line x1={cx} y1={52 + r + 2} x2={cx} y2={ly - 9} stroke="var(--line)" strokeWidth="1" />}
                      <text x={cx} y={ly} textAnchor="middle"
                        fill={p.ko === picked ? 'var(--moon)' : 'var(--muted)'} fontSize="11">{p.ko}</text>
                    </g>
                  )
                })
              })()}
            </svg>
          </div>
          <p className="hint">행성 사진은 실제 탐사선이 찍은 자료로 만든 지도입니다. 여기서 눌러도 골라집니다.</p>
        </div>
      </div>

      <More title="더 알아보기 — 태양계의 다른 식구들 · 거리와 빠르기" count="2">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
          <div className="card">
            <h3>태양계의 다른 식구들</h3>
            <div className="rows">
              <div className="r"><span>위성</span><b>행성 둘레를 도는 천체 · 달</b></div>
              <div className="r"><span>왜소행성</span><b>명왕성 · 세레스</b></div>
              <div className="r"><span>소행성</span><b>화성과 목성 사이에 많음</b></div>
              <div className="r"><span>혜성</span><b>얼음과 먼지 · 긴 꼬리</b></div>
            </div>
            <p className="hint">
              태양계는 태양과 8개 행성만이 아닙니다. 행성 둘레를 도는 위성, 명왕성 같은 왜소행성,
              수많은 소행성과 혜성이 모두 태양의 힘에 붙들려 함께 돕니다.
            </p>
          </div>
          <div className="card">
            <h3>거리와 빠르기</h3>
            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
              '실제 비율'로 보면 안쪽 네 행성이 태양 가까이 몰려 있습니다 — 태양계는 거의 텅 빈 공간입니다.
              1 AU는 태양과 지구 사이 거리로 약 1억 5천만 km입니다.
            </p>
            <p className="hint">
              돌려보기에서 <b>수성이 어떤 곳에서는 빨리, 어떤 곳에서는 천천히</b> 가는 것은 실제 위치를 그대로 그렸기 때문입니다.
              수성 궤도는 찌그러진 타원이라 태양에 가까운 쪽에서 더 빨리 돕니다(케플러의 법칙).
            </p>
          </div>
        </div>
      </More>
    </>
  )
}
