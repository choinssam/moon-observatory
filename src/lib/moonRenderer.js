import * as THREE from 'three'

/**
 * 실제 달 사진(NASA LRO)을 구에 입혀, 날짜에 맞는 햇빛 방향과 칭동으로 렌더링한다.
 * 화면 곳곳에서 쓰기 때문에 렌더러는 하나만 만들어 돌려 쓴다.
 */

const SIZE = 512
const BASE = import.meta.env.BASE_URL

let core = null
const waiting = new Set()
let ready = false

function init() {
  if (core) return core

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(SIZE, SIZE, false)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(12, 1, 0.1, 100)
  camera.position.set(9.6, 0, 0)
  camera.lookAt(0, 0, 0)

  // 칭동: 바깥 그룹이 위아래(위도), 안쪽 메시가 좌우(경도)
  const tiltGroup = new THREE.Group()
  const spinGroup = new THREE.Group()
  tiltGroup.add(spinGroup)
  scene.add(tiltGroup)

  const loader = new THREE.TextureLoader()
  let loaded = 0
  const done = () => {
    if (++loaded >= 2) {
      ready = true
      waiting.forEach(cb => cb())
    }
  }
  const colorMap = loader.load(BASE + 'moon_color.jpg', done, undefined, done)
  const bumpMap = loader.load(BASE + 'moon_elev.jpg', done, undefined, done)
  colorMap.colorSpace = THREE.SRGBColorSpace
  colorMap.anisotropy = 4

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.MeshStandardMaterial({
      map: colorMap, bumpMap, bumpScale: 2.6, roughness: 1, metalness: 0
    })
  )
  spinGroup.add(mesh)

  const sun = new THREE.DirectionalLight(0xfff6e8, 3.4)
  scene.add(sun)
  scene.add(new THREE.AmbientLight(0xffffff, 0.02))

  core = { renderer, scene, camera, tiltGroup, spinGroup, sun }
  return core
}

export function isReady() { return ready }

export function onMoonReady(cb) {
  if (ready) { cb(); return () => {} }
  waiting.add(cb)
  return () => waiting.delete(cb)
}

/**
 * 달을 그려 대상 캔버스에 옮긴다.
 * phase 0=삭, 0.25=상현, 0.5=보름, 0.75=하현
 * elat/elon 은 칭동(도). 생략하면 0.
 */
export function drawMoon(target, size, { phase = 0.5, elat = 0, elon = 0 } = {}) {
  const c = init()
  if (!target) return

  const theta = Math.PI - 2 * Math.PI * (((phase % 1) + 1) % 1)
  c.sun.position.set(Math.cos(theta) * 10, 0, -Math.sin(theta) * 10)

  c.spinGroup.rotation.y = -elon * Math.PI / 180
  c.tiltGroup.rotation.z = -elat * Math.PI / 180

  c.renderer.render(c.scene, c.camera)

  const px = Math.round(size * Math.min(window.devicePixelRatio || 1, 2))
  if (target.width !== px || target.height !== px) {
    target.width = px
    target.height = px
  }
  const ctx = target.getContext('2d')
  ctx.clearRect(0, 0, px, px)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(c.renderer.domElement, 0, 0, px, px)
}
