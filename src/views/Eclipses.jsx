import React, { useMemo, useState } from 'react'
import { nextEclipses, ECLIPSE_KIND, fmtKST } from '../lib/astro.js'

const W = 780, H = 250

function Diagram({ kind }) {
  const solar = kind === 'solar'
  const sunX = 60, sunR = 34
  const earthX = solar ? 640 : 430, earthR = 34
  const moonX = solar ? 430 : 640, moonR = 13
  const cy = H / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
      role="img" aria-label={solar ? '일식 배치' : '월식 배치'}>
      <defs>
        <radialGradient id={'sg' + kind}>
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="60%" stopColor="#FFAE33" />
          <stop offset="100%" stopColor="#C25A00" />
        </radialGradient>
      </defs>

      {/* 그림자 */}
      {solar ? (
        <polygon points={`${moonX},${cy - moonR} ${moonX},${cy + moonR} ${earthX + 6},${cy + 5} ${earthX + 6},${cy - 5}`}
          fill="#000" opacity=".62" />
      ) : (
        <polygon points={`${earthX},${cy - earthR} ${earthX},${cy + earthR} ${moonX + 90},${cy + 3} ${moonX + 90},${cy - 3}`}
          fill="#000" opacity=".62" />
      )}

      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={sunX + sunR + 6} y1={cy - 45 + i * 15} x2={W - 20} y2={cy - 45 + i * 15}
          stroke="var(--sun)" strokeOpacity=".13" strokeWidth="2" strokeDasharray="6 8" />
      ))}

      <circle cx={sunX} cy={cy} r={sunR} fill={`url(#sg${kind})`} />
      <text x={sunX} y={cy + sunR + 22} textAnchor="middle" fill="var(--sun)" fontSize="15" fontWeight="700">태양</text>

      <circle cx={earthX} cy={cy} r={earthR} fill="#101828" />
      <path d={`M${earthX},${cy - earthR} A${earthR},${earthR} 0 0 0 ${earthX},${cy + earthR} Z`} fill="var(--earth)" />
      <circle cx={earthX} cy={cy} r={earthR} fill="none" stroke="rgba(255,255,255,.25)" />
      <text x={earthX} y={cy + earthR + 22} textAnchor="middle" fill="var(--sky)" fontSize="15" fontWeight="700">지구</text>

      <circle cx={moonX} cy={cy} r={moonR} fill="var(--shadow-side)" />
      <path d={`M${moonX},${cy - moonR} A${moonR},${moonR} 0 0 0 ${moonX},${cy + moonR} Z`} fill="var(--moon)" />
      <text x={moonX} y={cy - moonR - 12} textAnchor="middle" fill="var(--moon)" fontSize="15" fontWeight="700">달</text>
    </svg>
  )
}

export default function Eclipses({ date }) {
  const [kind, setKind] = useState('solar')
  const list = useMemo(() => nextEclipses(date, 4), [Math.floor(date.getTime() / 86400000)])
  const rows = kind === 'solar' ? list.solar : list.lunar

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        해와 지구와 달이 한 줄로 늘어설 때 생기는 일입니다. 교육과정에 나오는 내용은 아니지만,
        달의 위상을 배우고 나면 아이들이 가장 많이 묻는 것이기도 합니다.
      </p>

      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        <button aria-pressed={kind === 'solar'} onClick={() => setKind('solar')}>일식 — 달이 해를 가림</button>
        <button aria-pressed={kind === 'lunar'} onClick={() => setKind('lunar')}>월식 — 지구 그림자에 달이 들어감</button>
      </div>

      <div className="stage" style={{ padding: 8 }}>
        <Diagram kind={kind} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(280px,1fr)' }}>
        <div className="card">
          <h3>{kind === 'solar' ? '앞으로의 일식' : '앞으로의 월식'}</h3>
          {rows.length === 0 && <p className="hint">계산할 수 없습니다.</p>}
          <div className="rows">
            {rows.map((e, i) => (
              <div className="r" key={i}>
                <span>{fmtKST(e.peak.date, true)}</span>
                <b style={{ color: 'var(--moon)' }}>{ECLIPSE_KIND[e.kind] || e.kind}{kind === 'solar' ? '일식' : e.kind === 'penumbral' ? '' : '월식'}</b>
              </div>
            ))}
          </div>
          <p className="hint">
            {kind === 'solar'
              ? '지구 어딘가에서 볼 수 있는 일식입니다. 우리나라에서 보이는지는 지역에 따라 다릅니다. 태양은 절대 맨눈으로 보면 안 됩니다.'
              : '월식은 달이 떠 있는 곳이면 어디서나 똑같이 보입니다. 맨눈으로 안전하게 볼 수 있습니다.'}
          </p>
        </div>

        <div className="card">
          <h3>왜 매달 일어나지 않을까</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            달이 지구를 도는 길은 지구가 태양을 도는 길보다 약 <b>5° 기울어져</b> 있습니다.
            그래서 삭과 보름마다 셋이 한 줄로 서지는 않고, 대개는 달이 그림자 위나 아래로 비껴갑니다.
            딱 맞아떨어지는 때에만 일식과 월식이 일어납니다.
          </p>
          <div className="rows" style={{ marginTop: 12 }}>
            <div className="r"><span>일식이 생기는 때</span><b>삭 (달이 태양 쪽)</b></div>
            <div className="r"><span>월식이 생기는 때</span><b>보름 (달이 반대쪽)</b></div>
            <div className="r"><span>달의 궤도 기울기</span><b>약 5.1°</b></div>
          </div>
          <p className="hint">
            개기월식 때 달이 붉게 보이는 것은, 지구 대기를 통과하며 휘어 들어온 붉은 빛이 달을 비추기 때문입니다.
          </p>
        </div>
      </div>
    </>
  )
}
