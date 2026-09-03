import * as A from 'astronomy-engine'

export const SYNODIC = 29.530588853          // 삭망월(일)
export const KST_MIN = 9 * 60                // 한국 표준시 UTC+9

export const REGIONS = [
  { name: '서울',   lat: 37.5665, lon: 126.9780 },
  { name: '인천',   lat: 37.4563, lon: 126.7052 },
  { name: '수원',   lat: 37.2636, lon: 127.0286 },
  { name: '춘천',   lat: 37.8813, lon: 127.7298 },
  { name: '강릉',   lat: 37.7519, lon: 128.8761 },
  { name: '대전',   lat: 36.3504, lon: 127.3845 },
  { name: '청주',   lat: 36.6424, lon: 127.4890 },
  { name: '전주',   lat: 35.8242, lon: 127.1480 },
  { name: '광주',   lat: 35.1595, lon: 126.8526 },
  { name: '대구',   lat: 35.8714, lon: 128.6014 },
  { name: '울산',   lat: 35.5384, lon: 129.3114 },
  { name: '부산',   lat: 35.1796, lon: 129.0756 },
  { name: '창원',   lat: 35.2278, lon: 128.6817 },
  { name: '제주',   lat: 33.4996, lon: 126.5312 }
]

export function makeObserver(loc) {
  return new A.Observer(loc.lat, loc.lon, 30)
}

/* ---------- 시각 다루기 (모두 KST 기준으로 표시) ---------- */

export function fmtKST(date, withDate = false) {
  if (!date) return '—'
  const opt = { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  if (withDate) { opt.month = 'numeric'; opt.day = 'numeric' }
  return new Intl.DateTimeFormat('ko-KR', opt).format(date)
}

export function fmtMD(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric'
  }).format(date)
}

export function fmtDateKST(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  }).format(date)
}

/** KST 기준 그날의 0시(=UTC 시각)를 돌려준다 */
export function kstMidnight(date) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date)
  return new Date(s + 'T00:00:00+09:00')
}

export function addDays(date, d) {
  return new Date(date.getTime() + d * 86400000)
}

/* ---------- 달 ---------- */

/** 0=삭, 0.25=상현, 0.5=보름, 0.75=하현 */
export function moonPhase01(date) {
  return A.MoonPhase(date) / 360
}

/** 밝게 보이는 부분의 비율 0~1 */
export function moonIllum(date) {
  return A.Illumination(A.Body.Moon, date).phase_fraction
}

/** 삭 이후 지난 날 수 (달의 나이) */
export function moonAge(date) {
  return moonPhase01(date) * SYNODIC
}

export function phaseName(p) {
  const x = ((p % 1) + 1) % 1
  if (x < 0.021 || x > 0.979) return '삭 (그믐)'
  if (x < 0.229) return '초승달'
  if (x < 0.271) return '상현달'
  if (x < 0.479) return '차오르는 볼록달'
  if (x < 0.521) return '보름달'
  if (x < 0.729) return '기우는 볼록달'
  if (x < 0.771) return '하현달'
  return '그믐달'
}

/** 관측 안내 문구 */
export function phaseTip(p) {
  const x = ((p % 1) + 1) % 1
  if (x < 0.021 || x > 0.979) return '태양과 같은 방향에 있어 달을 볼 수 없습니다.'
  if (x < 0.271) return '해가 진 직후 서쪽 하늘 낮은 곳에서 잠깐 보입니다.'
  if (x < 0.479) return '해질 무렵 남쪽 하늘에 떠 있어 초저녁 관찰이 가장 좋습니다.'
  if (x < 0.521) return '해가 지면 동쪽에서 떠올라 밤새도록 보입니다.'
  if (x < 0.729) return '늦은 밤에 동쪽에서 떠오릅니다.'
  if (x < 0.771) return '한밤중에 떠서 새벽에 남쪽 하늘 높이 보입니다.'
  return '새벽 동쪽 하늘에서만 잠깐 보입니다.'
}

/** 특정 위상(도)이 되는 다음 시각 */
export function searchPhase(deg, startDate, limitDays = 40) {
  const t = A.SearchMoonPhase(deg, startDate, limitDays)
  return t ? t.date : null
}

/* ---------- 뜨고 지는 시각 · 방위 · 고도 ---------- */

export function riseSetTransit(body, obs, date) {
  const start = kstMidnight(date)
  const rise = A.SearchRiseSet(body, obs, +1, start, 1)
  const set = A.SearchRiseSet(body, obs, -1, start, 1)
  let tr = null
  try { tr = A.SearchHourAngle(body, obs, 0, start) } catch (e) { tr = null }
  return {
    rise: rise ? rise.date : null,
    set: set ? set.date : null,
    transit: tr ? tr.time.date : null,
    transitAlt: tr ? tr.hor.altitude : null
  }
}

