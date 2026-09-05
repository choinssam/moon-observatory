import React, { useMemo, useRef } from 'react'
import { useFit } from '../lib/useFit.js'
import {
  Astronomy, yearSunProfile, seasonsOf, dayTrack, riseSetTransit,
  horizonOf, kstMidnight, fmtKST
} from '../lib/astro.js'

const CW = 900, ML = 52, MR = 52, MT = 18, MB = 34

export default function SeasonLab({ date, setDate, obs, loc }) {
  const year = date.getUTCFullYear()
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)
  const rootRef = useRef(null)
  const box = useFit(rootRef)

  const profile = useMemo(() => yearSunProfile(obs, year), [loc.lat, loc.lon, year])
  const seasons = useMemo(() => seasonsOf(year), [year])

  const curves = useMemo(() => {
    const pick = [
      { ko: '하지', color: '#FF8B6B', date: seasons[1].date },
      { ko: '춘분', color: '#5FD1A0', date: seasons[0].date },
      { ko: '동지', color: '#5FA3FF', date: seasons[3].date }
    ]
    return pick.map(p => ({ ...p, track: dayTrack(Astronomy.Body.Sun, obs, p.date, 20) }))
  }, [loc.lat, loc.lon, year])

  const today = useMemo(() => dayTrack(Astronomy.Body.Sun, obs, date, 20), [dayKey, loc.lat, loc.lon])
  const rs = useMemo(() => riseSetTransit(Astronomy.Body.Sun, obs, date), [dayKey, loc.lat, loc.lon])
  const now = horizonOf(Astronomy.Body.Sun, obs, date)

  /* 배치: 윗줄 그래프 두 장(화면 높이에 맞춰 세로를 늘린다), 아랫줄 그림자·오늘·까닭 */
  const gap = 14
  const wide = box.w >= 900
  const compact = box.h < 700
  const chartW = wide ? (box.w - gap) / 2 - 32 : box.w - 32
  const rowB = compact ? 168 : 196
  const chartAvail = wide ? box.h - rowB - gap - (compact ? 118 : 160) : 0
  const CH = wide ? Math.round(Math.max(220, Math.min(520, chartAvail * CW / Math.max(300, chartW)))) : 300

  const dayLen = rs.rise && rs.set ? Math.abs(rs.set - rs.rise) / 3600000 : null
  const maxAlt = 90
  const x = m => ML + (m / 1440) * (CW - ML - MR)
  const y = a => CH - MB - (Math.max(0, Math.min(maxAlt, a)) / maxAlt) * (CH - MT - MB)

  // 막대 그림자
  const stick = 90
  const shadow = now.alt > 1 ? Math.min(stick / Math.tan(now.alt * Math.PI / 180), 460) : null

  const okProfile = profile.filter(p => p.alt != null && p.dayHours != null)
  const mx = m => 52 + ((m - 1) / 11) * (CW - 52 - 52)
  const myA = a => CH - MB - (Math.max(0, Math.min(90, a)) / 90) * (CH - MT - MB)
  const myD = h => CH - MB - (Math.max(0, Math.min(24, h)) - 8) / 8 * (CH - MT - MB)
  const md = d => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(d)

  return (
    <div ref={rootRef} className={'season ' + (wide ? 'wide' : 'narrow') + (compact ? ' compact' : '')}
      style={wide ? { height: box.h, gridTemplateRows: `minmax(0,1fr) ${rowB}px` } : undefined}>
      <div className="card chart">
        <h3>하루 동안 태양의 고도 <small>계절별로 겹쳐 보기</small></h3>
        {!compact && (
          <p className="hint" style={{ margin: '0 0 6px' }}>
            태양 고도가 높을수록 막대 그림자는 짧아집니다. 기온은 남중(낮 12시 30분쯤)보다 두세 시간 늦은 오후 2~3시에 가장 높습니다.
            땅과 공기가 데워지는 데 시간이 걸리기 때문입니다.
          </p>
        )}
        <svg viewBox={`0 0 ${CW} ${CH}`} className="chart-svg" role="img" aria-label="계절별 태양 고도 곡선">
          <rect x={ML} y={MT} width={CW - ML - MR} height={CH - MT - MB} fill="#0C1120" stroke="var(--line)" />
          {[0, 30, 60, 90].map(a => (
            <g key={a}>
              <line x1={ML} y1={y(a)} x2={CW - MR} y2={y(a)} stroke="var(--line)" strokeDasharray={a === 0 ? '' : '3 7'} />
              <text x={ML - 8} y={y(a) + 4} textAnchor="end" fill="var(--muted)" fontSize="13">{a}°</text>
            </g>
          ))}
          {[0, 6, 12, 18, 24].map(h => (
            <g key={h}>
              <line x1={x(h * 60)} y1={MT} x2={x(h * 60)} y2={CH - MB} stroke="var(--line)" strokeDasharray="3 7" />
              <text x={x(h * 60)} y={CH - MB + 20} textAnchor="middle" fill="var(--muted)" fontSize="13">{h}시</text>
            </g>
          ))}
          {curves.map(c => (
            <g key={c.ko}>
              <polyline points={c.track.filter(q => q.alt > 0).map(q => `${x(q.min)},${y(q.alt)}`).join(' ')}
                fill="none" stroke={c.color} strokeWidth="2.6" />
            </g>
          ))}
          <polyline points={today.filter(q => q.alt > 0).map(q => `${x(q.min)},${y(q.alt)}`).join(' ')}
            fill="none" stroke="var(--moon)" strokeWidth="3.4" strokeDasharray="7 5" />
          {now.alt > 0 && <circle cx={x(minutesOfDay)} cy={y(now.alt)} r="7" fill="var(--moon)" stroke="#000" strokeWidth="1.5" />}
        </svg>
        <div className="toolrow" style={{ marginTop: 8 }}>
          <div className="legend">
            {curves.map(c => <span key={c.ko}><i style={{ background: c.color }} />{c.ko}</span>)}
            <span><i style={{ background: 'var(--moon)' }} />오늘 ({md(date)})</span>
          </div>
          <span className="mono" style={{ color: 'var(--muted)', marginLeft: 'auto' }}>시각</span>
          <input className="slider" style={{ flex: '1 1 140px', minWidth: 120 }} type="range" min="0" max="1439" step="10"
            value={minutesOfDay} onChange={e => setDate(new Date(dayKey + Number(e.target.value) * 60000))}
            aria-label="시각" />
          <b className="mono" style={{ minWidth: '4.5em', textAlign: 'right' }}>
            {String(Math.floor(minutesOfDay / 60)).padStart(2, '0')}:{String(minutesOfDay % 60).padStart(2, '0')}
          </b>
          <div className="seg">
            {seasons.map(s => (
              <button key={s.key} aria-pressed={Math.abs(s.date - date) < 86400000 * 1.5}
                onClick={() => setDate(new Date(kstMidnight(s.date).getTime() + 12 * 3600000))}>{s.name}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card chart">
        <h3>일 년 동안의 남중 고도와 낮의 길이 <small>{loc.name}</small></h3>
        {!compact && (
          <p className="hint" style={{ margin: '0 0 6px' }}>
            태양이 하루 중 가장 높이 뜨는 때를 남중, 그때의 고도를 남중 고도라고 합니다.
            두 곡선의 오르내림이 나란합니다. 남중 고도가 높은 달에 낮도 길고, 그래서 더 덥습니다.
          </p>
        )}
        <svg viewBox={`0 0 ${CW} ${CH}`} className="chart-svg" role="img" aria-label="월별 남중 고도와 낮의 길이">
          <rect x={52} y={MT} width={CW - 104} height={CH - MT - MB} fill="#0C1120" stroke="var(--line)" />
          {[0, 30, 60, 90].map(a => (
            <g key={a}>
              <line x1={52} y1={myA(a)} x2={CW - 52} y2={myA(a)} stroke="var(--line)" strokeDasharray="3 7" />
              <text x={44} y={myA(a) + 4} textAnchor="end" fill="var(--moon)" fontSize="13">{a}°</text>
            </g>
          ))}
          {[8, 12, 16].map(h => (
            <text key={h} x={CW - 44} y={myD(h) + 4} textAnchor="start" fill="var(--sky)" fontSize="13">{h}h</text>
          ))}
          {profile.map(p => (
            <text key={p.month} x={mx(p.month)} y={CH - MB + 20} textAnchor="middle" fill="var(--muted)" fontSize="12">
              {p.month}월
            </text>
          ))}
          <polyline points={okProfile.map(p => `${mx(p.month)},${myA(p.alt)}`).join(' ')}
            fill="none" stroke="var(--moon)" strokeWidth="3" />
          {okProfile.map(p => <circle key={p.month} cx={mx(p.month)} cy={myA(p.alt)} r="4" fill="var(--moon)" />)}
          <polyline points={okProfile.map(p => `${mx(p.month)},${myD(p.dayHours)}`).join(' ')}
            fill="none" stroke="var(--sky)" strokeWidth="3" strokeDasharray="6 5" />
          {okProfile.map(p => <circle key={'d' + p.month} cx={mx(p.month)} cy={myD(p.dayHours)} r="4" fill="var(--sky)" />)}
        </svg>
        <div className="legend" style={{ marginTop: 8 }}>
          <span><i style={{ background: 'var(--moon)' }} />남중 고도 (왼쪽 눈금)</span>
          <span><i style={{ background: 'var(--sky)' }} />낮의 길이 (오른쪽 눈금)</span>
        </div>
      </div>

      <div className="card">
        <h3>막대의 그림자</h3>
        <svg viewBox="0 0 480 150" className="shadow-svg" role="img" aria-label="막대 그림자">
          <line x1="0" y1="120" x2="480" y2="120" stroke="var(--line)" strokeWidth="2" />
          <line x1="60" y1="120" x2="60" y2="30" stroke="var(--text-2)" strokeWidth="6" strokeLinecap="round" />
          {shadow != null ? (
            <>
              <line x1="60" y1="120" x2={60 + shadow} y2="120" stroke="var(--moon)" strokeWidth="9" opacity=".5" strokeLinecap="round" />
              <line x1="60" y1="30" x2={60 + shadow} y2="120" stroke="var(--sun)" strokeWidth="1.6" strokeDasharray="5 5" />
              <text x={60 + shadow / 2} y="140" textAnchor="middle" fill="var(--moon)" fontSize="14">
                그림자 {(shadow / 90).toFixed(2)}배
              </text>
            </>
          ) : (
            <text x="240" y="80" textAnchor="middle" fill="var(--muted)" fontSize="15">태양이 지평선 아래입니다</text>
          )}
        </svg>
        <p className="hint" style={{ margin: '4px 0 0' }}>태양이 높이 뜰수록 그림자는 짧아집니다. 남중할 때 그림자가 가장 짧습니다.</p>
      </div>

      <div className="card">
        <h3>오늘 <small>{loc.name} · {md(date)}</small></h3>
        <div className="facts" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
          {[['일출', fmtKST(rs.rise)], ['남중', fmtKST(rs.transit)], ['일몰', fmtKST(rs.set)],
            ['남중 고도', rs.transitAlt != null ? rs.transitAlt.toFixed(1) + '°' : '—'],
            ['낮의 길이', dayLen ? dayLen.toFixed(1) + '시간' : '—'],
            ['지금 태양 고도', now.alt.toFixed(1) + '°']].map(([k, v]) => (
            <div key={k} className="fact"><div className="fact-k">{k}</div><div className="fact-v">{v}</div></div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>계절이 바뀌는 까닭</h3>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.92em' }}>
          지구는 자전축이 <b>23.4° 기울어진 채로</b> 태양 둘레를 공전합니다.
          우리나라가 태양 쪽으로 기울면 햇빛을 가파르게 받아 남중 고도가 높고 낮이 긴 여름이 되고,
          반대편에 오면 비스듬히 받아 남중 고도가 낮고 낮이 짧은 겨울이 됩니다.
          기울기가 없다면 일 년 내내 남중 고도가 같아 계절이 생기지 않습니다.
          <b> 지구의 운동</b> 화면에서 기울기를 0°로 바꿔 확인해 보세요.
        </p>
      </div>
    </div>
  )
}
