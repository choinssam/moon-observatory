import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Astronomy, kstMidnight, fmtKST } from '../lib/astro.js'
import { useViewport } from '../lib/useViewport.js'

/* 적경(시), 적위(도), 밝기 */
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
const GROUPS = [
  { key: 'uma', ko: '북두칠성', color: '#F2C879', stars: UMA, links: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
  { key: 'cas', ko: '카시오페이아자리', color: '#8ED3E0', stars: CAS, links: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { key: 'umi', ko: '작은곰자리', color: '#B7C0DA', stars: UMI, links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }
]

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

export default function StarMap({ date, setDate, obs, loc }) {
  const hostRef = useRef(null)
  const layerRef = useRef(null)
  const vp = useViewport()
  const dayKey = kstMidnight(date).getTime()
  const minutesOfDay = Math.round((date.getTime() - dayKey) / 60000)
  const [fs, setFs] = useState(false)

  const sunAlt = useMemo(() => {
    const eq = Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true)
    return Astronomy.Horizon(date, obs, eq.ra, eq.dec, 'normal').altitude
  }, [date.getTime(), loc.lat, loc.lon])
  const dark = sunAlt < -12

  /* 렌더 루프가 읽는 값 */
  const st = useRef({ lst: 0, lat: loc.lat, dark, dirty: true, yaw: 0, pitch: 30, fov: 72 })
  st.current.lst = lstOf(date, loc.lon)
  st.current.lat = loc.lat
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
  const resetView = () => { st.current.yaw = 0; st.current.pitch = Math.max(15, Math.min(60, loc.lat * 0.8)); st.current.fov = 72 }

  useEffect(() => {
    const host = hostRef.current, layer = layerRef.current
    if (!host) return
    const S = st.current
    S.pitch = Math.max(15, Math.min(60, S.lat * 0.8))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(S.fov, 1, 0.1, 1000)
    camera.position.set(0, 0.6, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    /* 하늘 · 땅 */
    let skyTex = skyTexture(S.dark)
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false })
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), skyMat)
    scene.add(sky)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 96),
      new THREE.MeshBasicMaterial({ color: 0x0A120E }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    scene.add(ground)
    /* 지평선 · 방위 눈금 */
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

    /* 하늘의 북극 둘레 점선 원 (20°·40°) — 지평선처럼 관측자에게 고정 */
    const pole = new THREE.Vector3(0, Math.sin(S.lat * RAD), -Math.cos(S.lat * RAD))
    const east = new THREE.Vector3(1, 0, 0)
    const up2 = new THREE.Vector3().crossVectors(pole, east).normalize()
    const rings = new THREE.Group()
    for (const rho of [20, 40]) {
      const pts = []
      for (let t = 0; t <= 360; t += 4) {
        const v = pole.clone().multiplyScalar(Math.cos(rho * RAD))
          .addScaledVector(east, Math.sin(rho * RAD) * Math.cos(t * RAD))
          .addScaledVector(up2, Math.sin(rho * RAD) * Math.sin(t * RAD))
        pts.push(v.x * SKY_R, v.y * SKY_R, v.z * SKY_R)
      }
      const g = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x3A4666, dashSize: 1.6, gapSize: 1.6 }))
      l.computeLineDistances()
      rings.add(l)
    }
    scene.add(rings)

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
      const pts = new THREE.Points(geo, mat)
      scene.add(pts)
      return { ...g, geo, mat }
    })

    /* 이름 있는 별 · 별자리 선 */
    const ringTex = discTexture(true)
    const named = []
    const lines = []
    GROUPS.forEach(g => {
      const col = new THREE.Color(g.color)
      g.stars.forEach((s, i) => {
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
        named.push({ s, g, sp, halo, el, dir: new THREE.Vector3(), show: s.polaris || s.pointer || s.m < 2.4 })
      })
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(g.links.length * 6), 3))
      const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.65 }))
      scene.add(ln)
      const el = document.createElement('div')
      el.className = 'lbl sky group'
      el.textContent = g.ko
      el.style.color = g.color
      el.style.display = 'none'
      layer.appendChild(el)
      lines.push({ g, geo, el, center: new THREE.Vector3() })
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

    /* 별 자리 갱신 */
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
        n.sp.visible = n.dir.y > -0.01
        if (n.halo) { n.halo.position.copy(n.sp.position); n.halo.visible = n.sp.visible }
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
    function place(elm, dir, w, h, extraOk = true) {
      if (!extraOk || dir.dot(camDir) < 0.15) { elm.style.display = 'none'; return false }
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
      renderer.render(scene, camera)

      const w = el.clientWidth, h = el.clientHeight
      const placed = []
      named.forEach(n => {
        const ok = place(n.el, n.dir, w, h, n.show && n.dir.y > 0.01)
        if (!ok) return
        const x = parseFloat(n.el.style.left), yy = parseFloat(n.el.style.top)
        if (placed.some(q => Math.abs(q.x - x) < 64 && Math.abs(q.y - yy) < 18)) { n.el.style.display = 'none'; return }
        placed.push({ x, y: yy })
        n.el.style.transform = `translate(-50%, ${n.s.polaris ? '-170%' : '-150%'})`
      })
      lines.forEach(l => {
        if (place(l.el, l.center, w, h, l.center.y > 0.05)) {
          l.el.style.transform = 'translate(-50%, 90%)'
        }
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
        시각을 밀면 별들이 북극성을 중심으로 돕니다. 실제로 도는 것은 별이 아니라 지구입니다.
      </p>

      <div className="grid" style={{ gridTemplateColumns: narrow ? '1fr' : 'minmax(0,1.9fr) minmax(280px,1fr)', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div className="stage" ref={hostRef} style={{ height: stageH, background: '#05070E' }}>
            <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} />
            <div style={{ position: 'absolute', left: 12, top: 10, color: 'var(--muted)', fontSize: '.82em', pointerEvents: 'none', textShadow: '0 0 6px #000' }}>
              {dark ? '하늘이 충분히 어둡습니다' : '아직 밝아 별이 잘 보이지 않는 시각입니다'} · {fmtKST(date, true)}
            </div>
            <div style={{ position: 'absolute', right: 12, top: 10, display: 'flex', gap: 6 }}>
              <button className="fsbtn" style={{ position: 'static' }} onClick={resetView}>북쪽 보기</button>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div className="card">
            <h3>북극성 찾는 법</h3>
            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
              북두칠성 국자의 끝 두 별(메라크 → 두베)을 이어 그 간격의 <b>5배</b>만큼 늘이면 북극성입니다.
              하늘의 노란 점선이 그 길입니다. 북두칠성이 지평선 아래일 때는 반대편 카시오페이아자리로 찾습니다.
            </p>
          </div>
          <div className="card">
            <h3>왜 북극성만 안 움직일까</h3>
            <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
              지구의 자전축을 하늘 쪽으로 쭉 늘이면 그 끝 근처에 북극성이 있습니다.
              축 위에 있으니 지구가 아무리 돌아도 자리가 거의 바뀌지 않고, 나머지 별들이 그 둘레를 도는 것처럼 보입니다.
              점선 원은 북극성에서 20°·40° 떨어진 거리입니다.
            </p>
          </div>
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
