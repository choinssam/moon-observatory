import React, { useEffect, useRef, useState } from 'react'
import { Extra } from '../lib/More.jsx'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useFit, twoSquares } from '../lib/useFit.js'
import { SYNODIC, moonPhase01, phaseName, phaseTerm, phaseTip, TERM_TABLE, fmtDateKST, Astronomy } from '../lib/astro.js'

/* 교과서에 나오는 다섯 이름 + 달이 보이지 않는 때. '삭·망·볼록달'은 초등 용어가 아니다. */
const SNAPS = [
  { p: 0,     ko: '안 보임', term: '삭', day: '음력 1일쯤' },
  { p: 0.125, ko: '초승달',  term: '신월', day: '음력 3~4일' },
  { p: 0.25,  ko: '상현달',  term: '상현', day: '음력 7~8일' },
  { p: 0.5,   ko: '보름달',  term: '망', day: '음력 15일' },
  { p: 0.75,  ko: '하현달',  term: '하현', day: '음력 22~23일' },
  { p: 0.875, ko: '그믐달',  term: '', day: '음력 27~28일' }
]

/* 궤도 그림은 정사각형. 태양은 왼쪽 가장자리, 지구는 가운데보다 조금 오른쪽 */
const W = 600, cx = 350, cy = 292, R = 214

