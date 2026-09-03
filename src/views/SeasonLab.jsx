import React, { useMemo } from 'react'
import {
  Astronomy, yearSunProfile, seasonsOf, dayTrack, riseSetTransit,
  horizonOf, kstMidnight, fmtKST
} from '../lib/astro.js'

const CW = 900, CH = 300, ML = 52, MR = 52, MT = 18, MB = 34

export default function SeasonLab({ date, setDate, obs, loc }) {
  const year = date.getUTCFullYear()
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)

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

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        태양이 하루 중 가장 높이 뜨는 때를 남중, 그때의 고도를 남중 고도라고 합니다.{' '}
        {loc.name}에서 계절에 따라 남중 고도와 낮의 길이가 어떻게 달라지는지 봅니다.
      </p>

      <div className="card">
        <h3>하루 동안 태양의 고도 — 계절별로 겹쳐 보기</h3>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: '100%', minWidth: 560, height: 'auto' }}
            role="img" aria-label="계절별 태양 고도 곡선">
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
        </div>
        <div className="legend" style={{ marginTop: 8 }}>
          {curves.map(c => <span key={c.ko}><i style={{ background: c.color }} />{c.ko}</span>)}
          <span><i style={{ background: 'var(--moon)' }} />오늘 ({new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(date)})</span>
        </div>
        <div className="toolrow" style={{ marginTop: 10 }}>
          <span className="mono" style={{ color: 'var(--muted)' }}>시각</span>
          <input className="slider" style={{ flex: 1 }} type="range" min="0" max="1439" step="10"
            value={minutesOfDay} onChange={e => setDate(new Date(dayKey + Number(e.target.value) * 60000))}
            aria-label="시각" />
          <b className="mono" style={{ minWidth: '4.5em', textAlign: 'right' }}>
            {String(Math.floor(minutesOfDay / 60)).padStart(2, '0')}:{String(minutesOfDay % 60).padStart(2, '0')}
          </b>
          {seasons.map(s => (
            <button key={s.key} className="btn"
              onClick={() => setDate(new Date(kstMidnight(s.date).getTime() + 12 * 3600000))}>{s.name}</button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(270px,1fr)' }}>
        <div className="card">
          <h3>일 년 동안의 남중 고도와 낮의 길이</h3>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: '100%', minWidth: 520, height: 'auto' }}
              role="img" aria-label="월별 남중 고도와 낮의 길이">
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
                  {p.month}
                </text>
              ))}
              <polyline points={okProfile.map(p => `${mx(p.month)},${myA(p.alt)}`).join(' ')}
                fill="none" stroke="var(--moon)" strokeWidth="3" />
              {okProfile.map(p => <circle key={p.month} cx={mx(p.month)} cy={myA(p.alt)} r="4" fill="var(--moon)" />)}
              <polyline points={okProfile.map(p => `${mx(p.month)},${myD(p.dayHours)}`).join(' ')}
                fill="none" stroke="var(--sky)" strokeWidth="3" strokeDasharray="6 5" />
              {okProfile.map(p => <circle key={'d' + p.month} cx={mx(p.month)} cy={myD(p.dayHours)} r="4" fill="var(--sky)" />)}
            </svg>
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            <span><i style={{ background: 'var(--moon)' }} />남중 고도 (왼쪽 눈금)</span>
            <span><i style={{ background: 'var(--sky)' }} />낮의 길이 (오른쪽 눈금)</span>
          </div>
          <p className="hint">
            두 곡선의 오르내림이 나란합니다. 남중 고도가 높은 달에 낮도 길고, 그래서 더 덥습니다.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <h3>막대의 그림자</h3>
            <svg viewBox="0 0 480 150" style={{ width: '100%', height: 'auto' }} role="img" aria-label="막대 그림자">
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
            <p className="hint">태양이 높이 뜰수록 그림자는 짧아집니다. 남중할 때 그림자가 가장 짧습니다.</p>
          </div>

          <div className="card">
            <h3>오늘 ({loc.name})</h3>
            <div className="rows">
              <div className="r"><span>일출</span><b>{fmtKST(rs.rise)}</b></div>
              <div className="r"><span>남중</span><b>{fmtKST(rs.transit)}</b></div>
              <div className="r"><span>일몰</span><b>{fmtKST(rs.set)}</b></div>
              <div className="r"><span>남중 고도</span><b>{rs.transitAlt != null ? rs.transitAlt.toFixed(1) + '°' : '—'}</b></div>
              <div className="r"><span>낮의 길이</span><b>{dayLen ? dayLen.toFixed(1) + '시간' : '—'}</b></div>
              <div className="r"><span>지금 태양 고도</span><b>{now.alt.toFixed(1)}°</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>계절이 바뀌는 까닭</h3>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.95em' }}>
          지구는 자전축이 <b>23.4° 기울어진 채로</b> 태양 둘레를 공전합니다.
          그래서 어떤 때는 우리나라가 태양 쪽으로 기울어 햇빛을 가파르게 받고(남중 고도가 높고 낮이 긴 여름),
          반대편에 오면 비스듬히 받습니다(남중 고도가 낮고 낮이 짧은 겨울).
          기울기가 없다면 일 년 내내 남중 고도가 같아 계절이 생기지 않습니다 —
          <b> 지구의 운동</b> 화면에서 기울기를 0°로 바꿔 확인해 보세요.
        </p>
      </div>
    </>
  )
}
