import React, { useEffect, useRef, useState } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import { SYNODIC, moonPhase01, phaseName, phaseTip, fmtDateKST, Astronomy } from '../lib/astro.js'

const SNAPS = [
  { p: 0,     ko: '삭' },
  { p: 0.125, ko: '초승달' },
  { p: 0.25,  ko: '상현달' },
  { p: 0.375, ko: '볼록달' },
  { p: 0.5,   ko: '보름달' },
  { p: 0.625, ko: '볼록달' },
  { p: 0.75,  ko: '하현달' },
  { p: 0.875, ko: '그믐달' }
]

const W = 620, H = 430, cx = 330, cy = 215, R = 150

export default function PhaseLab({ date, big }) {
  const [p, setP] = useState(() => moonPhase01(date))
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)
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

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '78ch' }}>
        왼쪽은 우주에서 내려다본 모습, 오른쪽은 그때 지구에서 올려다본 달입니다. 슬라이더를 밀면 두 그림이 함께 움직입니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,0.95fr)', alignItems: 'start' }}>
        <div className="stage">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
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

            <g transform={`translate(${mx},${my})`}>
              <circle r="17" fill="var(--shadow-side)" />
              <path d="M0,-17 A17,17 0 0 0 0,17 Z" fill="var(--moon)" />
              <circle r="17" fill="none" stroke="rgba(255,255,255,.3)" />
            </g>
            <text x={mx} y={my - 26} textAnchor="middle" fill="var(--moon)" fontSize="14" fontWeight="700">달</text>

            <text x={W - 12} y={H - 10} textAnchor="end" fill="var(--muted)" fontSize="12">
              북극 위에서 내려다본 그림 · 크기와 거리는 실제 비율이 아닙니다
            </text>
          </svg>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: '.86em' }}>지구에서 올려다본 달</div>
          <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
          <div style={{ textAlign: 'center' }}>
            <div className="big" style={{ color: 'var(--moon)' }}>{phaseName(p)}</div>
            <div className="mono" style={{ color: 'var(--muted)' }}>
              달의 나이 {age.toFixed(1)}일 · 밝은 부분 {(illum * 100).toFixed(0)}%
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

      <div className="card">
        <h3>왜 모양이 달라 보일까</h3>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.95em' }}>
          달은 스스로 빛나지 않고 태양 빛을 반사합니다. 그래서 <b>언제나 절반은 밝고 절반은 어둡습니다</b>. 다만,
          달이 지구를 돌면서 지구에서 보는 각도가 달라지기 때문에 모양이 달라 보입니다.
          이 되풀이가 약 {SYNODIC.toFixed(1)}일마다 한 바퀴이고, 그래서 음력 한 달은 29일 또는 30일입니다.
          오른쪽 달은 오늘({fmtDateKST(date)})의 실제 기울기를 적용해 그린 것입니다.
        </p>
      </div>
    </>
  )
}
