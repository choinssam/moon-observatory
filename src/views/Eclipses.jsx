import React, { useMemo, useRef, useState } from 'react'
import { Extra } from '../lib/More.jsx'
import { useFit } from '../lib/useFit.js'
import { nextEclipses, ECLIPSE_KIND } from '../lib/astro.js'

const BASE = import.meta.env.BASE_URL
const W = 780, H = 250

/* 연도까지: 일식·월식은 해마다 같은 날 생기지 않는다 */
const fmtFull = d => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
}).format(d)

const PHOTO = {
  solar: {
    src: BASE + 'photo/solar_eclipse.jpg',
    alt: '개기일식 때 달 뒤로 태양이 가려지고 가장자리만 밝게 빛나는 모습',
    cap: '2017년 8월 21일 미국에서 찍은 개기일식. 달에 가려진 태양의 가장자리가 반지처럼 빛나는 순간을 다이아몬드 링이라고 합니다.',
    credit: 'NASA / Carla Thomas'
  },
  lunar: {
    src: BASE + 'photo/lunar_eclipse.jpg',
    alt: '개기월식 때 붉게 물든 보름달',
    cap: '2022년 11월 8일 개기월식. 지구 그림자 속에 들어간 달이 붉게 보입니다.',
    credit: 'NASA / Bill Ingalls'
  }
}

