import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const BASE = import.meta.env.BASE_URL

/**
 * 실제 사진을 입힌 천체를 손으로 돌려보는 화면.
 * texture 는 public/planets/ 안의 파일 이름.
 */
export default function PlanetGlobe({ texture, ring = false, tilt = 0, sun = false, height = 0.8, fill = false }) {
  const hostRef = useRef(null)
  const cfg = useRef({ texture, ring, tilt, sun })
  cfg.current = { texture, ring, tilt, sun }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(4.6, 1.1, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 2
    controls.maxDistance = 12
    controls.enablePan = false

    const loader = new THREE.TextureLoader()
    const map = loader.load(BASE + 'planets/' + texture)
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4

    const tiltGroup = new THREE.Group()
    tiltGroup.rotation.z = -tilt * Math.PI / 180
    scene.add(tiltGroup)

    const geo = new THREE.SphereGeometry(1, 96, 64)
    const mat = sun
      ? new THREE.MeshBasicMaterial({ map })
      : new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 })
    const body = new THREE.Mesh(geo, mat)
    tiltGroup.add(body)

    let ringMesh = null, ringTex = null
    if (ring) {
      ringTex = loader.load(BASE + 'planets/saturn_ring.png')
      ringTex.colorSpace = THREE.SRGBColorSpace
      const rg = new THREE.RingGeometry(1.25, 2.25, 128)
      // 고리 텍스처가 안→밖 방향으로 펴지도록 UV 를 다시 잡는다
      const pos = rg.attributes.position
      const uv = rg.attributes.uv
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        const t = (v.length() - 1.25) / (2.25 - 1.25)
        uv.setXY(i, t, 0.5)
      }
      ringMesh = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.92
      }))
      ringMesh.rotation.x = Math.PI / 2
      tiltGroup.add(ringMesh)
    }

    if (sun) {
      scene.add(new THREE.AmbientLight(0xffffff, 1))
      const glowGeo = new THREE.SphereGeometry(1.35, 32, 24)
      const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
        color: 0xffb43a, transparent: true, opacity: 0.13,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
      }))
      scene.add(glow)
    } else {
      const light = new THREE.DirectionalLight(0xfff6e8, 3.1)
      light.position.set(6, 2, 3)
      scene.add(light)
      scene.add(new THREE.AmbientLight(0xffffff, 0.16))
    }

    const starGeo = new THREE.BufferGeometry()
    const pts = []
    for (let i = 0; i < 700; i++) {
      const p = new THREE.Vector3().randomDirection().multiplyScalar(40)
      pts.push(p.x, p.y, p.z)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const starMat = new THREE.PointsMaterial({ color: 0x8fa0c8, size: 0.16 })
    scene.add(new THREE.Points(starGeo, starMat))

    function resize() {
      const w = host.clientWidth
      if (!w) return
      const cap = Math.round(window.innerHeight * (window.innerHeight < 860 ? 0.42 : 0.48))
      const h = fill ? host.clientHeight : Math.max(240, Math.min(Math.round(w * height), cap))
      if (!h) return
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

    let raf = 0, prev = performance.now()
    function tick(now) {
      const dt = (now - prev) / 1000; prev = now
      body.rotation.y += dt * 0.12
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', resize)
      controls.dispose()
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) o.material.dispose()
      })
      map.dispose()
      if (ringTex) ringTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [texture, ring, tilt, sun, height, fill])

  return <div ref={hostRef} style={{ position: 'relative', width: '100%', height: fill ? '100%' : undefined }} />
}
