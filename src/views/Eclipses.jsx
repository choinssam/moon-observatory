import React, { useMemo, useState } from 'react'
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
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}
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

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: 'none' }}>
        해와 지구와 달이 한 줄로 늘어설 때 생기는 일입니다. 교육과정에 나오는 내용은 아니지만,
        달의 위상을 배우고 나면 아이들이 가장 많이 묻는 것이기도 합니다.
      </p>

      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        <button aria-pressed={kind === 'solar'} onClick={() => setKind('solar')}>일식 — 달이 해를 가림</button>
        <button aria-pressed={kind === 'lunar'} onClick={() => setKind('lunar')}>월식 — 지구 그림자에 달이 들어감</button>
      </div>

      {/* 왼쪽: 배치 그림 + 앞으로의 날짜 / 오른쪽: 정사각 실제 사진. 두 칸 높이를 맞춘다 */}
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(260px,min(45%, 62vh))', alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="stage" style={{ padding: 8 }}>
            <Diagram kind={kind} />
            <p style={{ margin: '4px 12px 10px', color: 'var(--muted)', fontSize: '.85em' }}>
              크기와 거리는 실제 비율이 아닙니다. 실제로는 태양이 달보다 400배 크고 400배 멀리 있어서
              하늘에서 보이는 크기가 거의 같습니다 — 그래서 달이 해를 꼭 맞게 가릴 수 있습니다.
            </p>
          </div>
          <div style={{ flex: 1 }}>
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
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#05070E', overflow: 'hidden' }}>
            <img src={ph.src} alt={ph.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ padding: '12px 16px 14px', flex: 1 }}>
            <h3 style={{ marginBottom: 6 }}>실제로 찍은 사진</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '.92em', margin: 0 }}>{ph.cap}</p>
            <p className="hint" style={{ marginTop: 8 }}>사진 {ph.credit} (공개 자료)</p>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
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
    </>
  )
}