function Diagram({ kind }) {
  const solar = kind === 'solar'
  const sunX = 60, sunR = 34
  const earthX = solar ? 640 : 430, earthR = 34
  const moonX = solar ? 430 : 640, moonR = 13
  const cy = H / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img" aria-label={solar ? '일식 배치' : '월식 배치'}>
      <defs>
        <radialGradient id={'sg' + kind}>
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="60%" stopColor="#FFAE33" />
          <stop offset="100%" stopColor="#C25A00" />
        </radialGradient>
      </defs>

      {solar ? (
        <polygon points={`${moonX},${cy - moonR} ${moonX},${cy + moonR} ${earthX + 4},${cy + 4} ${earthX + 4},${cy - 4}`}
          fill="#000" opacity=".68" />
      ) : (
        <polygon points={`${earthX},${cy - earthR} ${earthX},${cy + earthR} ${moonX + 80},${cy + 3} ${moonX + 80},${cy - 3}`}
          fill="#000" opacity=".68" />
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

      <circle cx={moonX} cy={cy} r={moonR} fill={kind === 'lunar' ? '#7A3B2E' : 'var(--shadow-side)'} />
      {kind === 'solar' &&
        <path d={`M${moonX},${cy - moonR} A${moonR},${moonR} 0 0 0 ${moonX},${cy + moonR} Z`} fill="var(--moon)" />}
      <text x={moonX} y={cy - moonR - 12} textAnchor="middle" fill="var(--moon)" fontSize="15" fontWeight="700">달</text>
    </svg>
  )
}

export default function Eclipses({ date }) {
  const [kind, setKind] = useState('solar')
  const list = useMemo(() => nextEclipses(date, 4), [Math.floor(date.getTime() / 86400000)])
  const rows = kind === 'solar' ? list.solar : list.lunar
  const ph = PHOTO[kind]
  const rootRef = useRef(null)
  const box = useFit(rootRef)

  /* 배치: [배치 그림 + 앞으로의 날짜 + 더 알아보기] [정사각 실제 사진]. 사진은 화면 높이만큼 */
  const gap = 14
  const wide = box.w >= 900
  const sq = wide ? Math.min(box.h, Math.round(box.w * 0.46)) : Math.min(box.w, Math.round(box.h * 0.6))
  const roomy = wide && box.h >= 700

  return (
    <div ref={rootRef} className={'fit eclipse ' + (wide ? 'wide' : 'narrow')}
      style={wide ? { gridTemplateColumns: `minmax(0,1fr) ${sq}px`, height: sq } : undefined}>
      <div className="side" style={{ padding: 0, gap }}>
        <div className="stage" style={{ flex: '0 0 auto', padding: '44px 8px 6px' }}>
          <Diagram kind={kind} />
          <div className="seg" style={{ position: 'absolute', left: 10, top: 8, zIndex: 2 }}>
            <button aria-pressed={kind === 'solar'} onClick={() => setKind('solar')}>일식 · 달이 해를 가림</button>
            <button aria-pressed={kind === 'lunar'} onClick={() => setKind('lunar')}>월식 · 지구 그림자에 달이 들어감</button>
          </div>
          <p style={{ margin: '0 8px 4px', color: 'var(--muted)', fontSize: '.84em' }}>
            해와 지구와 달이 한 줄로 늘어설 때 생기는 일입니다. 크기와 거리는 실제 비율이 아닙니다. 실제로는 태양이 달보다 400배 크고 400배 멀리 있어서
            하늘에서 보이는 크기가 거의 같습니다. 그래서 달이 해를 꼭 맞게 가릴 수 있습니다.
          </p>
        </div>

        <div className="card">
          <h3>{kind === 'solar' ? '앞으로의 일식' : '앞으로의 월식'}
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>한국 시각</span>
          </h3>
          {rows.length === 0 && <p className="hint">계산할 수 없습니다.</p>}
          <div className="rows">
            {rows.map((e, i) => (
              <div className="r" key={i}>
                <span style={{ color: 'var(--text)' }}>{fmtFull(e.peak.date)}</span>
                <b style={{ color: 'var(--moon)' }}>
                  {ECLIPSE_KIND[e.kind] || e.kind}{kind === 'solar' ? '일식' : e.kind === 'penumbral' ? '' : '월식'}
                </b>
              </div>
            ))}
          </div>
          <p className="hint">
            {kind === 'solar'
              ? '지구 어딘가에서 볼 수 있는 일식입니다. 우리나라에서 보이는지는 지역에 따라 다릅니다. 태양은 절대 맨눈으로 보면 안 됩니다.'
              : '월식은 달이 떠 있는 곳이면 어디서나 똑같이 보입니다. 맨눈으로 안전하게 볼 수 있습니다.'}
          </p>
        </div>

        <Extra fold={!roomy} count="2">
          <div className="extra-row">
            <div className="card">
              <h3>왜 매달 일어나지 않을까</h3>
              <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                달이 지구를 도는 길은 지구가 태양을 도는 길보다 약 <b>5° 기울어져</b> 있습니다.
                그래서 삭과 보름마다 셋이 한 줄로 서지는 않고, 대개는 달이 그림자 위나 아래로 비껴갑니다.
                딱 맞아떨어지는 때에만 일식과 월식이 일어납니다.
              </p>
              <div className="rows" style={{ marginTop: 10 }}>
                <div className="r"><span>일식이 생기는 때</span><b>삭 (달이 태양 쪽)</b></div>
                <div className="r"><span>월식이 생기는 때</span><b>보름 (달이 반대쪽)</b></div>
                <div className="r"><span>달의 궤도 기울기</span><b>약 5.1°</b></div>
              </div>
            </div>
            <div className="card">
              <h3>개기월식은 왜 붉을까</h3>
              <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                지구 그림자에 완전히 들어가도 달이 새까매지지는 않습니다.
                지구의 공기를 스치며 휘어 들어온 빛이 달을 비추는데, 이때 파란빛은 공기에 흩어지고
                붉은빛만 남아 달을 물들입니다. 노을이 붉은 것과 같은 이유입니다.
              </p>
              <p className="hint">이런 달을 <b>블러드 문</b>이라고 부르기도 합니다.</p>
            </div>
          </div>
        </Extra>
      </div>

      {/* 실제 사진 — 정사각형, 설명은 사진 위에 겹친다 */}
      <div className="stage photo" style={{ width: sq, height: sq, margin: wide ? 0 : '0 auto', background: '#05070E' }}>
        <img src={ph.src} alt={ph.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div className="photo-cap">
          <b>실제로 찍은 사진</b>
          <p>{ph.cap}</p>
          <small>사진 {ph.credit} (공개 자료)</small>
        </div>
      </div>
    </div>
  )
}
