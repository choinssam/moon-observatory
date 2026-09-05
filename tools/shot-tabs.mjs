/** 모든 탭을 화면 크기별로 찍는다. node tools/shot-tabs.mjs 1920x1080,1366x768 [big] */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.URL || 'http://localhost:5183/'
const sizes = (process.argv[2] || '1920x1080,1366x768').split(',').map(s => s.split('x').map(Number))
const opts = process.argv[3] || ''
const only = process.argv[4] || ''
const sleep = ms => new Promise(r => setTimeout(r, ms))
const TABS = [
  ['4학년', '위상 만들기'], ['4학년', '달 표면'], ['4학년', '오늘의 달'], ['4학년', '한 달 보기'],
  ['4학년', '태양계'], ['4학년', '별자리'], ['4학년', '밀물·썰물'], ['4학년', '일식·월식'],
  ['6학년', '지구의 운동'], ['6학년', '하루의 태양과 달'], ['6학년', '계절별 별자리'], ['6학년', '계절 변화']
]
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new',
  args: ['--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
fs.mkdirSync('capture/tabs', { recursive: true })
const page = await browser.newPage()
const click = async (sel, t) => {
  await page.evaluate((s, x) => {
    const e = [...document.querySelectorAll(s)].find(q => q.textContent.trim().includes(x)); e && e.click()
  }, sel, t); await sleep(350)
}
for (const [VW, VH] of sizes) {
  await page.setViewport({ width: VW, height: VH })
  for (const [grade, tab] of TABS) {
    if (only && !tab.includes(only)) continue
    await page.goto(URL, { waitUntil: 'networkidle0' })
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle0' })
    await click('.seg button', grade)
    await click('[role=tab]', tab)
    if (opts.includes('big')) await click('.topbar .btn', '큰 글씨')
    await sleep(2200)
    const m = await page.evaluate(() => {
      const main = document.querySelector('main')
      return { scrollH: main.scrollHeight, clientH: main.clientHeight }
    })
    const name = `${grade}-${tab}`.replace(/[·\s]/g, '')
    const file = `capture/tabs/${VW}x${VH}${opts ? '-' + opts : ''}-${name}.png`
    await page.screenshot({ path: file })
    console.log(`${VW}x${VH} ${grade} ${tab}: 스크롤 ${m.scrollH}/${m.clientH}${m.scrollH > m.clientH + 100 ? '  ← 넘침 ' + (m.scrollH - m.clientH) : ''}`)
  }
}
await browser.close()
