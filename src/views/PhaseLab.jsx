import React, { useEffect, useRef, useState } from 'react'
import More from '../lib/More.jsx'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import { SYNODIC, moonPhase01, phaseName, phaseTerm, phaseTip, TERM_TABLE, fmtDateKST, Astronomy } from '../lib/astro.js'

/* 교과서에 나오는 다섯 이름 + 달이 보이지 않는 때. '삭·망·볼록달'은 초등 용어가 아니다. */
const SNAPS = [
  { p: 0,     ko: '안 보임', term: '삭' },
  { p: 0.125, ko: '초승달',  term: '신월' },
  { p: 0.25,  ko: '상현달',  term: '상현' },
  { p: 0.5,   ko: '보름달',  term: '망' },
  { p: 0.75,  ko: '하현달',  term: '하현' },
  { p: 0.875, ko: '그믐달',  term: '' }
]

const W = 620, H = 430, cx = 330, cy = 215, R = 150

export default function PhaseLab({ date, big }) {
  const [p, setP] = useState(() => moonPhase01(date))
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
  const svgRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const vp = useViewport()

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
  const discR = moonSize(vp, big, { min: 110, max: 260 })

  const a = (180 + 360 * p) * Math.PI / 180
  const mx = cx + R * Math.cos(a)
  const my = cy - R * Math.sin(a)

  /* 달을 끌어서 궤도를 돌린다 */
  function phaseFromEvent(e) {
    const svg = svgRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const y = ((e.clientY - r.top) / r.height) * H
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

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '78ch' }}>
        왼쪽은 우주에서 내려다본 모습, 오른쪽은 그때 지구에서 올려다본 달입니다.
        <b style={{ color: 'var(--moon)' }}> 왼쪽 그림의 달을 직접 끌어서 궤도를 돌려 보세요.</b> 슬라이더로도 됩니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,0.95fr)', alignItems: 'start' }}>
        <div className="stage">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', touchAction: 'none' }}
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
              const y = 46 + i * 42
              return <line key={i} x1="70" y1={y} x2="240" y2={y}
                stroke="var(--sun)" strokeOpacity=".22" strokeWidth="2" strokeDasharray="7 9" />
            })}
            <circle cx="30" cy={cy} r="52" fill="url(#sunG)" />
            <text x="30" y={cy + 5} textAnchor="middle" fill="#5A3200" fontSize="17" fontWeight="700">태양</text>

            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 6" />

            {SNAPS.map(s => {
              const sa = (180 + 360 * s.p) * Math.PI / 180
              return <circle key={s.p} cx={cx + R * Math.cos(sa)} cy={cy - R * Math.sin(sa)}
                r="2.5" fill="var(--muted)" opacity=".55" />
            })}

            <g transform={`translate(${cx},${cy})`}>
              <circle r="30" fill="#101828" />
              <circle r="30" fill="var(--earth)" clipPath="url(#leftHalf)" />
              <circle r="30" fill="none" stroke="rgba(255,255,255,.25)" />
              <text y="52" textAnchor="middle" fill="var(--text-2)" fontSize="15" fontWeight="600">지구</text>
            </g>

            <line x1={cx} y1={cy} x2={mx} y2={my} stroke="var(--sky)" strokeOpacity=".45"
              strokeWidth="1.5" strokeDasharray="3 5" />

            <g transform={`translate(${mx},${my})`} onPointerDown={onDragStart}
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
              <circle r="30" fill="transparent" />
              <circle r="24" fill="none" stroke="var(--moon)" strokeOpacity={dragging ? '.9' : '.35'}
                strokeWidth="1.5" strokeDasharray="3 4" />
              <circle r="17" fill="var(--shadow-side)" />
              <path d="M0,-17 A17,17 0 0 0 0,17 Z" fill="var(--moon)" />
              <circle r="17" fill="none" stroke="rgba(255,255,255,.3)" />
            </g>
            <text x={mx} y={my - 33} textAnchor="middle" fill="var(--moon)" fontSize="14" fontWeight="700">달</text>

            <text x={W - 12} y={H - 10} textAnchor="end" fill="var(--muted)" fontSize="12">
              북극 위에서 내려다본 그림 · 크기와 거리는 실제 비율이 아닙니다
            </text>
          </svg>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: '.86em' }}>지구에서 올려다본 달</div>
          <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
          <div style={{ textAlign: 'center' }}>
            <div className="big" style={{ color: 'var(--moon)' }}>
              {phaseName(p)}{phaseTerm(p) && <span className="term">{phaseTerm(p)}</span>}
            </div>
            <div className="mono" style={{ color: 'var(--muted)' }}>
              달이 보이지 않는 때부터 {age.toFixed(1)}일째 · 밝은 부분 {(illum * 100).toFixed(0)}%
            </div>
          </div>

          <input className="slider" type="range" min="0" max="0.999" step="0.001"
            value={p} onChange={e => { setPlaying(false); setP(Number(e.target.value)) }}
            aria-label="달의 위상" />

          <div className="toolrow" style={{ justifyContent: 'center' }}>
            <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
              {playing ? '멈춤' : '한 달 재생'}
            </button>
            <button className="btn" onClick={() => { setPlaying(false); setP(moonPhase01(date)) }}>
              오늘의 달로
            </button>
          </div>

          <div className="toolrow" style={{ justifyContent: 'center' }}>
            {SNAPS.map(s => (
              <button key={s.p} className={'btn' + (Math.abs(p - s.p) < 0.02 ? ' on' : '')}
                style={{ padding: '6px 10px' }}
                title={s.term ? `${s.ko} · 정식 용어 ${s.term}` : s.ko}
                onClick={() => { setPlaying(false); setP(s.p) }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="-8 -8 16 16">
                    <circle r="7.5" fill="var(--shadow-side)" />
                    <path d={moonPathD(7.5, s.p)} fill="var(--moon)" />
                  </svg>
                  {s.ko}
                </span>
              </button>
            ))}
          </div>

          <div className="note" style={{ width: '100%' }}>{phaseTip(p)}</div>
        </div>
      </div>

      <More title="더 알아보기 — 왜 모양이 달라 보일까 · 달 이름" count="2">
      <div className="card">
        <h3>왜 모양이 달라 보일까
          <span className="std extra">교육과정 밖</span>
        </h3>
        <p className="hint" style={{ margin: '0 0 8px' }}>
          2022 개정 교육과정 [4과13-01]의 성취기준 해설은 <b>달의 위상변화 원인을 다루지 않고</b>,
          모양이 주기적으로 바뀌는 현상을 관찰해 확인하는 데 초점을 둡니다.
          아래 설명은 더 알고 싶어 하는 학생과 선생님을 위한 것입니다.
        </p>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.95em' }}>
          달은 스스로 빛나지 않고 태양 빛을 반사합니다. 그래서 <b>언제나 절반은 밝고 절반은 어둡습니다</b>. 다만,
          달이 지구를 돌면서 지구에서 보는 각도가 달라지기 때문에 모양이 달라 보입니다.
          이 되풀이가 <b>약 30일</b>마다 한 바퀴입니다. 정확히는 {SYNODIC.toFixed(1)}일이어서, 음력 한 달은 29일 또는 30일이 됩니다.
          오른쪽 달은 오늘({fmtDateKST(date)})의 실제 기울기를 적용해 그린 것입니다.
        </p>
      </div>

      <div className="card">
        <h3>달 모양의 이름
          <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>
            초등 교과서 이름과 정식 용어
          </span>
        </h3>
        <p className="hint" style={{ margin: '0 0 10px' }}>
          초등 교과서는 <b>초승달·상현달·보름달·하현달·그믐달</b> 다섯 이름만 씁니다.
          교과서에 이름이 없다고 해서 이름이 없는 것은 아니어서, 중등 이상에서 쓰는 정식 용어를 함께 적었습니다.
          아이가 물으면 답해 주시라고 둔 것이고, <b>수업에서 가르쳐야 하는 것은 왼쪽 다섯 이름</b>입니다.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="termtable">
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
          <b style={{ color: 'var(--warn)' }}>주의</b> — 삭과 그믐달은 다릅니다.
          삭은 달이 아예 보이지 않는 때(음력 1일쯤)이고, 그믐달은 그보다 며칠 앞서 새벽 동쪽 하늘에 가늘게 보이는 달입니다.
        </p>
      </div>
      </More>
    </>
  )
}
