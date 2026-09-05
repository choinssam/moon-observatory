import React, { useEffect, useMemo, useRef, useState } from 'react'
import MoonImage from '../lib/MoonImage.jsx'
import { useFit } from '../lib/useFit.js'
import {
  Astronomy, SYNODIC, moonPhase01, phaseName, phaseTerm, lunarDate, riseSetTransit,
  kstMidnight, addDays, fmtKST, fmtMD, searchPhase
} from '../lib/astro.js'

export default function MonthStrip({ date, setDate, obs, loc, big }) {
  const rootRef = useRef(null)
  const box = useFit(rootRef)
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

  /* 배치: [고른 날의 달 — 정사각형] [그날의 자료 + 30일 목록]. 목록 칸은 정사각형 높이를 꽉 채운다 */
  const gap = 14
  const wide = box.w >= 900
  const sq = wide ? Math.min(box.h, Math.round(box.w * 0.42)) : Math.min(box.w, Math.round(box.h * 0.5))
  const rightW = wide ? box.w - sq - gap : box.w
  const cols = rightW >= 980 ? 10 : rightW >= 620 ? 6 : 5
  const rows = Math.ceil(days.length / cols)
  const cellW = (rightW - 34 - (cols - 1) * 8) / cols
  const gridH = wide ? sq - 96 - gap - 74 : 0                 // 자료 칸·제목·안내문을 뺀 높이
  const cellH = wide ? (gridH - (rows - 1) * 8) / rows : cellW + 44
  const icon = Math.round(Math.max(30, Math.min(cellW * 0.74, cellH - 50, 140)))
  const bigR = Math.round(sq * (big ? 0.78 : 0.74))

  return (
    <div ref={rootRef} className={'fit month ' + (wide ? 'wide' : 'narrow')}
      style={wide ? { gridTemplateColumns: `${sq}px minmax(0,1fr)`, height: sq } : undefined}>
      {/* 왼쪽 — 고른 날의 달만 크게 */}
      <div className="stage center" style={{ width: sq, height: sq, margin: wide ? 0 : '0 auto', background: '#05070E' }}>
        <MoonImage size={bigR} phase={cur.p} elat={cur.lib.elat} elon={cur.lib.elon} />
        <div className="cap">{fmtMD(cur.date)} 저녁 9시의 달 · {lunarDate(cur.date)?.ko || ''}</div>
        <div className="cap name" style={{ top: 'auto', bottom: 12, fontSize: '1.15em', color: 'var(--moon)' }}>
          {phaseName(cur.p)}{phaseTerm(cur.p) && <small style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.7em' }}>{phaseTerm(cur.p)}</small>}
        </div>
        <div className="cap bottom right">{cur.rise ? '월출 ' + fmtKST(cur.rise) : ''}{cur.set ? ' · 월몰 ' + fmtKST(cur.set) : ''}</div>
      </div>

      {/* 오른쪽 — 그날의 자료와 한 달 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0, minHeight: 0 }}>
        <div className="card month-head">
          <div className="facts" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))', flex: '1 1 320px' }}>
            {[['날짜', fmtMD(cur.date)], ['음력', lunarDate(cur.date)?.ko || '—'],
              ['월출', fmtKST(cur.rise)], ['월몰', fmtKST(cur.set)]].map(([k, v]) => (
              <div key={k} className="fact">
                <div className="fact-k">{k}</div>
                <div className="fact-v">{v}</div>
              </div>
            ))}
          </div>
          <div className="toolrow">
            <button className={'btn' + (playing ? ' on' : '')} onClick={() => setPlaying(!playing)}>
              {playing ? '■ 멈춤' : '▶ 한 달 재생'}
            </button>
            <button className="btn" onClick={() => { setPlaying(false); setDate(cur.date) }}>
              이 날로 이동
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <h3>한 달 동안 달의 모양
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>
              달이 보이지 않는 날(음력 1일)부터 30일 · 날짜를 누르면 그날의 달
            </span>
          </h3>
          <div className="month-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {days.map(d => {
              const active = d.i === cursor
              return (
                <button key={d.i} className={'day' + (active ? ' on' : '') + (d.isToday ? ' today' : '')}
                  onClick={() => { setPlaying(false); setCursor(d.i) }}>
                  <MoonImage size={icon} phase={d.p} elat={d.lib.elat} elon={d.lib.elon} ring={false} />
                  <span className="mono day-md">{fmtMD(d.date)}</span>
                  <span className="mono day-rise">{d.rise ? fmtKST(d.rise) + ' 뜸' : '—'}</span>
                </button>
              )
            })}
          </div>
          <p className="hint" style={{ margin: '8px 0 0' }}>
            파란 테두리가 오늘입니다. 달은 하루에 약 50분씩 늦게 뜹니다. 목록의 월출 시각을 따라가 보세요.
            초승달, 상현달, 보름달, 하현달, 그믐달이 <b>약 30일</b>({SYNODIC.toFixed(1)}일)마다 되풀이되고, 음력 한 달은 29일 또는 30일이 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
