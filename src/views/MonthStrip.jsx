import React, { useEffect, useMemo, useRef, useState } from 'react'
import More from '../lib/More.jsx'
import MoonImage from '../lib/MoonImage.jsx'
import { useViewport, moonSize } from '../lib/useViewport.js'
import {
  Astronomy, SYNODIC, moonPhase01, phaseName, phaseTerm, TERM_TABLE, lunarDate, riseSetTransit,
  kstMidnight, addDays, fmtKST, fmtMD, searchPhase
} from '../lib/astro.js'

export default function MonthStrip({ date, setDate, obs, loc, big }) {
  const vp = useViewport()
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef(0)

  const dayKey = kstMidnight(date).getTime()

  // 이번 달의 삭(초하루)을 찾아 30일 치를 만든다
  const days = useMemo(() => {
    const back = addDays(new Date(dayKey), -SYNODIC - 1)
    let newMoon = searchPhase(0, back, 45)
    if (!newMoon) newMoon = back
    // date 를 지나치지 않는 마지막 삭
    let guard = 0
    while (guard++ < 3) {
      const nxt = searchPhase(0, addDays(newMoon, 1), 45)
      if (nxt && nxt.getTime() <= dayKey + 86400000) newMoon = nxt
      else break
    }
    const start = kstMidnight(newMoon)
    const out = []
    for (let i = 0; i < 30; i++) {
      const noon = new Date(start.getTime() + i * 86400000 + 21 * 3600000) // 그날 저녁 9시(KST)
      const rs = riseSetTransit(Astronomy.Body.Moon, obs, noon)
      out.push({
        i,
        date: noon,
        p: moonPhase01(noon),
        lib: Astronomy.Libration(noon),
        rise: rs.rise,
        set: rs.set,
        isToday: kstMidnight(noon).getTime() === dayKey
      })
    }
    return out
  }, [dayKey, loc.lat, loc.lon])

  useEffect(() => {
    const idx = days.findIndex(d => d.isToday)
    setCursor(idx >= 0 ? idx : 0)
  }, [days])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => setCursor(c => (c + 1) % days.length), 520)
    return () => clearInterval(timer.current)
  }, [playing, days.length])

  const cur = days[Math.min(cursor, days.length - 1)] || days[0]
  const bigR = moonSize(vp, big, { min: 96, max: 210 })

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: 'none' }}>
달이 보이지 않는 날(음력 1일)부터 30일을 늘어놓았습니다. 날짜를 누르면 그날로 옮겨 가고, 흐려서 못 본 날도 여기서 다시 볼 수 있습니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(250px,300px) minmax(0,1fr)' }}>
        <div className="card center" style={{ flexDirection: 'column', gap: 10 }}>
          <MoonImage size={bigR} phase={cur.p} elat={cur.lib.elat} elon={cur.lib.elon} />
          <div className="big" style={{ color: 'var(--moon)' }}>
            {phaseName(cur.p)}{phaseTerm(cur.p) && <span className="term">{phaseTerm(cur.p)}</span>}
          </div>
          <div className="rows" style={{ width: '100%' }}>
            <div className="r"><span>날짜</span><b>{fmtMD(cur.date)}</b></div>
            <div className="r"><span>음력</span><b>{lunarDate(cur.date)?.ko || '—'}</b></div>
            <div className="r"><span>월출</span><b>{fmtKST(cur.rise)}</b></div>
            <div className="r"><span>월몰</span><b>{fmtKST(cur.set)}</b></div>
          </div>
          <div className="toolrow" style={{ width: '100%' }}>
            <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
              {playing ? '멈춤' : '한 달 재생'}
            </button>
            <button className="btn" onClick={() => { setPlaying(false); setDate(cur.date) }}>
              이 날로 이동
            </button>
          </div>
        </div>

        <div className="card">
          <h3>한 달 동안 달의 모양</h3>
          <div style={{
            display: 'grid', gap: 8,
            gridTemplateColumns: 'repeat(auto-fill,minmax(' + (big ? 108 : 92) + 'px,1fr))'
          }}>
            {days.map(d => {
              const active = d.i === cursor
              const r = big ? 40 : 34
              return (
                <button key={d.i}
                  onClick={() => { setPlaying(false); setCursor(d.i) }}
                  style={{
                    background: active ? 'var(--panel-2)' : 'transparent',
                    border: '1px solid ' + (active ? 'var(--moon)' : d.isToday ? 'var(--sky)' : 'var(--line-soft)'),
                    borderRadius: 11, padding: '9px 4px 7px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  }}>
                  <MoonImage size={r} phase={d.p} elat={d.lib.elat} elon={d.lib.elon} ring={false} />
                  <span className="mono" style={{ fontSize: '.78em', color: 'var(--text-2)' }}>
                    {fmtMD(d.date)}
                  </span>
                  <span className="mono" style={{ fontSize: '.72em', color: 'var(--muted)' }}>
                    {d.rise ? fmtKST(d.rise) + ' 뜸' : '—'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="hint">
            파란 테두리가 오늘입니다. 달은 하루에 약 50분씩 늦게 뜹니다 — 목록의 월출 시각을 따라가 보세요.
          </p>
        </div>
      </div>

      <More title="무엇이 되풀이될까">
      <div className="card">
        <h3>무엇이 되풀이될까</h3>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.95em' }}>
          초승달 → 상현달 → 보름달 → 하현달 → 그믐달 → 다시 초승달.
          이 되풀이가 <b>약 30일</b>마다 한 바퀴입니다. 정확히는 {SYNODIC.toFixed(1)}일이어서, 음력 한 달은 29일 또는 30일이 됩니다.
          모양뿐 아니라 <b>뜨는 시각</b>도 규칙적으로 늦어진다는 점을 함께 보면 좋습니다.
        </p>
      </div>
      </More>
    </>
  )
}
