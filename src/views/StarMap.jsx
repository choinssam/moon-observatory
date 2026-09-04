import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Astronomy, kstMidnight, fmtKST } from '../lib/astro.js'
import { useViewport } from '../lib/useViewport.js'

/* ---------- 별 자료: 적경(시), 적위(도), 밝기. lbl 은 이름을 붙일 별 ---------- */
const UMA = [
  { ko: '두베', ra: 11.062, dec: 61.751, m: 1.8, pointer: true },
  { ko: '메라크', ra: 11.031, dec: 56.382, m: 2.3, pointer: true },
  { ko: '페크다', ra: 11.897, dec: 53.695, m: 2.4 },
  { ko: '메그레즈', ra: 12.257, dec: 57.033, m: 3.3 },
  { ko: '알리오트', ra: 12.900, dec: 55.960, m: 1.8 },
  { ko: '미자르', ra: 13.399, dec: 54.925, m: 2.2 },
  { ko: '알카이드', ra: 13.792, dec: 49.313, m: 1.9 }
]
const CAS = [
  { ko: '카프', ra: 0.153, dec: 59.150, m: 2.3 },
  { ko: '쉐다르', ra: 0.675, dec: 56.537, m: 2.2 },
  { ko: '감마', ra: 0.945, dec: 60.717, m: 2.5 },
  { ko: '루크바', ra: 1.430, dec: 60.235, m: 2.7 },
  { ko: '세긴', ra: 1.906, dec: 63.670, m: 3.4 }
]
const UMI = [
  { ko: '북극성', ra: 2.530, dec: 89.264, m: 2.0, polaris: true },
  { ko: '델타', ra: 17.537, dec: 86.586, m: 4.4 },
  { ko: '엡실론', ra: 16.766, dec: 82.037, m: 4.2 },
  { ko: '제타', ra: 15.734, dec: 77.794, m: 4.3 },
  { ko: '코카브', ra: 14.845, dec: 74.155, m: 2.1 },
  { ko: '페르카드', ra: 15.345, dec: 71.834, m: 3.0 },
  { ko: '에타', ra: 16.291, dec: 75.755, m: 5.0 }
]
/* 봄 */
const LEO = [
  { ko: '레굴루스', ra: 10.140, dec: 11.967, m: 1.4, lbl: true },
  { ko: '에타', ra: 10.122, dec: 16.763, m: 3.5 },
  { ko: '알기에바', ra: 10.333, dec: 19.842, m: 2.0 },
  { ko: '아드하페라', ra: 10.278, dec: 23.417, m: 3.4 },
  { ko: '라스엘라세드', ra: 9.879, dec: 26.007, m: 3.0 },
  { ko: '조스마', ra: 11.235, dec: 20.524, m: 2.6 },
  { ko: '데네볼라', ra: 11.818, dec: 14.572, m: 2.1, lbl: true },
  { ko: '코르트', ra: 11.237, dec: 15.430, m: 3.3 }
]
const SPRING_ARC = [
  { ko: '알카이드', ra: 13.792, dec: 49.313, m: 1.9 },
  { ko: '아르크투루스', ra: 14.261, dec: 19.182, m: 0.0, lbl: true },
  { ko: '스피카', ra: 13.420, dec: -11.161, m: 1.0, lbl: true }
]
/* 여름 */
const CYG = [
  { ko: '데네브', ra: 20.690, dec: 45.280, m: 1.3, lbl: true },
  { ko: '사드르', ra: 20.370, dec: 40.257, m: 2.2 },
  { ko: '알비레오', ra: 19.512, dec: 27.960, m: 3.1 },
  { ko: '기에나', ra: 20.770, dec: 33.970, m: 2.5 },
  { ko: '델타', ra: 19.750, dec: 45.131, m: 2.9 }
]
const SUMMER_TRI = [
  { ko: '베가', ra: 18.616, dec: 38.784, m: 0.0, lbl: true },
  { ko: '데네브', ra: 20.690, dec: 45.280, m: 1.3 },
  { ko: '알타이르', ra: 19.846, dec: 8.868, m: 0.8, lbl: true }
]
/* 가을 */
const PEG = [
  { ko: '마르카브', ra: 23.079, dec: 15.205, m: 2.5 },
  { ko: '셰아트', ra: 23.063, dec: 28.083, m: 2.4 },
  { ko: '알게니브', ra: 0.220, dec: 15.183, m: 2.8 },
  { ko: '알페라츠', ra: 0.140, dec: 29.091, m: 2.1, lbl: true }
]
/* 겨울 */
const ORI = [
  { ko: '베텔게우스', ra: 5.919, dec: 7.407, m: 0.5, lbl: true },
  { ko: '벨라트릭스', ra: 5.419, dec: 6.350, m: 1.6 },
  { ko: '민타카', ra: 5.533, dec: -0.299, m: 2.2 },
  { ko: '알닐람', ra: 5.604, dec: -1.202, m: 1.7 },
  { ko: '알니타크', ra: 5.679, dec: -1.943, m: 1.8 },
  { ko: '사이프', ra: 5.796, dec: -9.670, m: 2.1 },
  { ko: '리겔', ra: 5.242, dec: -8.202, m: 0.1, lbl: true }
]
const WINTER_TRI = [
  { ko: '베텔게우스', ra: 5.919, dec: 7.407, m: 0.5 },
  { ko: '시리우스', ra: 6.752, dec: -16.716, m: -1.5, lbl: true },
  { ko: '프로키온', ra: 7.655, dec: 5.225, m: 0.4, lbl: true }
]