export default function PhaseLab({ date }) {
  const [p, setP] = useState(() => moonPhase01(date))
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const svgRef = useRef(null)
  const rootRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const box = useFit(rootRef)
  const L = twoSquares(box, { strip: 124, stripCompact: 96 })
  const { sq, gap, strip } = L
  const wide = L.mode === 'wide'

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const step = now => {
      const dt = (now - last) / 1000
      last = now
      setP(v => (v + dt / 12) % 1)   // 12초에 한 달
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  const lib = Astronomy.Libration(date)
  const age = p * SYNODIC
  const illum = (1 - Math.cos(2 * Math.PI * p)) / 2
  const discR = Math.max(96, Math.round(sq * 0.82))

  const a = (180 + 360 * p) * Math.PI / 180
  const mx = cx + R * Math.cos(a)
  const my = cy - R * Math.sin(a)

  /* 달을 끌어서 궤도를 돌린다 */
  function phaseFromEvent(e) {
    const svg = svgRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const y = ((e.clientY - r.top) / r.height) * W
    const ang = Math.atan2(cy - y, x - cx) * 180 / Math.PI      // 화면 위쪽이 +
    return (((ang - 180) / 360) % 1 + 1) % 1
  }
  function onDragStart(e) {
    setPlaying(false)
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const v = phaseFromEvent(e); if (v != null) setP(v)
  }
  function onDragMove(e) {
    if (!dragging) return
    const v = phaseFromEvent(e); if (v != null) setP(v)
  }
  function onDragEnd(e) {
    setDragging(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const sqStyle = sq ? { width: sq, height: sq } : undefined
  const gridStyle = wide
    ? { gridTemplateColumns: `${sq}px ${sq}px minmax(0,1fr)`, gridTemplateRows: `${sq}px minmax(0,1fr)`, height: sq + gap + strip }
    : undefined

  return (
    <div ref={rootRef} className={'solar phase ' + L.mode} style={gridStyle}>
      {/* 1. 우주에서 내려다본 배치 — 달을 끌어 돌린다 */}
      <div className="stage solar-orbit" style={sqStyle}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${W}`}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
          role="img" aria-label="태양 지구 달 배치도">
          <defs>
            <radialGradient id="sunG">
              <stop offset="0%" stopColor="#FFE9A8" />
              <stop offset="60%" stopColor="var(--sun)" />
              <stop offset="100%" stopColor="#B25E00" />
            </radialGradient>
            <clipPath id="leftHalf"><rect x="-40" y="-40" width="40" height="80" /></clipPath>
          </defs>

          {Array.from({ length: 9 }, (_, i) => {
            const y = cy - 168 + i * 42
            return <line key={i} x1="104" y1={y} x2="240" y2={y}
              stroke="var(--sun)" strokeOpacity=".22" strokeWidth="2" strokeDasharray="7 9" />
          })}
          <circle cx="40" cy={cy} r="56" fill="url(#sunG)" />
          <text x="40" y={cy + 6} textAnchor="middle" fill="#5A3200" fontSize="18" fontWeight="700">태양</text>

          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 6" />

          {SNAPS.map(s => {
            const sa = (180 + 360 * s.p) * Math.PI / 180
            return <circle key={s.p} cx={cx + R * Math.cos(sa)} cy={cy - R * Math.sin(sa)}
              r="2.5" fill="var(--muted)" opacity=".55" />
          })}

          <g transform={`translate(${cx},${cy})`}>
            <circle r="32" fill="#101828" />
            <circle r="32" fill="var(--earth)" clipPath="url(#leftHalf)" />
            <circle r="32" fill="none" stroke="rgba(255,255,255,.25)" />
            <text y="54" textAnchor="middle" fill="var(--text-2)" fontSize="15" fontWeight="600">지구</text>
          </g>

          <line x1={cx} y1={cy} x2={mx} y2={my} stroke="var(--sky)" strokeOpacity=".45"
            strokeWidth="1.5" strokeDasharray="3 5" />

          <g transform={`translate(${mx},${my})`} onPointerDown={onDragStart}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
            <circle r="34" fill="transparent" />
            <circle r="26" fill="none" stroke="var(--moon)" strokeOpacity={dragging ? '.9' : '.35'}
              strokeWidth="1.5" strokeDasharray="3 4" />
            <circle r="18" fill="var(--shadow-side)" />
            <path d="M0,-18 A18,18 0 0 0 0,18 Z" fill="var(--moon)" />
            <circle r="18" fill="none" stroke="rgba(255,255,255,.3)" />
          </g>
          <text x={mx} y={my - 36} textAnchor="middle" fill="var(--moon)" fontSize="15" fontWeight="700">달</text>
        </svg>

        <div className="cap">우주에서 내려다본 모습 · <b>달을 끌어서 궤도를 돌려 보세요</b></div>

        <div className="stage-tools">
          <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
            {playing ? '■ 멈춤' : '▶ 한 달 재생'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setP(moonPhase01(date)) }}>오늘의 달로</button>
          <input className="slider" type="range" min="0" max="0.999" step="0.001"
            value={p} onChange={e => { setPlaying(false); setP(Number(e.target.value)) }}
            aria-label="달의 위상" />
          <span className="mono strong">{age.toFixed(1)}일째</span>
        </div>
      </div>

      {/* 2. 그때 지구에서 올려다본 달 — 정사각형 */}
      <div className="stage solar-globe center" style={{ ...sqStyle, background: '#05070E' }}>
        <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
        <div className="cap">지구에서 올려다본 달</div>
        <div className="cap name" style={{ top: 'auto', bottom: 12, fontSize: '1.15em', color: 'var(--moon)' }}>
          {phaseName(p)}{phaseTerm(p) && <small style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.7em' }}>{phaseTerm(p)}</small>}
        </div>
        <div className="cap bottom right">밝은 부분 {(illum * 100).toFixed(0)}%</div>
      </div>

      {/* 3. 설명 */}
      <aside className="card side solar-info">
        <h3 className="solar-name" style={{ color: 'var(--moon)' }}>{phaseName(p)}
          {phaseTerm(p) && <span className="solar-sub">정식 용어 {phaseTerm(p)}</span>}
        </h3>
        <div className="mono" style={{ color: 'var(--muted)', fontSize: '.92em' }}>
          달이 보이지 않는 때부터 {age.toFixed(1)}일째 · 밝은 부분 {(illum * 100).toFixed(0)}%
        </div>
        <p className="hint" style={{ margin: 0 }}>왼쪽은 북극 위에서 내려다본 그림입니다. 크기와 거리는 실제 비율이 아닙니다.</p>
        <div className="note">{phaseTip(p)}</div>

        <Extra fold={L.mode === 'narrow'} count="2">
          <div className="extra-list">
            <div>
              <h4>왜 모양이 달라 보일까 <span className="std extra">교육과정 밖</span></h4>
              <p className="hint" style={{ margin: '0 0 6px' }}>
                2022 개정 교육과정 [4과13-01]은 <b>위상 변화의 원인을 다루지 않고</b>, 모양이 주기적으로 바뀌는 현상을 관찰하는 데 초점을 둡니다.
                아래는 더 알고 싶어 하는 학생과 선생님을 위한 설명입니다.
              </p>
              <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.93em' }}>
                달은 스스로 빛나지 않고 태양 빛을 반사합니다. 그래서 <b>언제나 절반은 밝고 절반은 어둡습니다</b>.
                달이 지구를 돌면서 지구에서 보는 각도가 달라지기 때문에 모양이 달라 보입니다.
                이 되풀이가 <b>약 30일</b>마다 한 바퀴입니다. 정확히는 {SYNODIC.toFixed(1)}일이어서 음력 한 달은 29일 또는 30일이 됩니다.
                오른쪽 달은 오늘({fmtDateKST(date)})의 실제 기울기로 그린 것입니다.
              </p>
            </div>
            <div>
              <h4>달 모양의 이름 <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>교과서 이름과 정식 용어</span></h4>
              <p className="hint" style={{ margin: '0 0 8px' }}>
                초등 교과서는 <b>초승달·상현달·보름달·하현달·그믐달</b> 다섯 이름만 씁니다. 중등 이상에서 쓰는 정식 용어를 함께 적었습니다.
                <b> 수업에서 가르쳐야 하는 것은 왼쪽 다섯 이름</b>입니다.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="termtable tight">
                  <thead>
                    <tr><th>초등 교과서</th><th>정식 용어</th><th>음력</th><th>어떻게 보이나</th></tr>
                  </thead>
                  <tbody>
                    {TERM_TABLE.map((t, i) => (
                      <tr key={i}>
                        <td style={{ color: t.ko.startsWith('(') ? 'var(--muted)' : 'var(--moon)', fontWeight: 600 }}>{t.ko}</td>
                        <td className="mono">{t.term || '—'}</td>
                        <td className="mono" style={{ color: 'var(--text-2)' }}>{t.lunar}</td>
                        <td style={{ color: 'var(--text-2)' }}>{t.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint">
                <b style={{ color: 'var(--warn)' }}>주의</b> 삭과 그믐달은 다릅니다.
                삭은 달이 아예 보이지 않는 때(음력 1일쯤)이고, 그믐달은 그보다 며칠 앞서 새벽 동쪽 하늘에 가늘게 보이는 달입니다.
              </p>
            </div>
          </div>
        </Extra>
      </aside>

      {/* 4. 여섯 가지 모양 — 눌러서 바로 그 모양으로 */}
      <div className="card solar-sizes">
        <div className="solar-sizes-head">
          <h3>달의 모양 <small>눌러서 고르기</small></h3>
          <p className="hint">교과서에 나오는 다섯 이름과 안 보이는 때</p>
        </div>
        <div className="picks snaps">
          {SNAPS.map(s => {
            const on = Math.abs(p - s.p) < 0.02
            const r = L.compact ? 20 : 27
            return (
              <button key={s.p} className={'pick' + (on ? ' on' : '')} aria-pressed={on}
                title={s.term ? `${s.ko} · 정식 용어 ${s.term}` : s.ko}
                onClick={() => { setPlaying(false); setP(s.p) }}>
                <svg width={r * 2 + 6} height={r * 2 + 6} viewBox={`${-r - 3} ${-r - 3} ${r * 2 + 6} ${r * 2 + 6}`} aria-hidden="true">
                  <circle r={r} fill="var(--shadow-side)" />
                  <path d={moonPathD(r, s.p)} fill="var(--moon)" />
                  {on && <circle r={r + 2} fill="none" stroke="var(--moon)" strokeWidth="1.5" />}
                </svg>
                <span className="pick-name">{s.ko}<small>{s.day}</small></span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
