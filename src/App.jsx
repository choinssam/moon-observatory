import React, { useEffect, useMemo, useState } from 'react'
import { REGIONS, makeObserver, fmtDateKST, kstMidnight } from './lib/astro.js'

import Feedback from './lib/Feedback.jsx'
import { ExpandAll } from './lib/More.jsx'
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

/* 2022 개정 과학과 교육과정 (교육부 고시 제2022-33호 [별책 9]) 성취기준 원문 */
export const STD = {
  '4과13-01': '달의 모양과 표면, 달의 위상변화를 관찰하여 밤하늘 관찰에 흥미를 가질 수 있다.',
  '4과13-02': '태양계 구성원을 알고, 태양과 행성을 조사할 수 있다.',
  '4과13-03': '별의 정의를 알고, 북극성 주변의 별자리를 관찰할 수 있다.',
  '4과06-03': '밀물과 썰물의 차이를 알고, 갯벌의 가치와 보전의 필요성을 설득·홍보할 수 있다.',
  '6과12-01': '하루 동안 태양과 별을 관찰하여 위치 변화의 규칙성을 찾을 수 있다.',
  '6과12-02': '지구의 자전을 알고, 낮과 밤이 생기는 이유를 설명할 수 있다.',
  '6과12-03': '지구의 공전을 알고, 계절에 따라 달라지는 별자리를 관찰할 수 있다.',
  '6과13-01': '태양 고도 측정기로 하루 동안 태양 고도, 그림자 길이, 기온을 측정하여 이들의 관계를 찾을 수 있다.',
  '6과13-02': '계절에 따른 태양의 남중 고도와 낮의 길이 사이의 관계를 자료에 근거하여 추론할 수 있다.',
  '6과13-03': '계절 변화의 원인을 지구의 자전축이 기울어진 채 공전하는 것으로 설명할 수 있다.'
}

/* 학년에 따라 이름·성취기준이 달라진다. std 가 빈 학년에서는 '더 알아보기' */
const VIEWS = {
  phase:   { ko: '위상 만들기',  std: { 4: ['4과13-01'], 6: [] }, C: PhaseLab },
  globe:   { ko: '달 표면',      std: { 4: ['4과13-01'] }, C: MoonGlobe },
  tonight: { ko: { 4: '오늘의 달', 6: '하루의 태양과 달' }, std: { 4: ['4과13-01'], 6: ['6과12-01'] }, C: Tonight },
  month:   { ko: '한 달 보기',   std: { 4: ['4과13-01'] }, C: MonthStrip },
  solar:   { ko: '태양계',       std: { 4: ['4과13-02'] }, C: SolarSystem },
  stars:   { ko: { 4: '별자리', 6: '계절별 별자리' }, std: { 4: ['4과13-03'], 6: ['6과12-01', '6과12-03'] }, C: StarMap },
  earth:   { ko: '지구의 운동',  std: { 6: ['6과12-02', '6과12-03'] }, C: EarthMotion },
  season:  { ko: '계절 변화',    std: { 6: ['6과13-01', '6과13-02', '6과13-03'] }, C: SeasonLab },
  tide:    { ko: '밀물·썰물',    std: { 4: ['4과06-03'] }, C: Tides },
  eclipse: { ko: '일식·월식',    std: {}, C: Eclipses }
}
const koOf = (id, g) => typeof VIEWS[id].ko === 'string' ? VIEWS[id].ko : VIEWS[id].ko[g]
const stdOf = (id, g) => VIEWS[id].std[g] || []

