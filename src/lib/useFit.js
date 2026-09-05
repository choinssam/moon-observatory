import { useLayoutEffect, useState } from 'react'

/**
 * 어떤 칸(ref)이 화면 아래까지 쓸 수 있는 폭·높이를 잰다.
 * 높이는 그 칸의 윗변부터 main 의 보이는 아랫변까지. 스크롤이 되어 있어도 같은 값이 나온다.
 * 큰 글씨 모드나 제목 줄 높이가 바뀌면 부모 높이가 바뀌므로 부모도 같이 지켜본다.
 *
 * 무대를 화면 높이에 딱 맞추는 데 쓴다 (교실 모니터·크롬북·태블릿).
 */
export function useFit(ref, { bottom = 18 } = {}) {
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const main = el.closest('main')
    const measure = () => {
      const r = el.getBoundingClientRect()
      const w = el.clientWidth
      let h
      if (main) {
        const m = main.getBoundingClientRect()
        const offset = r.top - m.top + main.scrollTop        // main 내용 안에서의 위치
        h = main.clientHeight - offset - bottom
      } else {
        h = window.innerHeight - r.top - bottom
      }
      h = Math.max(0, Math.round(h))
      setBox(b => (b.w === w && b.h === h) ? b : { w, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.parentElement) ro.observe(el.parentElement)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [ref, bottom])
  return box
}

/**
 * 정사각형 두 개 + 옆 칸 + 아래 띠 배치의 치수.
 *   wide   : [정사각][정사각][옆 칸]  /  [아래 띠 ──────]
 *   medium : [정사각][정사각] / [아래 띠] / [옆 칸]   (태블릿 가로)
 *   narrow : 한 줄로 쌓는다                       (태블릿 세로·폰)
 */
export function twoSquares({ w, h }, { gap = 14, strip = 138, stripCompact = 106, sideMin = 300, sideMax = 400, sideRatio = 0.23 } = {}) {
  if (!w) return { mode: 'wide', sq: 0, compact: false, strip, gap }
  const compact = h < 640
  const st = compact ? stripCompact : strip
  const sideW = Math.max(sideMin, Math.min(sideMax, w * sideRatio))
  const sqW = Math.floor(Math.min((w - sideW - gap * 2) / 2, h - st - gap))
  if (sqW >= 380) return { mode: 'wide', sq: sqW, compact, strip: st, gap }
  const sqM = Math.floor((w - gap) / 2)
  if (sqM >= 300) return { mode: 'medium', sq: sqM, compact: false, strip, gap }
  return { mode: 'narrow', sq: Math.min(w, Math.round(h * 0.8)), compact: false, strip, gap }
}

/**
 * 정사각형 하나 + 옆 칸 배치의 치수.
 *   wide   : [정사각][옆 칸]     narrow : 위아래로 쌓는다
 */
export function oneSquare({ w, h }, { gap = 14, sideMin = 300 } = {}) {
  if (!w) return { mode: 'wide', sq: 0, side: 0, gap }
  const sq = Math.floor(Math.min(h, w - sideMin - gap))
  if (sq >= 380 && w - sq - gap >= sideMin) return { mode: 'wide', sq, side: w - sq - gap, gap }
  return { mode: 'narrow', sq: Math.min(w, Math.round(h * 0.75)), side: w, gap }
}
