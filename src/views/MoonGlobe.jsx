import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FEATURES, FEATURE_KIND, lonLatToVec3 } from '../lib/moon.jsx'
import { moonPhase01, Astronomy } from '../lib/astro.js'
import { useFit, oneSquare } from '../lib/useFit.js'

const BASE = import.meta.env.BASE_URL

export default function MoonGlobe({ date }) {
  const hostRef = useRef(null)
  const layerRef = useRef(null)
  const rootRef = useRef(null)
  const [labels, setLabels] = useState(true)
  const [realLight, setRealLight] = useState(false)
  const [spin, setSpin] = useState(false)
  const [fs, setFs] = useState(false)
  const stateRef = useRef({ labels: true, realLight: false, spin: false, phase: 0.5 })

  stateRef.current.labels = labels
  stateRef.current.realLight = realLight
  stateRef.current.spin = spin
  stateRef.current.phase = moonPhase01(date)

  /* 달은 둥글다 — 무대도 정사각형으로, 화면 높이에 맞춰 최대한 크게 */
  const box = useFit(rootRef)
  const L = oneSquare(box)
  const { sq, gap } = L
  const wide = L.mode === 'wide'

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else hostRef.current?.requestFullscreen?.()
  }

  useEffect(() => {
    const host = hostRef.current
    const layer = layerRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(3.25, 0.45, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 1.5
    controls.maxDistance = 9
    controls.enablePan = false

    const loader = new THREE.TextureLoader()
    const colorMap = loader.load(BASE + 'moon_color.jpg')
    const bumpMap = loader.load(BASE + 'moon_elev.jpg')
    colorMap.colorSpace = THREE.SRGBColorSpace

    const geo = new THREE.SphereGeometry(1, 96, 64)
    const mat = new THREE.MeshStandardMaterial({
      map: colorMap, bumpMap, bumpScale: 2.2, roughness: 1, metalness: 0
    })
    const moon = new THREE.Mesh(geo, mat)
    scene.add(moon)

    const sun = new THREE.DirectionalLight(0xfff4e2, 3.1)
    sun.position.set(-5, 0.6, 0)
    scene.add(sun)
    const fill = new THREE.AmbientLight(0xffffff, 0.32)
    scene.add(fill)

    const starGeo = new THREE.BufferGeometry()
    const pts = []
    for (let i = 0; i < 900; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40)
      pts.push(v.x, v.y, v.z)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const starMat = new THREE.PointsMaterial({ color: 0x9fb0d8, size: 0.16 })
    scene.add(new THREE.Points(starGeo, starMat))

    const marks = FEATURES.map(f => {
      const el = document.createElement('div')
      el.className = 'lbl' + (f.kind === 'apollo' ? ' apollo' : '')
      const dot = document.createElement('i')
      dot.style.background = FEATURE_KIND[f.kind].color
      dot.style.boxShadow = '0 0 6px ' + FEATURE_KIND[f.kind].color
      const txt = document.createElement('span')
      txt.textContent = f.ko
      el.appendChild(dot)
      el.appendChild(txt)
      layer.appendChild(el)
      const v3 = lonLatToVec3(f.lon, f.lat, 1.012)
      return { f, el, v: new THREE.Vector3(v3[0], v3[1], v3[2]) }
    })

    function resize() {
      const w = host.clientWidth, h = host.clientHeight
      if (!w || !h) return
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
    const toCam = new THREE.Vector3()
    let raf = 0
    let prev = performance.now()

    function tick(now) {
      const dt = (now - prev) / 1000
      prev = now
      const st = stateRef.current

      if (st.spin) moon.rotation.y += dt * 0.18
      controls.update()

      if (st.realLight) {
        const ang = 2 * Math.PI * st.phase
        sun.position.set(-Math.cos(ang) * 5, 0.4, Math.sin(ang) * 5)
        fill.intensity = 0.06
      } else {
        sun.position.copy(camera.position).multiplyScalar(1.4)
        sun.position.y += 1.5
        fill.intensity = 0.34
      }

      renderer.render(scene, camera)

      const w = renderer.domElement.clientWidth
      const h = renderer.domElement.clientHeight
      const placed = []
      const cand = []
      for (const m of marks) {
        if (!st.labels) { m.el.style.display = 'none'; continue }
        tmp.copy(m.v).applyMatrix4(moon.matrixWorld)
        toCam.copy(camera.position).sub(tmp).normalize()
        const facing = tmp.clone().normalize().dot(toCam)
        const proj = tmp.clone().project(camera)
        if (!(facing > 0.12 && proj.z < 1)) { m.el.style.display = 'none'; continue }
        const x = (proj.x * 0.5 + 0.5) * w, y = (-proj.y * 0.5 + 0.5) * h
        if (x < 56 || x > w - 56 || y < 14 || y > h - 14) { m.el.style.display = 'none'; continue }
        cand.push({ m, facing, score: facing + (m.f.kind === 'apollo' ? -0.3 : 0), x, y })
      }
      // 정면에 가까운 것부터 자리를 잡고, 너무 붙는 이름은 숨긴다
      cand.sort((a, b) => b.score - a.score)
      for (const c of cand) {
        const clash = placed.some(p => Math.abs(p.x - c.x) < 96 && Math.abs(p.y - c.y) < 20)
        if (clash) { c.m.el.style.display = 'none'; continue }
        placed.push(c)
        c.m.el.style.display = 'flex'
        c.m.el.style.left = c.x + 'px'
        c.m.el.style.top = c.y + 'px'
        c.m.el.style.opacity = String(Math.min(1, c.facing * 2.2))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', resize)
      controls.dispose()
      marks.forEach(m => m.el.remove())
      geo.dispose()
      mat.dispose()
      starGeo.dispose()
      starMat.dispose()
      colorMap.dispose()
      bumpMap.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  const lib = Astronomy.Libration(date)
  const sqStyle = sq ? { width: sq, height: sq } : undefined

  return (
    <div ref={rootRef} className={'fit globe ' + L.mode}
      style={wide ? { gridTemplateColumns: `${sq}px minmax(0,1fr)`, height: sq } : undefined}>
      <div className="stage globe-sq" ref={hostRef} style={{ ...sqStyle, margin: wide ? 0 : '0 auto', background: '#05070E' }}>
        <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div className="cap">미국 항공우주국 달 정찰 궤도선(LRO)이 찍은 실제 표면 사진과 높낮이 자료</div>
        <div className="cap bottom">끌어서 돌리기 · 휠이나 두 손가락으로 확대</div>
        <button className="fsbtn" onClick={toggleFs} aria-label={fs ? '전체 화면 닫기' : '전체 화면으로 보기'}>
          {fs ? '✕ 닫기' : '⛶ 전체 화면'}
        </button>
      </div>

      {/* 옆 칸: 넓으면 두 줄, 좁으면 한 줄로 카드가 흐른다. 정사각형보다 길어지면 안에서 스크롤 */}
      <div className="side-cards" style={wide ? { maxHeight: sq } : undefined}>
        <div className="card">
          <h3>이렇게 보세요</h3>
          <div className="toolrow">
            <button className={'btn' + (labels ? ' on' : '')} onClick={() => setLabels(!labels)}>이름 보기</button>
            <button className={'btn' + (spin ? ' on' : '')} onClick={() => setSpin(!spin)}>천천히 돌리기</button>
            <button className={'btn' + (realLight ? ' on' : '')} onClick={() => setRealLight(!realLight)}>
              오늘의 햇빛으로 비추기
            </button>
          </div>
          <div className="legend" style={{ marginTop: 10 }}>
            <span><i style={{ background: 'var(--moon)' }} />바다 · 크레이터</span>
            <span><i style={{ background: 'var(--sky)' }} />사람이 내린 곳</span>
          </div>
        </div>

        <div className="card">
          <h3>오늘의 칭동
            <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.86em' }}>달이 살짝 흔들려 보이는 정도</span>
          </h3>
          <div className="rows">
            <div className="r"><span>위아래로 기운 정도</span><b>{lib.elat.toFixed(2)}°</b></div>
            <div className="r"><span>좌우로 흔들린 정도</span><b>{lib.elon.toFixed(2)}°</b></div>
            <div className="r"><span>달의 겉보기 크기</span><b>{(lib.diam_deg * 60).toFixed(1)}′</b></div>
          </div>
          <div className="note" style={{ marginTop: 12 }}>
            <b style={{ color: 'var(--moon)' }}>칭동이 뭐지?</b> 달은 늘 같은 면만 보여 주지만, 지구를 도는 길이 타원이고
            자전축도 살짝 기울어 있어서 가장자리가 조금씩 위아래·좌우로 흔들려 보입니다.
            이 흔들림을 <b>칭동</b>이라고 합니다. 덕분에 오랜 기간 모아 보면 표면의 약 59%까지 볼 수 있습니다.
          </div>
        </div>

        <div className="card">
          <h3>왜 늘 같은 면만 보일까</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '.94em', margin: 0 }}>
            달이 스스로 한 바퀴 도는 시간과 지구를 한 바퀴 도는 시간이 똑같아서
            지구에서는 언제나 같은 쪽만 보입니다. 반대쪽은 우주선을 보내야 볼 수 있어서,
            <b> 남극-에이트켄 분지</b>는 지구에서 절대 보이지 않습니다.
          </p>
        </div>

        <div className="card">
          <h3>달의 바다는 바다가 아닙니다</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '.94em', margin: 0 }}>
            어둡고 평평한 곳을 옛사람들이 바다라고 불렀을 뿐, 물은 한 방울도 없습니다.
            아주 오래전 화산에서 흘러나온 용암이 굳어 만들어진 넓은 평원입니다.
            밝고 오톨도톨한 곳은 운석이 부딪혀 파인 자국인 크레이터입니다.
          </p>
        </div>

        <div className="card">
          <h3>크레이터는 어떻게 생겼을까</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '.94em', margin: 0 }}>
            달에는 공기가 없어서 운석이 속도를 잃지 않고 그대로 부딪힙니다. 부딪힌 자리가 움푹 파여 크레이터가 됩니다.
            비바람도 없어 한번 생긴 자국이 수십억 년 동안 그대로 남아 있습니다.
            티코 크레이터에서 뻗어 나온 밝은 줄무늬는 부딪힐 때 튀어 나간 부스러기 자국입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