const ORDER = {
  '4': ['phase', 'globe', 'tonight', 'month', 'solar', 'stars', 'tide', 'eclipse'],
  '6': ['earth', 'tonight', 'stars', 'season', 'phase', 'eclipse']
}
const GROUP = {
  '4': '4학년 · 밤하늘 관찰 [4과13] · 지구와 바다 [4과06]',
  '6': '6학년 · 지구의 운동 [6과12] · 계절의 변화 [6과13]'
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
  const [feedback, setFeedback] = useState(false)
  const [expand, setExpand] = useState(() => load('expand', false))
  const [locName, setLocName] = useState(() => load('locName', '서울'))
  const [custom, setCustom] = useState(() => load('custom', { lat: 37.5665, lon: 126.978 }))
  const [date, setDate] = useState(() => new Date())
  const [tab, setTab] = useState(() => ORDER[load('grade', '4')][0])

  useEffect(() => { save('grade', grade) }, [grade])
  useEffect(() => { save('big', big) }, [big])
  useEffect(() => { save('expand', expand) }, [expand])
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
        <button className={'btn' + (expand ? ' on' : '')} onClick={() => setExpand(!expand)}
          title="접어 둔 설명을 모두 펼칩니다">설명 펼치기</button>
        <button className={'btn' + (big ? ' on' : '')} onClick={() => setBig(!big)}
          title="전자칠판에서 뒷자리까지 보이도록 글씨를 키웁니다">큰 글씨</button>
      </div>

      <div className="tabs" role="tablist">
        <span className="grp">{GROUP[grade]}</span>
        {tabs.map(id => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={stdOf(id, grade).length ? '' : 'extra'}
            title={stdOf(id, grade).length ? stdOf(id, grade).join(' ') : '성취기준 밖 · 더 알아보기'}>
            {koOf(id, grade)}
          </button>
        ))}
      </div>

      <main>
        <div className="view">
          <div className="vhead">
            <h2>{koOf(tab, grade)}
              {stdOf(tab, grade).length
                ? stdOf(tab, grade).map(c => <span key={c} className="std">[{c}]</span>)
                : <span className="std extra">더 알아보기</span>}
            </h2>
            <p className="mono" style={{ color: 'var(--muted)' }}>
              {fmtDateKST(date)} · {loc.name} (북위 {loc.lat.toFixed(2)}° 동경 {loc.lon.toFixed(2)}°)
            </p>
            {stdOf(tab, grade).length > 0 && (
              <details className="stdbox">
                <summary>성취기준 보기</summary>
                <ul className="stdlist">
                  {stdOf(tab, grade).map(c => <li key={c}><b>[{c}]</b> {STD[c]}</li>)}
                </ul>
              </details>
            )}
          </div>
          <ExpandAll.Provider value={expand}><View {...ctx} /></ExpandAll.Provider>

          <footer style={{
            marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--line)',
            color: 'var(--muted)', fontSize: '.82em',
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
            <div style={{ display: 'flex', gap: '6px 18px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-2)' }}>
                만든 사람 <b style={{ color: 'var(--moon)' }}>초인쌤</b>
              </span>
              <span>
                문의 ·{' '}
                <button className="linklike" onClick={() => setFeedback(true)}>초인쌤에게 의견 보내기</button>
              </span>
              <span className="kbdhint" style={{ marginLeft: 'auto' }}>
                <kbd>←</kbd><kbd>→</kbd> 하루씩 <kbd>Shift</kbd>+<kbd>←</kbd><kbd>→</kbd> 한 시간씩
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px 18px', flexWrap: 'wrap' }}>
              <span>달 표면 이미지 · 높낮이 자료: NASA/GSFC/Arizona State University (LRO)</span>
              <span>천체 위치 계산: astronomy-engine</span>
              <span>2022 개정 과학과 교육과정 기준</span>
              <span>
                <a href="https://github.com/choinssam/moon-observatory/blob/main/LICENSE"
                  target="_blank" rel="noreferrer" style={{ color: 'var(--muted)' }}>
                  CC BY-NC-SA 4.0
                </a>
              </span>
            </div>
          </footer>

          {feedback && (
            <Feedback onClose={() => setFeedback(false)}
              screen={koOf(tab, grade)} grade={grade} date={date} loc={loc} />
          )}
        </div>
      </main>
    </div>
  )
}
