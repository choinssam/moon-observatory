import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

/* 궤도 그림은 정사각형. 아래쪽 도구 줄 자리를 남기려고 중심을 조금 위로 둔다 */
const W = 720, CX = W / 2, CY = 348, RMAX = 296
const maxDia = 142984
const EARTH = 12756
const GAP = 14, STRIP = 138, STRIP_COMPACT = 106   /* 칸 사이 간격 · 크기 비교 띠 높이 */

function MaybeMore({ fold, children }) {
  return fold ? <More title="더 알아보기" count="2">{children}</More> : <div className="solar-extra">{children}</div>
}

function Fact({ k, v }) {
  return (
    <div className="fact">
      <div className="fact-k">{k}</div>
      <div className="fact-v">{v}</div>
    </div>
  )
}

/*
 * 세 칸 배치: [궤도 정사각형] [행성 정사각형] [설명]  +  아래에 크기 비교 띠.
 * 정사각형 한 변은 남은 높이와 폭 중 작은 쪽으로 JS 에서 잰다.
 * 폭이 모자라면(태블릿·폰) 한 줄로 쌓는다.
 */
function useSquare(rootRef) {
  const [sq, setSq] = useState(0)
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      const gap = GAP
      const availW = root.clientWidth
      const availH = window.innerHeight - r.top - 18
      const sideW = Math.max(300, Math.min(400, availW * 0.23))
      const compact = availH < 640
      const stripH = compact ? STRIP_COMPACT : STRIP
      const byW = (availW - sideW - gap * 2) / 2
      const byH = availH - stripH - gap
      setSq(Math.floor(Math.min(byW, byH)))
      setCompact(compact)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    /* 큰 글씨 모드·제목 줄 높이가 바뀌면 위쪽 여백이 달라진다. 부모 높이 변화로 알아챈다 */
    if (root.parentElement) ro.observe(root.parentElement)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [rootRef])
  return { sq, compact }
}

