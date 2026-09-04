import React, { useEffect, useRef, useState } from 'react'
import More from '../lib/More.jsx'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { earthOrbitAngle, seasonsOf, fmtDateKST } from '../lib/astro.js'

function angDist(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180)
}

const TILT = 23.44
const ORBIT_R = 9

/* 한밤중에 남쪽 하늘에서 보이는 대표 별자리 (황경) */
const ZODIAC = [
  { ko: '오리온자리', season: '겨울', elon: 85 },
  { ko: '사자자리', season: '봄', elon: 150 },
  { ko: '백조자리', season: '여름', elon: 300 },
  { ko: '페가수스자리', season: '가을', elon: 355 }
]

export default function EarthMotion({ date, setDate }) {
  const hostRef = useRef(null)
  const layerRef = useRef(null)
  const [spin, setSpin] = useState(true)
  const [tilted, setTilted] = useState(true)
  const [orbiting, setOrbiting] = useState(false)
  const [dayOfYear, setDayOfYear] = useState(() => dayIndex(date))
  const st = useRef({ spin: true, tilted: true, angle: 0 })

  function dayIndex(d) {
    const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.round((d - y) / 86400000)
  }

  function daysInYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365
  }

  const year = date.getUTCFullYear()
  const shown = new Date(Date.UTC(year, 0, 1) + dayOfYear * 86400000)
  const angleDeg = earthOrbitAngle(shown)

  st.current.spin = spin
  st.current.tilted = tilted
  st.current.angle = angleDeg

  useEffect(() => {
    if (!orbiting) return
    const id = setInterval(() => setDayOfYear(d => (d + 2) % daysInYear(year)), 60)
    return () => clearInterval(id)
  }, [orbiting, year])

  useEffect(() => {
    const host = hostRef.current
    const layer = layerRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 200)
    camera.position.set(0, 15, 21)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 6
    controls.maxDistance = 60
    controls.enablePan = false

    // 태양
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb03a })
    )
    scene.add(sun)
    // 부드럽게 번지는 햇무리
    const gc = document.createElement('canvas')
    gc.width = gc.height = 128
    const gx = gc.getContext('2d')
    const grad = gx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,190,90,.85)')
    grad.addColorStop(0.35, 'rgba(255,160,50,.28)')
    grad.addColorStop(1, 'rgba(255,150,40,0)')
    gx.fillStyle = grad
    gx.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(gc)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    }))
    glow.scale.set(6, 6, 1)
    scene.add(glow)
    const light = new THREE.PointLight(0xfff0d8, 320, 0, 2)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.09))

    // 궤도
    const ringGeo = new THREE.RingGeometry(ORBIT_R - 0.035, ORBIT_R + 0.035, 180)
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x3c4a6a, side: THREE.DoubleSide
    }))
    ring.rotation.x = -Math.PI / 2
    scene.add(ring)

    // 지구
    const pivot = new THREE.Group()
    scene.add(pivot)
    const tiltGroup = new THREE.Group()
    pivot.add(tiltGroup)
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0x3f7fd0, roughness: 0.85, metalness: 0 })
    )
    tiltGroup.add(earth)

    // 위도선 (적도)
    const eq = new THREE.Mesh(
      new THREE.TorusGeometry(1.025, 0.011, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0xe9edf8 })
    )
    eq.rotation.x = Math.PI / 2
    tiltGroup.add(eq)

    // 자전축
    const axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.021, 0.021, 3.7, 8),
      new THREE.MeshBasicMaterial({ color: 0xf2c879 })
    )
    tiltGroup.add(axis)

    // 우리나라 위치 표시
    const mark = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xff8b6b })
    )
    const latRad = 37.5 * Math.PI / 180
    mark.position.set(Math.cos(latRad) * 1.17, Math.sin(latRad) * 1.17, 0)
    earth.add(mark)

    // 별
    const starGeo = new THREE.BufferGeometry()
    const pts = []
    for (let i = 0; i < 1200; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(70)
      pts.push(v.x, v.y, v.z)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const starMat = new THREE.PointsMaterial({ color: 0x93a3c9, size: 0.3 })
    scene.add(new THREE.Points(starGeo, starMat))

    // 별자리 라벨
    const zLabels = ZODIAC.map(z => {
      const el = document.createElement('div')
      el.className = 'lbl'
      const dot = document.createElement('i')
      const txt = document.createElement('span')
      txt.textContent = z.season + ' · ' + z.ko
      el.appendChild(dot); el.appendChild(txt)
      layer.appendChild(el)
      const a = z.elon * Math.PI / 180
      return { z, el, dot, v: new THREE.Vector3(Math.cos(a) * 12.2, 0, -Math.sin(a) * 12.2) }
    })

    function resize() {
      const w = host.clientWidth
      if (!w) return
      const cap = Math.round(window.innerHeight * (window.innerHeight < 860 ? 0.48 : 0.54))
      const h = Math.max(280, Math.min(Math.round(w * 0.58), cap))
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = w + 'px'
      renderer.domElement.style.height = h + 'px'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    window.addEventListener('resize', resize)

    const tmp = new THREE.Vector3()
    let raf = 0, prev = performance.now()
    function tick(now) {
      const dt = (now - prev) / 1000; prev = now
      const s = st.current

      const a = s.angle * Math.PI / 180
      pivot.position.set(Math.cos(a) * ORBIT_R, 0, -Math.sin(a) * ORBIT_R)
      tiltGroup.rotation.z = s.tilted ? -TILT * Math.PI / 180 : 0
      if (s.spin) earth.rotation.y += dt * 0.9

      controls.update()
      renderer.render(scene, camera)

      const w = renderer.domElement.clientWidth
      const h = renderer.domElement.clientHeight
      for (const L of zLabels) {
        const proj = tmp.copy(L.v).project(camera)
        const on = angDist(s.angle, L.z.elon) < 60
        L.el.style.display = proj.z < 1 ? 'flex' : 'none'
        L.el.style.left = ((proj.x * 0.5 + 0.5) * w) + 'px'
        L.el.style.top = ((-proj.y * 0.5 + 0.5) * h) + 'px'
        L.el.style.opacity = on ? '1' : '.4'
        L.dot.style.background = on ? '#F2C879' : '#5A6484'
        L.dot.style.boxShadow = on ? '0 0 8px #F2C879' : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', resize)
      controls.dispose()
      zLabels.forEach(l => l.el.remove())
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) o.material.dispose()
      })
      glowTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  const seasons = seasonsOf(year)
  const nearest = seasons.reduce((best, s) => {
    const d = Math.abs(s.date - shown)
    return !best || d < best.d ? { s, d } : best
  }, null)

  return (
    <>
      <p className="hint" style={{ color: 'var(--muted)', margin: 0, maxWidth: '74ch' }}>
        지구는 하루에 한 번 스스로 돌고(자전), 일 년에 한 번 태양 둘레를 돕니다(공전).
        햇빛을 받는 쪽이 낮, 반대쪽이 밤입니다. 빨간 점이 우리나라입니다. 지구를 두른 가는 고리는 적도, 기울어진 막대는 자전축입니다(달의 궤도가 아닙니다).
      </p>

      <div className="stage" ref={hostRef} style={{ position: 'relative' }}>
        <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      </div>

      <div className="card">
        <div className="toolrow" style={{ marginBottom: 10 }}>
          <button className={'btn' + (spin ? ' on' : '')} onClick={() => setSpin(!spin)}>자전</button>
          <button className={'btn' + (orbiting ? ' on' : '')} onClick={() => setOrbiting(!orbiting)}>공전 재생</button>
          <button className={'btn' + (tilted ? ' on' : '')} onClick={() => setTilted(!tilted)}>
            자전축 기울기 {tilted ? '23.4°' : '0°'}
          </button>
          <button className="btn" onClick={() => { setOrbiting(false); setDayOfYear(dayIndex(new Date())) }}>오늘로</button>
          <span className="mono" style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
            {fmtDateKST(shown)} · 공전 위치 {angleDeg.toFixed(0)}°
          </span>
        </div>
        <input className="slider" type="range" min="0" max={daysInYear(year) - 1} step="1" value={dayOfYear}
          onChange={e => { setOrbiting(false); setDayOfYear(Number(e.target.value)) }}
          aria-label="일 년 중 날짜" />
        <div className="toolrow" style={{ marginTop: 8 }}>
          {seasons.map(s => (
            <button key={s.key} className="btn"
              onClick={() => { setOrbiting(false); setDayOfYear(dayIndex(s.date)) }}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <More title="더 알아보기 — 낮과 밤 · 계절 별자리 · 절기" count="3">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div className="card">
          <h3>낮과 밤이 생기는 까닭</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            지구가 하루에 한 바퀴 자전하기 때문에, 햇빛을 받는 쪽에 있을 때가 낮이고 반대쪽으로 돌아가면 밤입니다.
            자전을 켜고 빨간 점을 따라가 보세요. 태양이 동쪽에서 떠서 서쪽으로 지는 것처럼 보이는 것도
            지구가 서쪽에서 동쪽으로 자전하기 때문입니다.
          </p>
        </div>
        <div className="card">
          <h3>계절에 따라 별자리가 달라지는 까닭</h3>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: '.94em' }}>
            지구가 공전하면서 한밤중에 태양 반대쪽에 오는 별자리가 달라집니다.
            지금은 <b style={{ color: 'var(--moon)' }}>
              {ZODIAC.reduce((b, z) => {
                const d = angDist(angleDeg, z.elon)
                return !b || d < b.d ? { z, d } : b
              }, null).z.ko}
            </b> 쪽이 한밤중 하늘에 옵니다. 태양과 같은 쪽에 있는 별자리는 낮에 떠 있어 볼 수 없습니다.
          </p>
        </div>
        <div className="card">
          <h3>{year}년 절기</h3>
          <div className="rows">
            {seasons.map(s => (
              <div className="r" key={s.key}>
                <span>{s.name}</span>
                <b style={{ color: nearest && nearest.s.key === s.key ? 'var(--moon)' : undefined }}>
                  {new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(s.date)}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>
      </More>
    </>
  )
}
