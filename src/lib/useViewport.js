import { useEffect, useState } from 'react'

/** 창 크기 변화를 따라간다. 교실 모니터·크롬북·태블릿에서 그림 크기를 맞추는 데 쓴다. */
export function useViewport() {
  const [v, setV] = useState(() => ({
    w: typeof window === 'undefined' ? 1440 : window.innerWidth,
    h: typeof window === 'undefined' ? 900 : window.innerHeight
  }))
  useEffect(() => {
    let id = 0
    const on = () => {
      clearTimeout(id)
      id = setTimeout(() => setV({ w: window.innerWidth, h: window.innerHeight }), 80)
    }
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('resize', on); clearTimeout(id) }
  }, [])
  return v
}

/** 화면 크기에 맞춘 달 지름(px) */
export function moonSize(v, big, { min = 96, max = 300 } = {}) {
  const byH = v.h * (v.h < 800 ? 0.24 : 0.28)
  const byW = v.w * 0.16
  const base = Math.min(byH, byW)
  return Math.round(Math.max(min, Math.min(base * (big ? 1.28 : 1), max)))
}
