import React, { useEffect, useMemo, useState } from 'react'
import { REGIONS, makeObserver, fmtDateKST, kstMidnight } from './lib/astro.js'

import PhaseLab from './views/PhaseLab.jsx'
import MoonGlobe from './views/MoonGlobe.jsx'
import Tonight from './views/Tonight.jsx'
import MonthStrip from './views/MonthStrip.jsx'
import SolarSystem from './views/SolarSystem.jsx'
import StarMap from './views/StarMap.jsx'
import EarthMotion from './views/EarthMotion.jsx'
import SeasonLab from './views/SeasonLab.jsx'
import Tides from './views/Tides.jsx'
import Eclipses from './views/Eclipses.jsx'

const VIEWS = {
  phase:   { ko: '위상 만들기',  std: '[4과13-01]', C: PhaseLab },
  globe:   { ko: '달 표면',      std: '[4과13-01]', C: MoonGlobe },
  tonight: { ko: '오늘의 달',    std: '[4과13-01]', C: Tonight },
  month:   { ko: '한 달 보기',   std: '[4과13-01]', C: MonthStrip },
  solar:   { ko: '태양계',       std: '[4과13-02]', C: SolarSystem },
  stars:   { ko: '별자리',       std: '[4과13-03]', C: StarMap },
  earth:   { ko: '지구의 운동',  std: '[6과12]',    C: EarthMotion },
  season:  { ko: '계절 변화',    std: '[6과13]',    C: SeasonLab },
  tide:    { ko: '밀물·썰물',    std: '[4과06-03]', C: Tides },
  eclipse: { ko: '일식·월식',    std: '더 알아보기', extra: true, C: Eclipses }
}

const ORDER = {
  '4': ['phase', 'globe', 'tonight', 'month', 'solar', 'stars', 'tide', 'eclipse'],
  '6': ['earth', 'season', 'stars', 'solar', 'phase', 'tonight', 'tide', 'eclipse']
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem('moon-obs:' + key)
    return v == null ? fallback : JSON.parse(v)
  } catch (e) { return fallback }
}
function save(key, value) {
  try { localStorage.setItem('moon-obs:' + key, JSON.stringify(value)) } catch (e) { /* 무시 */ }
}

/** KST 기준 YYYY-MM-DD 문자열 */
function toKstInput(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date)
}

export default function App() {
  const [grade, setGrade] = useState(() => load('grade', '4'))
  const [big, setBig] = useState(() => load('big', false))
  const [locName, setLocName] = useState(() => load('locName', '서울'))
  const [custom, setCustom] = useState(() => load('custom', { lat: 37.5665, lon: 126.978 }))
  const [date, setDate] = useState(() => new Date())
  const [tab, setTab] = useState(() => ORDER[load('grade', '4')][0])

  useEffect(() => { save('grade', grade) }, [grade])
  useEffect(() => { save('big', big) }, [big])
  useEffect(() => { save('locName', locName) }, [locName])
  useEffect(() => { save('custom', custom) }, [custom])
  useEffect(() => { document.body.dataset.big = big ? 'on' : 'off' }, [big])

  const loc = useMemo(() => {
    if (locName === '직접 입력') return { name: '직접 입력', ...custom }
    return REGIONS.find(r => r.name === locName) || REGIONS[0]
  }, [locName, custom])

  const obs = useMemo(() => makeObserver(loc), [loc])
  const tabs = ORDER[grade]

  function switchGrade(g) {
    setGrade(g)
    if (!ORDER[g].includes(tab)) setTab(ORDER[g][0])
  }

  function setKstDate(str) {
    if (!str) return
    const prev = date
    const midnight = new Date(str + 'T00:00:00+09:00')
    const msInDay = prev.getTime() - kstMidnight(prev).getTime()
    setDate(new Date(midnight.getTime() + msInDay))
  }

  // 교실에서 앞에 서서 넘기기 좋도록 키보드로도 날짜를 옮긴다
  useEffect(() => {
    function onKey(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const stepMs = e.shiftKey ? 3600000 : 86400000
      setDate(d => new Date(d.getTime() + dir * stepMs))
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const View = VIEWS[tab].C
  const ctx = { date, setDate, loc, obs, grade, big, goTo: setTab }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <svg width="26" height="26" viewBox="-13 -13 26 26" aria-hidden="true">
            <circle r="12" fill="var(--shadow-side)" />
            <path d="M0,-12 A12,12 0 0 1 0,12 A4.6,12 0 0 1 0,-12" fill="var(--moon)" />
          </svg>
          <div>
            <b>달 관찰소</b>{' '}
            <small>초등 과학 밤하늘 시뮬레이터</small>
          </div>
        </div>

        <div className="seg" role="group" aria-label="학년 모드">
          <button onClick={() => switchGrade('4')} aria-pressed={grade === '4'}>4학년</button>
          <button onClick={() => switchGrade('6')} aria-pressed={grade === '6'}>6학년</button>
        </div>

        <label className="ctl">
          날짜
          <input type="date" value={toKstInput(date)} onChange={e => setKstDate(e.target.value)} />
        </label>
        <button className="btn" onClick={() => setDate(new Date())}>지금</button>

        <label className="ctl">
          위치
          <select value={locName} onChange={e => setLocName(e.target.value)}>
            {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            <option value="직접 입력">직접 입력</option>
          </select>
        </label>
        {locName === '직접 입력' && (
          <label className="ctl">
            위도<input type="number" step="0.01" style={{ width: 74 }} value={custom.lat}
              onChange={e => setCustom({ ...custom, lat: Number(e.target.value) })} />
            경도<input type="number" step="0.01" style={{ width: 82 }} value={custom.lon}
              onChange={e => setCustom({ ...custom, lon: Number(e.target.value) })} />
          </label>
        )}

        <div className="spacer" />
        <button className={'btn' + (big ? ' on' : '')} onClick={() => setBig(!big)}
          title="전자칠판에서 뒷자리까지 보이도록 글씨를 키웁니다">큰 글씨</button>
      </div>

      <div className="tabs" role="tablist">
        <span className="grp">{grade === '4' ? '4학년 · 밤하늘 관찰' : '6학년 · 지구의 운동'}</span>
        {tabs.map(id => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {VIEWS[id].ko}
          </button>
        ))}
      </div>

      <main>
        <div className="view">
          <div className="vhead">
            <h2>{VIEWS[tab].ko}<span className={VIEWS[tab].extra ? 'std extra' : 'std'}>{VIEWS[tab].std}</span></h2>
            <p className="mono" style={{ color: 'var(--muted)' }}>
              {fmtDateKST(date)} · {loc.name} (북위 {loc.lat.toFixed(2)}° 동경 {loc.lon.toFixed(2)}°)
            </p>
          </div>
          <View {...ctx} />

          <footer style={{
            marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--line)',
            color: 'var(--muted)', fontSize: '.82em', display: 'flex', gap: '6px 18px', flexWrap: 'wrap'
          }}>
            <span>달 표면 이미지 · 높낮이 자료: NASA/GSFC/Arizona State University (LRO)</span>
            <span>천체 위치 계산: astronomy-engine</span>
            <span>2022 개정 과학과 교육과정 기준</span>
            <span className="kbdhint" style={{ marginLeft: 'auto' }}>
              <kbd>←</kbd><kbd>→</kbd> 하루씩 <kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> 한 시간씩
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}
