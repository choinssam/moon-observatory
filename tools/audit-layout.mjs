/** 화면마다 '빈 구간'을 재서 알려 준다. node tools/audit-layout.mjs [폭 높이] */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const VW = Number(process.argv[2] || 1920), VH = Number(process.argv[3] || 1080)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const TABS = [
  ['4학년', '위상 만들기'], ['4학년', '달 표면'], ['4학년', '오늘의 달'], ['4학년', '한 달 보기'],
  ['4학년', '태양계'], ['4학년', '별자리'], ['4학년', '밀물·썰물'], ['4학년', '일식·월식'],
  ['6학년', '지구의 운동'], ['6학년', '하루의 태양과 달'], ['6학년', '계절별 별자리'], ['6학년', '계절 변화']
]

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new',
  args: [`--window-size=${VW},${VH}`, '--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH })
fs.mkdirSync('capture/audit', { recursive: true })

const click = async (sel, t) => {
  await page.evaluate((s, x) => {
    const e = [...document.querySelectorAll(s)].find(q => q.textContent.trim().includes(x)); e && e.click()
  }, sel, t); await sleep(400)
}

await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())

console.log(`\n=== ${VW}x${VH} ===`)
for (const [grade, tab] of TABS) {
  await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' }); await sleep(500)
  await click('.seg button', grade)
  await click('[role=tab]', tab)
  await sleep(tab.includes('별자리') || tab.includes('태양계') || tab.includes('표면') || tab.includes('운동') ? 2400 : 1300)

  const r = await page.evaluate(() => {
    const px = n => Math.round(n)
    const out = { grids: [], tall: [] }
    /* 격자마다 칸들의 아래끝을 비교 — 서로 다르면 그만큼 빈 구간 */
    document.querySelectorAll('main .grid').forEach((g, gi) => {
      const cs = getComputedStyle(g)
      if (cs.display !== 'grid') return
      const kids = [...g.children].filter(k => k.getBoundingClientRect().height > 0)
      if (kids.length < 2) return
      const rows = {}
      kids.forEach(k => {
        const b = k.getBoundingClientRect()
        const top = px(b.top)
        ;(rows[top] = rows[top] || []).push({ tag: k.className.slice(0, 24), h: px(b.height), bottom: px(b.bottom), inner: px(innerBottom(k) - b.top) })
      })
      Object.entries(rows).forEach(([top, cells]) => {
        if (cells.length < 2) return
        const maxB = Math.max(...cells.map(c => c.bottom))
        cells.forEach(c => {
          const boxGap = maxB - c.bottom          // 칸 자체가 짧아 남는 자리
          const inGap = c.h - c.inner             // 칸은 큰데 안이 비어 있는 것
          if (boxGap > 40 || inGap > 40) out.grids.push({ gi, top: +top, cell: c.tag, boxGap, inGap, h: c.h })
        })
      })
    })
    function innerBottom(el) {
      let b = el.getBoundingClientRect().top
      const walk = n => {
        for (const c of n.children) {
          const r = c.getBoundingClientRect()
          if (r.height > 0 && r.width > 0) { b = Math.max(b, r.bottom); walk(c) }
        }
      }
      walk(el)
      return b
    }
    const m = document.querySelector('main')
    return { ...out, scrollH: px(m.scrollHeight), clientH: px(m.clientHeight) }
  })

  const worst = r.grids.sort((a, b) => Math.max(b.boxGap, b.inGap) - Math.max(a.boxGap, a.inGap)).slice(0, 4)
  const over = r.scrollH - r.clientH
  console.log(`\n${grade} ${tab}  높이 ${r.scrollH}/${r.clientH}${over > 0 ? ` (넘침 ${over})` : ' ✓'}`)
  if (!worst.length) console.log('   빈 구간 없음')
  worst.forEach(w => console.log(`   ${w.cell.padEnd(24)} 칸높이 ${String(w.h).padStart(4)}  아래남음 ${String(w.boxGap).padStart(4)}  안쪽빔 ${String(w.inGap).padStart(4)}`))

  await page.screenshot({ path: `capture/audit/${VW}-${grade}-${tab.replace(/[·\s]/g, '')}.png` })
}
await browser.close()