export default function SolarSystem({ date }) {
  const [mode, setMode] = useState('even')      // even | real
  const [offset, setOffset] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [picked, setPicked] = useState('지구')
  const [fs, setFs] = useState(false)
  const raf = useRef(0)
  const globeRef = useRef(null)
  const rootRef = useRef(null)
  const { sq, compact } = useSquare(rootRef)
  const narrow = sq < 380

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
  const sqStyle = narrow ? undefined : { width: sq, height: sq }

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

  return (
    <div ref={rootRef} className={'solar' + (narrow ? ' narrow' : '') + (compact ? ' compact' : '')}
      style={narrow ? undefined : {
        gridTemplateColumns: `${sq}px ${sq}px minmax(0,1fr)`,
        gridTemplateRows: `${sq}px minmax(0,1fr)`,
        height: sq + GAP + (compact ? STRIP_COMPACT : STRIP)
      }}>

      {/* 1. 궤도 그림 — 정사각형, 도구는 그림 안 아래쪽 */}
      <div className="stage solar-orbit" style={sqStyle}>
        <svg viewBox={`0 0 ${W} ${W}`} role="img" aria-label="태양계">
          <defs>
            <radialGradient id="sun2">
              <stop offset="0%" stopColor="#FFF3C4" />
              <stop offset="55%" stopColor="#FFAE33" />
              <stop offset="100%" stopColor="#C25A00" />
            </radialGradient>
          </defs>

          <g onClick={() => setPicked('태양')} style={{ cursor: 'pointer' }}>
            {isSun && <circle cx={CX} cy={CY} r="40" fill="none" stroke="var(--moon)" strokeWidth="2" />}
            <circle cx={CX} cy={CY} r="30" fill="url(#sun2)" />
            <text x={CX} y={CY + 52} textAnchor="middle" fill="var(--sun)" fontSize="20" fontWeight="700">태양</text>
          </g>

          {items.map(({ p, R, x, y, rr, lx, ly }) => {
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
        </svg>

        <div className="solar-cap">북쪽 위에서 내려다본 태양계 · 행성을 누르면 옆에 실제 모습</div>

        <div className="solar-tools">
          <div className="seg">
            <button aria-pressed={mode === 'even'} onClick={() => setMode('even')}>고르게</button>
            <button aria-pressed={mode === 'real'} onClick={() => setMode('real')}>실제 비율</button>
          </div>
          <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
            {playing ? '■ 멈춤' : '▶ 돌려보기'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setOffset(0) }} disabled={offset === 0 && !playing}>오늘로</button>
          <span className="solar-date mono">{fmtDateKST(at)}</span>
        </div>
      </div>

      {/* 2. 고른 천체 — 행성은 둥그니 칸도 정사각형 */}
      <div ref={globeRef} className="stage solar-globe globe-sq" style={sqStyle}>
        <PlanetGlobe texture={f.tex} ring={!!f.ring} tilt={f.tilt} sun={isSun} fill />
        <button className="fsbtn" onClick={toggleFs} aria-label={fs ? '전체 화면 닫기' : '전체 화면으로 보기'}>
          {fs ? '✕ 닫기' : '⛶ 전체 화면'}
        </button>
        <div className="solar-cap solar-cap-name">
          <i style={{ background: isSun ? 'var(--sun)' : sel.color }} />{picked}
        </div>
        <div className="solar-cap solar-cap-hint">끌어서 돌리기 · 휠로 확대</div>
      </div>

      {/* 3. 설명과 숫자 */}
      <aside className="card solar-info">
        <h3 className="solar-name">{picked}
          <span className="solar-sub">{isSun ? '태양계의 중심 별' : `태양에서 ${PLANETS.indexOf(sel) + 1}번째 행성`}</span>
        </h3>
        <p className="solar-note">{f.note}</p>
        <div className="facts">
          {sel && <>
            <Fact k="지름" v={sel.dia.toLocaleString() + ' km'} />
            <Fact k="지구의 몇 배" v={(sel.dia / EARTH).toFixed(2) + '배'} />
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

        {/* 넓은 화면에서는 설명 칸에 자리가 남으니 바로 보여 준다. 좁은 화면에서만 접는다 */}
        <MaybeMore fold={narrow}>
          <div className="solar-more">
            <div>
              <h4>태양계의 다른 식구들</h4>
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
            <div>
              <h4>거리와 빠르기</h4>
              <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                '실제 비율'로 보면 안쪽 네 행성이 태양 가까이 몰려 있습니다. 태양계는 거의 텅 빈 공간입니다.
                1 AU는 태양과 지구 사이 거리로 약 1억 5천만 km입니다.
              </p>
              <p className="hint">
                돌려보기에서 <b>수성이 어떤 곳에서는 빨리, 어떤 곳에서는 천천히</b> 가는 것은 실제 위치를 그대로 그렸기 때문입니다.
                수성 궤도는 찌그러진 타원이라 태양에 가까운 쪽에서 더 빨리 돕니다(케플러의 법칙).
              </p>
            </div>
          </div>
        </MaybeMore>
      </aside>

      {/* 4. 크기 비교 띠 — 두 정사각형 아래 폭을 그대로 쓴다. 눌러서 고를 수 있다 */}
      <div className="card solar-sizes">
        <div className="solar-sizes-head">
          <h3>크기 비교 <small>실제 비율</small></h3>
          <p className="hint">눌러서 고르기 · 사진은 탐사선 자료로 만든 지도</p>
        </div>
        <div className="sizes">
          <button className={'size-cell sun' + (isSun ? ' on' : '')} onClick={() => setPicked('태양')} aria-pressed={isSun}>
            <span className="size-sun" aria-hidden="true" />
            <span className="size-name">태양<small>109배</small></span>
          </button>
          {PLANETS.map(p => {
            const d = Math.max(7, Math.round((compact ? 52 : 72) * p.dia / maxDia))
            const on = p.ko === picked
            const ratio = p.dia / EARTH
            return (
              <button key={p.ko} className={'size-cell' + (on ? ' on' : '')} onClick={() => setPicked(p.ko)} aria-pressed={on}>
                <span className="size-disc" aria-hidden="true">
                  <i style={{ width: d, height: d, background: p.color }} />
                </span>
                <span className="size-name">{p.ko}<small>{ratio.toFixed(ratio < 1 ? 2 : 1)}배</small></span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
