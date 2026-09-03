/* 달 모양(위상) 그리기 · 달 표면 지형 자료 */

/**
 * 위상 p(0=삭, 0.25=상현, 0.5=보름, 0.75=하현)에서 밝게 보이는 부분의 SVG path.
 * 북반구에서 본 모습 — 차오를 때 오른쪽이 밝다.
 */
export function moonPathD(r, p) {
  const x = ((p % 1) + 1) % 1
  const c = Math.cos(2 * Math.PI * x)
  const rx = Math.max(Math.abs(r * c), 0.0001)
  if (x < 0.5) {
    const sw = c > 0 ? 0 : 1
    return `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${sw} 0,${-r}`
  }
  const sw = c > 0 ? 1 : 0
  return `M0,${-r} A${r},${r} 0 0 0 0,${r} A${rx},${r} 0 0 ${sw} 0,${-r}`
}

/* ---------- 달 표면의 이름난 곳 (셀레노그래픽 위도·경도) ---------- */
export const FEATURES = [
  { ko: '고요의 바다',   en: 'Mare Tranquillitatis', lat: 8.5,  lon: 31.4,  kind: 'mare' },
  { ko: '맑음의 바다',   en: 'Mare Serenitatis',     lat: 28.0, lon: 17.5,  kind: 'mare' },
  { ko: '비의 바다',     en: 'Mare Imbrium',         lat: 32.8, lon: -15.6, kind: 'mare' },
  { ko: '폭풍의 대양',   en: 'Oceanus Procellarum',  lat: 18.4, lon: -57.4, kind: 'mare' },
  { ko: '위난의 바다',   en: 'Mare Crisium',         lat: 17.0, lon: 59.1,  kind: 'mare' },
  { ko: '구름의 바다',   en: 'Mare Nubium',          lat: -21.3, lon: -16.6, kind: 'mare' },
  { ko: '티코 크레이터', en: 'Tycho',                lat: -43.3, lon: -11.4, kind: 'crater' },
  { ko: '코페르니쿠스',  en: 'Copernicus',           lat: 9.6,  lon: -20.1, kind: 'crater' },
  { ko: '케플러',        en: 'Kepler',               lat: 8.1,  lon: -38.0, kind: 'crater' },
  { ko: '아폴로 11호 착륙지', en: 'Apollo 11',       lat: 0.67, lon: 23.47, kind: 'apollo' },
  { ko: '아폴로 15호 착륙지', en: 'Apollo 15',       lat: 26.13, lon: 3.63, kind: 'apollo' },
  { ko: '남극-에이트켄 분지', en: 'South Pole-Aitken', lat: -53, lon: 169,  kind: 'far' }
]

export const FEATURE_KIND = {
  mare: { label: '바다(어두운 평원)', color: '#F2C879' },
  crater: { label: '크레이터', color: '#F2C879' },
  apollo: { label: '사람이 내린 곳', color: '#5FA3FF' },
  far: { label: '뒷면 — 지구에서 안 보임', color: '#8E97B4' }
}

/** 텍스처(정사각도법)와 같은 규칙으로 위도·경도를 구면 좌표로 */
export function lonLatToVec3(lon, lat, r = 1) {
  const phi = (2 * Math.PI * (lon + 180)) / 360
  const theta = (Math.PI * (90 - lat)) / 180
  return [
    -r * Math.sin(theta) * Math.cos(phi),
    r * Math.cos(theta),
    r * Math.sin(theta) * Math.sin(phi)
  ]
}
