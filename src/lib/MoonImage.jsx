import React, { useEffect, useRef } from 'react'
import { drawMoon, onMoonReady } from './moonRenderer.js'
import { moonPathD } from './moon.jsx'

/**
 * 실제 달 사진으로 그린 위상. 사진이 아직 안 왔으면 간단한 도형으로 먼저 보여 준다.
 */
export default function MoonImage({ size = 120, phase = 0.5, elat = 0, elon = 0, ring = true, title }) {
  const ref = useRef(null)

  useEffect(() => {
    let alive = true
    const paint = () => { if (alive && ref.current) drawMoon(ref.current, size, { phase, elat, elon }) }
    paint()
    const off = onMoonReady(paint)
    return () => { alive = false; off() }
  }, [size, phase, elat, elon])

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }} title={title}>
      <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <circle r={size / 2 - 1} fill="#0B0E17" />
        <path d={moonPathD(size / 2 - 1, phase)} fill="#4A4636" />
      </svg>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: size, height: size }} />
      {ring && (
        <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
          <circle r={size / 2 - 1} fill="none" stroke="rgba(255,255,255,.14)" />
        </svg>
      )}
    </div>
  )
}
