import React, { useEffect, useRef, useState } from 'react'
import { moonPathD } from '../lib/moon.jsx'
import MoonImage from '../lib/MoonImage.jsx'
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

export default function PhaseLab({ date, big }) {
  const [p, setP] = useState(() => moonPhase01(date))
  const [playing, setPlaying] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const raf = useRef(0)

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

  // 배치도 좌표
  const W = 620, H = 470, cx = 330, cy = 235, R = 158
  const a = (180 + 360 * p) * Math.PI / 180
  const mx = cx + R * Math.cos(a)
  const my = cy - R * Math.sin(a)
  const discR = big ? 150 : 128

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '72ch' }}>
        왼쪽은 우주에서 내려다본 모습, 오른쪽은 그때 지구에서 올려다본 달입니다.
        달을 끌거나 슬라이더를 밀면 두 그림이 함께 움직입니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.35fr) minmax(280px,1fr)' }}>
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

            {/* 햇빛 */}
            {Array.from({ length: 11 }, (_, i) => {
              const y = 40 + i * 39
              return <line key={i} x1="72" y1={y} x2="250" y2={y}
                stroke="var(--sun)" strokeOpacity=".22" strokeWidth="2" strokeDasharray="7 9" />
            })}
            <circle cx="34" cy={H / 2} r="54" fill="url(#sunG)" />
            <text x="34" y={H / 2 + 4} textAnchor="middle" fill="#5A3200" fontSize="17" fontWeight="700">태양</text>

            {/* 달의 궤도 */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 6" />

            {/* 8개 위치 */}
            {SNAPS.map(s => {
              const sa = (180 + 360 * s.p) * Math.PI / 180
              const sx = cx + R * Math.cos(sa), sy = cy - R * Math.sin(sa)
              return <circle key={s.p} cx={sx} cy={sy} r="2.5" fill="var(--muted)" opacity=".55" />
            })}

            {/* 지구 */}
            <g transform={`translate(${cx},${cy})`}>
              <circle r="30" fill="#101828" />
              <circle r="30" fill="var(--earth)" clipPath="url(#leftHalf)" />
              <circle r="30" fill="none" stroke="rgba(255,255,255,.25)" />
              <text y="52" textAnchor="middle" fill="var(--text-2)" fontSize="15" fontWeight="600">지구</text>
            </g>

            {/* 보는 방향 */}
            <line x1={cx} y1={cy} x2={mx} y2={my} stroke="var(--sky)" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="3 5" />

            {/* 달 — 왼쪽(태양 쪽) 절반이 밝다 */}
            <g transform={`translate(${mx},${my})`}>
              <circle r="17" fill="var(--shadow-side)" />
              <path d="M0,-17 A17,17 0 0 0 0,17 Z" fill="var(--moon)" />
              <circle r="17" fill="none" stroke="rgba(255,255,255,.3)" />
            </g>
            <text x={mx} y={my - 26} textAnchor="middle" fill="var(--moon)" fontSize="14" fontWeight="700">달</text>

            <text x={W - 12} y={H - 12} textAnchor="end" fill="var(--muted)" fontSize="12">
              북극 위에서 내려다본 그림 · 크기와 거리는 실제 비율이 아닙니다
            </text>
          </svg>
        </div>

        <div className="card center" style={{ flexDirection: 'column', gap: 14 }}>
          <div style={{ color: 'var(--muted)', fontSize: '.88em' }}>지구에서 올려다본 달</div>
          <MoonImage size={discR} phase={p} elat={lib.elat} elon={lib.elon} />
          <div style={{ textAlign: 'center' }}>
            <div className="big" style={{ color: 'var(--moon)' }}>{phaseName(p)}</div>
            <div className="mono" style={{ color: 'var(--muted)' }}>
              달의 나이 {age.toFixed(1)}일 · 밝은 부분 {(illum * 100).toFixed(0)}%
            </div>
          </div>
          <div className="note" style={{ width: '100%' }}>{phaseTip(p)}</div>
        </div>
      </div>

      <div className="card">
        <div className="toolrow" style={{ marginBottom: 10 }}>
          <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
            {playing ? '멈춤' : '한 달 재생'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setP(moonPhase01(date)) }}>
            오늘의 달로 ({fmtDateKST(date)})
          </button>
          <button className={'btn' + (showNames ? ' on' : '')} onClick={() => setShowNames(!showNames)}>
            위상 이름
          </button>
          <span className="mono" style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
            음력 {age.toFixed(1)}일째
          </span>
        </div>

        <input className="slider" type="range" min="0" max="0.999" step="0.001"
          value={p} onChange={e => { setPlaying(false); setP(Number(e.target.value)) }}
          aria-label="달의 위상" />

        {showNames && (
          <div className="toolrow" style={{ marginTop: 10 }}>
            {SNAPS.map(s => (
              <button key={s.p} className={'btn' + (Math.abs(p - s.p) < 0.02 ? ' on' : '')}
                onClick={() => { setPlaying(false); setP(s.p) }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <svg width="16" height="16" viewBox="-8 -8 16 16">
                    <circle r="7.5" fill="var(--shadow-side)" />
                    <path d={moonPathD(7.5, s.p)} fill="var(--moon)" />
                  </svg>
                  {s.ko}
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="hint">
          달은 스스로 빛나지 않고 태양 빛을 반사합니다. 항상 절반은 밝지만,
          지구에서 보는 각도가 달라져서 모양이 달라 보입니다. 이 되풀이가 약 {SYNODIC.toFixed(1)}일마다 한 바퀴입니다.
        </p>
      </div>
    </>
  )
}