const GROUPS = [
  { key: 'uma', ko: '북두칠성', season: 'circ', color: '#F2C879', stars: UMA, links: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
  { key: 'cas', ko: '카시오페이아자리', season: 'circ', color: '#8ED3E0', stars: CAS, links: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { key: 'umi', ko: '작은곰자리', season: 'circ', color: '#B7C0DA', stars: UMI, links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { key: 'leo', ko: '사자자리 (봄)', season: '봄', color: '#9FD98A', stars: LEO, links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [7, 0]] },
  { key: 'sarc', ko: '봄철 대곡선', season: '봄', color: '#9FD98A', stars: SPRING_ARC, links: [[0, 1], [1, 2]], dashed: true },
  { key: 'cyg', ko: '백조자리 (여름)', season: '여름', color: '#8ED3E0', stars: CYG, links: [[0, 1], [1, 2], [3, 1], [1, 4]] },
  { key: 'stri', ko: '여름철 대삼각형', season: '여름', color: '#8ED3E0', stars: SUMMER_TRI, links: [[0, 1], [1, 2], [2, 0]], dashed: true },
  { key: 'peg', ko: '페가수스자리 (가을)', season: '가을', color: '#E0B58E', stars: PEG, links: [[0, 1], [1, 3], [3, 2], [2, 0]] },
  { key: 'ori', ko: '오리온자리 (겨울)', season: '겨울', color: '#B9C7FF', stars: ORI, links: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [5, 6]] },
  { key: 'wtri', ko: '겨울철 대삼각형', season: '겨울', color: '#B9C7FF', stars: WINTER_TRI, links: [[0, 1], [1, 2], [2, 0]], dashed: true }
]
const SEASONS = [['봄', '04-15'], ['여름', '07-15'], ['가을', '10-15'], ['겨울', '01-15']]

const RAD = Math.PI / 180
const SKY_R = 100                                   // 별을 붙이는 하늘 구의 반지름

/* 적경·적위 → 관측자가 보는 방향 벡터 (x=동, y=위, z=-북) */
function dirOf(raH, decD, lstH, latD, out) {
  const Hh = ((lstH - raH) * 15) * RAD
  const d = decD * RAD, phi = latD * RAD
  const cd = Math.cos(d), sd = Math.sin(d)
  const x = -cd * Math.sin(Hh)
  const y = sd * Math.sin(phi) + cd * Math.cos(phi) * Math.cos(Hh)
  const z = -(sd * Math.cos(phi) - cd * Math.sin(phi) * Math.cos(Hh))
  return out.set(x, y, z)
}
function lstOf(date, lon) {
  return ((Astronomy.SiderealTime(date) + lon / 15) % 24 + 24) % 24
}

/* 배경 별 — 한 번 만들어 두고 매번 같은 자리에서 돌린다 */
const BG = (() => {
  let s = 20240903
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
  const list = []
  for (let i = 0; i < 1400; i++) {
    const ra = rnd() * 24
    const dec = Math.asin(rnd() * 2 - 1) / RAD
    const m = 2 + rnd() * 4
    list.push({ ra, dec, m })
  }
  return list
})()

function discTexture(ring) {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')
  if (ring) {
    g.strokeStyle = '#F2C879'; g.lineWidth = 4
    g.beginPath(); g.arc(32, 32, 24, 0, Math.PI * 2); g.stroke()
  } else {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.35, 'rgba(255,255,255,.95)')
    grd.addColorStop(0.6, 'rgba(255,255,255,.25)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64)
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}
function skyTexture(dark) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  if (dark) {
    grd.addColorStop(0, '#04061A'); grd.addColorStop(0.36, '#0A1030')
    grd.addColorStop(0.5, '#1B2B55'); grd.addColorStop(0.52, '#0B1020'); grd.addColorStop(1, '#05070E')
  } else {
    grd.addColorStop(0, '#1A3466'); grd.addColorStop(0.36, '#2D4F8E')
    grd.addColorStop(0.5, '#6C8FC9'); grd.addColorStop(0.52, '#141B2E'); grd.addColorStop(1, '#0A0D18')
  }
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function StarMap({ date, setDate, obs, loc, grade }) {
  const hostRef = useRef(null)
  const layerRef = useRef(null)
  const vp = useViewport()
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)
  const [fs, setFs] = useState(false)
  const six = grade === '6'
  const [all, setAll] = useState(six)                // 계절 별자리까지 보이기

  const sunAlt = useMemo(() => {
    const eq = Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true)
    return Astronomy.Horizon(date, obs, eq.ra, eq.dec, 'normal').altitude
  }, [date.getTime(), loc.lat, loc.lon])
  const dark = sunAlt < -12

  /* 렌더 루프가 읽는 값 */
  const st = useRef({ lst: 0, lat: loc.lat, dark, dirty: true, yaw: six ? 180 : 0, pitch: 30, fov: 72, all: six })
  st.current.lst = lstOf(date, loc.lon)
  st.current.lat = loc.lat
  st.current.all = all
  if (st.current.dark !== dark) { st.current.dark = dark; st.current.skyDirty = true }
  st.current.dirty = true

  const narrow = vp.w < 1000
  const stageH = narrow
    ? Math.round(Math.min(vp.w * 0.72, vp.h * 0.5))
    : Math.max(320, Math.round(Math.min(vp.w * 0.62 * 0.58, vp.h * 0.66)))

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else hostRef.current?.requestFullscreen?.()
  }
  const lookNorth = () => { st.current.yaw = 0; st.current.pitch = Math.max(15, Math.min(60, loc.lat * 0.8)); st.current.fov = 72 }
  const lookSouth = () => { st.current.yaw = 180; st.current.pitch = 32; st.current.fov = 78 }
  const goSeason = md => {
    const y = new Date(date).getFullYear()
    setDate(new Date(`${y}-${md}T21:00:00+09:00`))
    setAll(true); lookSouth()
  }
  const seasonNow = (() => {
    const m = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', month: 'numeric' }).format(date))
    return m >= 3 && m <= 5 ? '봄' : m >= 6 && m <= 8 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울'
  })()

  useEffect(() => {
    const host = hostRef.current, layer = layerRef.current
    if (!host) return
    const S = st.current
    S.pitch = S.yaw === 180 ? 32 : Math.max(15, Math.min(60, S.lat * 0.8))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(S.fov, 1, 0.1, 1000)
    camera.position.set(0, 0.6, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    /* 하늘 · 땅 */
    let skyTex = skyTexture(S.dark)
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false })
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), skyMat))
    const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 96), new THREE.MeshBasicMaterial({ color: 0x0A120E }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    scene.add(ground)
    const horizonPts = []
    for (let a = 0; a <= 360; a += 3) horizonPts.push(Math.sin(a * RAD) * SKY_R, 0.05, -Math.cos(a * RAD) * SKY_R)
    scene.add(new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(horizonPts, 3)),
      new THREE.LineBasicMaterial({ color: 0x7F8AAC, transparent: true, opacity: 0.55 })))
    const tickPts = []
    for (let a = 0; a < 360; a += 15) {
      const big = a % 90 === 0
      const r0 = SKY_R, r1 = SKY_R * (big ? 0.965 : 0.985)
      tickPts.push(Math.sin(a * RAD) * r0, 0.05, -Math.cos(a * RAD) * r0, Math.sin(a * RAD) * r1, 0.05, -Math.cos(a * RAD) * r1)
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tickPts, 3)),
      new THREE.LineBasicMaterial({ color: 0x7F8AAC, transparent: true, opacity: 0.5 })))

    /* 하늘의 북극 둘레 점선 원 (20°·40°) */
    const pole = new THREE.Vector3(0, Math.sin(S.lat * RAD), -Math.cos(S.lat * RAD))
    const east = new THREE.Vector3(1, 0, 0)
    const up2 = new THREE.Vector3().crossVectors(pole, east).normalize()
    for (const rho of [20, 40]) {
      const pts = []
      for (let t = 0; t <= 360; t += 4) {
        const v = pole.clone().multiplyScalar(Math.cos(rho * RAD))
          .addScaledVector(east, Math.sin(rho * RAD) * Math.cos(t * RAD))
          .addScaledVector(up2, Math.sin(rho * RAD) * Math.sin(t * RAD))
        pts.push(v.x * SKY_R, v.y * SKY_R, v.z * SKY_R)
      }
      const l = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
        new THREE.LineDashedMaterial({ color: 0x3A4666, dashSize: 1.6, gapSize: 1.6 }))
      l.computeLineDistances()
      scene.add(l)
    }

    /* 배경 별 — 밝기별로 세 무리 */
    const disc = discTexture(false)
    const bgGroups = [
      { min: 2, max: 3.3, size: 3.4, arr: [] },
      { min: 3.3, max: 4.6, size: 2.3, arr: [] },
      { min: 4.6, max: 9, size: 1.5, arr: [] }
    ]
    BG.forEach(s => { const g = bgGroups.find(g => s.m >= g.min && s.m < g.max); if (g) g.arr.push(s) })
    const bgObjs = bgGroups.map(g => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(g.arr.length * 3), 3))
      const mat = new THREE.PointsMaterial({ size: g.size, map: disc, transparent: true, opacity: 0.9,
        sizeAttenuation: false, depthWrite: false, color: 0xDDE6FF })
      scene.add(new THREE.Points(geo, mat))
      return { ...g, geo, mat }
    })

    /* 이름 있는 별 · 별자리 선 */
    const ringTex = discTexture(true)
    const named = []
    const lines = []
    GROUPS.forEach(g => {
      const col = new THREE.Color(g.color)
      g.stars.forEach(s => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, color: 0xffffff, transparent: true, depthWrite: false }))
        const sc = Math.max(0.9, (6.6 - s.m) * 0.62)
        sp.scale.set(sc, sc, 1)
        scene.add(sp)
        let halo = null
        if (s.polaris) {
          halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, transparent: true, depthWrite: false }))
          halo.scale.set(6.5, 6.5, 1)
          scene.add(halo)
        }
        const el = document.createElement('div')
        el.className = 'lbl sky' + (s.polaris ? ' polaris' : '')
        el.textContent = s.ko
        el.style.display = 'none'
        layer.appendChild(el)
        const show = s.polaris || s.pointer || s.lbl || (g.season === 'circ' && s.m < 2.4)
        named.push({ s, g, sp, halo, el, dir: new THREE.Vector3(), show })
      })
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(g.links.length * 6), 3))
      const mat = g.dashed
        ? new THREE.LineDashedMaterial({ color: col, transparent: true, opacity: 0.55, dashSize: 1.4, gapSize: 1.2 })
        : new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.65 })
      const ln = new THREE.LineSegments(geo, mat)
      scene.add(ln)
      const el = document.createElement('div')
      el.className = 'lbl sky group'
      el.textContent = g.ko
      el.style.color = g.color
      el.style.display = 'none'
      layer.appendChild(el)
      lines.push({ g, geo, ln, el, center: new THREE.Vector3() })
    })
    /* 북극성 길잡이: 메라크 → 두베 → 북극성 */
    const guideGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3))
    const guide = new THREE.Line(guideGeo, new THREE.LineDashedMaterial({ color: 0xF2C879, dashSize: 1.4, gapSize: 1.2, transparent: true, opacity: 0.7 }))
    scene.add(guide)

    /* 방위 이름 */
    const compass = [[0, '북'], [90, '동'], [180, '남'], [270, '서']].map(([az, ko]) => {
      const el = document.createElement('div')
      el.className = 'lbl sky compass'
      el.textContent = ko
      layer.appendChild(el)
      return { el, dir: new THREE.Vector3(Math.sin(az * RAD), 0.035, -Math.cos(az * RAD)) }
    })

    const tmp = new THREE.Vector3()
    function updateSky() {
      const { lst, lat } = S
      bgObjs.forEach(g => {
        const a = g.geo.attributes.position.array
        g.arr.forEach((s, i) => {
          dirOf(s.ra, s.dec, lst, lat, tmp)
          a[i * 3] = tmp.x * SKY_R; a[i * 3 + 1] = tmp.y * SKY_R; a[i * 3 + 2] = tmp.z * SKY_R
        })
        g.geo.attributes.position.needsUpdate = true
      })
      named.forEach(n => {
        dirOf(n.s.ra, n.s.dec, lst, lat, n.dir)
        n.sp.position.copy(n.dir).multiplyScalar(SKY_R * 0.99)
        if (n.halo) n.halo.position.copy(n.sp.position)
      })
      lines.forEach(l => {
        const a = l.geo.attributes.position.array
        const pts = named.filter(n => n.g === l.g)
        l.center.set(0, 0, 0)
        pts.forEach(n => l.center.add(n.dir))
        l.center.normalize()
        l.g.links.forEach(([i, j], k) => {
          const p = pts[i].dir, q = pts[j].dir
          a[k * 6] = p.x * SKY_R * 0.985; a[k * 6 + 1] = p.y * SKY_R * 0.985; a[k * 6 + 2] = p.z * SKY_R * 0.985
          a[k * 6 + 3] = q.x * SKY_R * 0.985; a[k * 6 + 4] = q.y * SKY_R * 0.985; a[k * 6 + 5] = q.z * SKY_R * 0.985
        })
        l.geo.attributes.position.needsUpdate = true
        if (l.g.dashed) l.ln.computeLineDistances()
      })
      const merak = named.find(n => n.s.ko === '메라크').dir
      const dubhe = named.find(n => n.s.ko === '두베').dir
      const polaris = named.find(n => n.s.polaris).dir
      const a = guideGeo.attributes.position.array
      ;[merak, dubhe, polaris].forEach((d, i) => { a[i * 3] = d.x * SKY_R * 0.98; a[i * 3 + 1] = d.y * SKY_R * 0.98; a[i * 3 + 2] = d.z * SKY_R * 0.98 })
      guideGeo.attributes.position.needsUpdate = true
      guide.computeLineDistances()
      guide.visible = merak.y > 0 && polaris.y > 0
    }

    /* 둘러보기: 끌면 고개를 돌리고, 휠로 당겨 본다 */
    const el = renderer.domElement
    let drag = null
    const onDown = e => { drag = { x: e.clientX, y: e.clientY, yaw: S.yaw, pitch: S.pitch }; el.setPointerCapture(e.pointerId) }
    const onMove = e => {
      if (!drag) return
      const k = 0.16 * (S.fov / 72)
      S.yaw = drag.yaw - (e.clientX - drag.x) * k
      S.pitch = Math.max(-8, Math.min(88, drag.pitch + (e.clientY - drag.y) * k))
    }
    const onUp = () => { drag = null }
    const onWheel = e => { e.preventDefault(); S.fov = Math.max(30, Math.min(95, S.fov + e.deltaY * 0.04)) }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.style.cursor = 'grab'

    function resize() {
      const w = host.clientWidth, h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      el.style.width = w + 'px'; el.style.height = h + 'px'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const look = new THREE.Vector3()
    const camDir = new THREE.Vector3()
    const proj = new THREE.Vector3()
    let raf = 0
    function place(elm, dir, w, h, ok = true) {
      if (!ok || dir.dot(camDir) < 0.15) { elm.style.display = 'none'; return false }
      proj.copy(dir).multiplyScalar(SKY_R).project(camera)
      if (proj.z > 1 || Math.abs(proj.x) > 1.05 || Math.abs(proj.y) > 1.05) { elm.style.display = 'none'; return false }
      elm.style.display = 'block'
      elm.style.left = ((proj.x * 0.5 + 0.5) * w) + 'px'
      elm.style.top = ((-proj.y * 0.5 + 0.5) * h) + 'px'
      return true
    }
    function tick() {
      if (S.dirty) { updateSky(); S.dirty = false }
      if (S.skyDirty) {
        skyTex.dispose(); skyTex = skyTexture(S.dark); skyMat.map = skyTex; skyMat.needsUpdate = true
        bgObjs.forEach(g => { g.mat.opacity = S.dark ? 0.9 : 0.22 })
        S.skyDirty = false
      }
      if (camera.fov !== S.fov) { camera.fov = S.fov; camera.updateProjectionMatrix() }
      const y = S.yaw * RAD, p = S.pitch * RAD
      look.set(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p))
      camDir.copy(look)
      camera.lookAt(look.add(camera.position))

      named.forEach(n => {
        const on = (n.g.season === 'circ' || S.all) && n.dir.y > -0.01
        n.sp.visible = on
        if (n.halo) n.halo.visible = on
      })
      lines.forEach(l => { l.ln.visible = l.g.season === 'circ' || S.all })
      renderer.render(scene, camera)

      const w = el.clientWidth, h = el.clientHeight
      const placed = []
      named.forEach(n => {
        const ok = place(n.el, n.dir, w, h, n.show && n.sp.visible && n.dir.y > 0.01)
        if (!ok) return
        const x = parseFloat(n.el.style.left), yy = parseFloat(n.el.style.top)
        if (placed.some(q => Math.abs(q.x - x) < 64 && Math.abs(q.y - yy) < 18)) { n.el.style.display = 'none'; return }
        placed.push({ x, y: yy })
        n.el.style.transform = `translate(-50%, ${n.s.polaris ? '-170%' : '-150%'})`
      })
      lines.forEach(l => {
        if (place(l.el, l.center, w, h, l.ln.visible && l.center.y > 0.05)) l.el.style.transform = 'translate(-50%, 90%)'
      })
      compass.forEach(c => { if (place(c.el, c.dir, w, h)) c.el.style.transform = 'translate(-50%,-50%)' })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
      layer.replaceChildren()
      scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.() } })
      renderer.dispose()
      el.remove()
    }
  }, [])

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: 'none' }}>
        밤하늘 한가운데 서 있는 모습입니다. <b style={{ color: 'var(--moon)' }}>끌어서 고개를 돌리고, 휠로 가까이 당겨 보세요.</b>
        {six
          ? ' 시각을 밀면 별이 동에서 서로 움직이고(자전), 계절 단추를 누르면 남쪽 하늘의 별자리가 바뀝니다(공전).'
          : ' 시각을 밀면 별들이 북극성을 중심으로 돕니다. 북극성만 자리를 지키는 것을 찾아보세요.'}
      </p>

      <div className="grid" style={{ gridTemplateColumns: narrow ? '1fr' : 'minmax(0,1.9fr) minmax(280px,1fr)', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="stage" ref={hostRef} style={{ height: stageH, background: '#05070E' }}>
            <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} />
            <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--muted)', fontSize: '.82em', pointerEvents: 'none', textShadow: '0 0 6px #000' }}>
              {dark ? '하늘이 충분히 어둡습니다' : '아직 밝아 별이 잘 보이지 않는 시각입니다'} · {fmtKST(date, true)} · {seasonNow}
            </div>
            <div style={{ position: 'absolute', right: 12, top: 10, display: 'flex', gap: 6 }}>
              <button className="fsbtn" style={{ position: 'static' }} onClick={lookNorth}>북쪽</button>
              <button className="fsbtn" style={{ position: 'static' }} onClick={lookSouth}>남쪽</button>
              <button className="fsbtn" style={{ position: 'static' }} onClick={toggleFs}>{fs ? '✕ 닫기' : '⛶ 전체 화면'}</button>
            </div>
          </div>
          <div className="toolrow">
            <span className="mono" style={{ color: 'var(--muted)' }}>시각</span>
            <input className="slider" style={{ flex: 1, minWidth: 140 }} type="range" min="0" max="1439" step="5"
              value={minutesOfDay} onChange={e => setDate(new Date(dayKey + Number(e.target.value) * 60000))}
              aria-label="시각" />
            <b className="mono" style={{ minWidth: '4.5em', textAlign: 'right' }}>
              {String(Math.floor(minutesOfDay / 60)).padStart(2, '0')}:{String(minutesOfDay % 60).padStart(2, '0')}
            </b>
            <button className="btn" onClick={() => setDate(new Date(dayKey + 21 * 3600000))}>밤 9시</button>
            <button className="btn" onClick={() => setDate(new Date(dayKey + 3 * 3600000))}>새벽 3시</button>
          </div>
          {six ? (
            <div className="toolrow">
              <span className="mono" style={{ color: 'var(--muted)' }}>계절</span>
              <div className="seg">
                {SEASONS.map(([ko, md]) => (
                  <button key={ko} aria-pressed={seasonNow === ko} onClick={() => goSeason(md)}>{ko}</button>
                ))}
              </div>
              <span className="hint" style={{ margin: 0 }}>같은 밤 9시, 남쪽 하늘을 보면 계절마다 다른 별자리가 있습니다</span>
            </div>
          ) : (
            <div className="toolrow">
              <button className={'btn' + (all ? ' on' : '')} onClick={() => setAll(!all)}>계절 별자리도 보기</button>
              <span className="hint" style={{ margin: 0 }}>
                4학년은 <b>북극성 주변 별자리</b>만 다룹니다. 계절별 별자리는 교육과정에서 관련짓지 않도록 한 내용이라 기본으로 꺼 두었습니다(6학년 [6과12-03]).
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {six ? (
            <>
              <div className="card">
                <h3>하루 동안 별이 움직이는 까닭 — 자전</h3>
                <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                  태양처럼 별도 <b>동쪽에서 떠서 서쪽으로</b> 집니다. 한 시간에 약 15°씩, 하루에 한 바퀴.
                  북쪽 하늘에서는 북극성을 중심으로 시계 반대 방향으로 도는 것처럼 보입니다.
                  별이 도는 것이 아니라 <b>지구가 서에서 동으로 자전</b>하기 때문입니다.
                </p>
              </div>
              <div className="card">
                <h3>계절마다 별자리가 다른 까닭 — 공전</h3>
                <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                  지구가 태양 둘레를 돌면서 한밤중에 바라보는 하늘의 방향이 조금씩 바뀝니다.
                  그래서 같은 밤 9시에도 남쪽 하늘의 별자리가 계절마다 다릅니다.
                </p>
                <div className="rows" style={{ marginTop: 10 }}>
                  <div className="r"><span>봄</span><b>사자자리 · 봄철 대곡선</b></div>
                  <div className="r"><span>여름</span><b>백조자리 · 여름철 대삼각형</b></div>
                  <div className="r"><span>가을</span><b>페가수스자리</b></div>
                  <div className="r"><span>겨울</span><b>오리온자리 · 겨울철 대삼각형</b></div>
                </div>
                <p className="hint">북두칠성·카시오페이아·북극성은 일 년 내내 북쪽 하늘에 있습니다. '지구의 운동' 화면에서 공전과 함께 보세요.</p>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <h3>별이란?</h3>
                <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                  <b>태양처럼 스스로 빛을 내는 천체</b>입니다. 너무 멀리 있어서 점으로 보입니다.
                  달과 행성은 별이 아닙니다 — 스스로 빛을 내지 못하고 햇빛을 되비쳐 보이는 것입니다.
                  별들을 이어 동물이나 물건 모양으로 이름 붙인 것이 별자리입니다.
                </p>
              </div>
              <div className="card">
                <h3>북극성 찾는 법</h3>
                <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                  북두칠성 국자의 끝 두 별(메라크 → 두베)을 이어 그 간격의 <b>5배</b>만큼 늘이면 북극성입니다.
                  하늘의 노란 점선이 그 길입니다. 북두칠성이 지평선 아래일 때는 반대편 카시오페이아자리로 찾습니다.
                </p>
              </div>
              <div className="card">
                <h3>왜 북극성만 안 움직일까
                  <span className="std extra">더 알아보기</span>
                </h3>
                <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
                  지구의 자전축을 하늘 쪽으로 쭉 늘이면 그 끝 근처에 북극성이 있습니다.
                  축 위에 있으니 지구가 아무리 돌아도 자리가 거의 바뀌지 않고, 나머지 별들이 그 둘레를 도는 것처럼 보입니다.
                  점선 원은 북극성에서 20°·40° 떨어진 거리입니다.
                </p>
              </div>
            </>
          )}
          <div className="card" style={{ flex: 1 }}>
            <h3>지금 하늘</h3>
            <div className="rows">
              <div className="r"><span>보고 있는 시각</span><b>{fmtKST(date, true)}</b></div>
              <div className="r"><span>북극성의 고도</span><b>{loc.lat.toFixed(1)}°</b></div>
              <div className="r"><span>이 지역의 위도</span><b>{loc.lat.toFixed(2)}°</b></div>
            </div>
            <p className="hint">북극성의 고도는 그 지역의 위도와 같습니다. 제주에서는 낮게, 강원도에서는 높게 보입니다.</p>
          </div>
        </div>
      </div>
    </>
  )
}