export function horizonOf(body, obs, date) {
  const eq = A.Equator(body, date, obs, true, true)
  const h = A.Horizon(date, obs, eq.ra, eq.dec, 'normal')
  return { az: h.azimuth, alt: h.altitude, ra: eq.ra, dec: eq.dec }
}

/** 하루 동안의 궤적 (KST 0시부터) */
export function dayTrack(body, obs, date, stepMin = 10) {
  return trackFrom(body, obs, kstMidnight(date), 24 * 60, stepMin)
}

/** 임의의 시각부터 minutes 분 동안의 궤적 */
export function trackFrom(body, obs, start, minutes, stepMin = 10) {
  const out = []
  for (let m = 0; m <= minutes; m += stepMin) {
    const t = new Date(start.getTime() + m * 60000)
    const h = horizonOf(body, obs, t)
    out.push({ t, min: m, az: h.az, alt: h.alt })
  }
  return out
}

/**
 * '오늘 밤'을 담는 24시간 창의 시작(=낮 12시).
 * 정오 이전이면 전날 낮 12시부터 본다.
 */
export function nightWindowStart(date) {
  const mid = kstMidnight(date)
  const noon = new Date(mid.getTime() + 12 * 3600000)
  return date.getTime() < noon.getTime() ? new Date(noon.getTime() - 86400000) : noon
}

export function azName(az) {
  const names = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return names[Math.round(((az % 360) + 360) % 360 / 45) % 8]
}

/* ---------- 6학년: 계절 · 태양 고도 ---------- */

export function yearSunProfile(obs, year) {
  const out = []
  for (let m = 0; m < 12; m++) {
    const d = new Date(Date.UTC(year, m, 15, 3, 0, 0))
    const { rise, set, transitAlt } = riseSetTransit(A.Body.Sun, obs, d)
    const dayHours = rise && set ? Math.abs(set - rise) / 3600000 : null
    out.push({ month: m + 1, alt: transitAlt, dayHours })
  }
  return out
}

export function seasonsOf(year) {
  const s = A.Seasons(year)
  return [
    { key: 'mar', name: '춘분', date: s.mar_equinox.date },
    { key: 'jun', name: '하지', date: s.jun_solstice.date },
    { key: 'sep', name: '추분', date: s.sep_equinox.date },
    { key: 'dec', name: '동지', date: s.dec_solstice.date }
  ]
}

/** 태양에서 본 지구의 공전 위치(도) */
export function earthOrbitAngle(date) {
  return A.Ecliptic(A.HelioVector(A.Body.Earth, date)).elon
}

/* ---------- 태양계 ---------- */

export const PLANETS = [
  { body: A.Body.Mercury, ko: '수성', color: '#B7ADA0', au: 0.387, dia: 4879 },
  { body: A.Body.Venus,   ko: '금성', color: '#E6C68A', au: 0.723, dia: 12104 },
  { body: A.Body.Earth,   ko: '지구', color: '#4E8FDD', au: 1.000, dia: 12756 },
  { body: A.Body.Mars,    ko: '화성', color: '#D9744B', au: 1.524, dia: 6792 },
  { body: A.Body.Jupiter, ko: '목성', color: '#D8B48C', au: 5.203, dia: 142984 },
  { body: A.Body.Saturn,  ko: '토성', color: '#E3D19B', au: 9.537, dia: 120536 },
  { body: A.Body.Uranus,  ko: '천왕성', color: '#8ED3E0', au: 19.19, dia: 51118 },
  { body: A.Body.Neptune, ko: '해왕성', color: '#5A78D8', au: 30.07, dia: 49528 }
]

export function planetXY(p, date) {
  const e = A.Ecliptic(A.HelioVector(p.body, date))
  const a = e.elon * Math.PI / 180
  const r = Math.hypot(e.vec.x, e.vec.y, e.vec.z)
  return { x: r * Math.cos(a), y: r * Math.sin(a), r, elon: e.elon }
}

/* ---------- 일식 · 월식 ---------- */

export function nextEclipses(date, count = 3) {
  const out = { lunar: [], solar: [] }
  try {
    let e = A.SearchLunarEclipse(date)
    for (let i = 0; i < count; i++) { out.lunar.push(e); e = A.NextLunarEclipse(e.peak) }
  } catch (err) { /* 계산 불가 */ }
  try {
    let s = A.SearchGlobalSolarEclipse(date)
    for (let i = 0; i < count; i++) { out.solar.push(s); s = A.NextGlobalSolarEclipse(s.peak) }
  } catch (err) { /* 계산 불가 */ }
  return out
}

export const ECLIPSE_KIND = { penumbral: '반영월식', partial: '부분', total: '개기', annular: '금환' }

export { A as Astronomy }
