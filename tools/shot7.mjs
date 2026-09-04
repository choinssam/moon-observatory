import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--window-size=1920,900', '--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
async function click(sel, text) { await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().includes(t)); el && el.click() }, sel, text); await sleep(500) }
async function setVal(label, v) { await page.evaluate((lb, val) => { const el = document.querySelector(`input[aria-label="${lb}"]`); const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true })) }, label, v) }
fs.mkdirSync('capture/check', { recursive: true })
for (const [w, h, tag] of [[1920, 900, 'w'], [1280, 760, 'n']]) {
  await page.setViewport({ width: w, height: h })
  await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' }); await page.evaluate(() => localStorage.clear())
  await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' }); await sleep(800)
  await click('.seg button', '4학년')
  await click('[role=tab]', '오늘의 달'); await sleep(1200)
  await setVal('하루 중 시각', 1260); await sleep(500)          // 낮12시 창 기준 +21h = 다음날 09:00
  await page.screenshot({ path: `capture/check/${tag}-tonight-morning.png` })
  await setVal('하루 중 시각', 600); await sleep(500)           // 22:00
  await page.screenshot({ path: `capture/check/${tag}-tonight-night.png` })
  await click('[role=tab]', '태양계'); await sleep(2200)
  await page.screenshot({ path: `capture/check/${tag}-solar.png` })
  await click('[role=tab]', '밀물'); await sleep(900)
  await page.screenshot({ path: `capture/check/${tag}-tide.png` })
  await click('[role=tab]', '일식'); await sleep(1200)
  await page.screenshot({ path: `capture/check/${tag}-eclipse.png` })
  if (tag === 'w') {
    await click('.seg button', '6학년'); await click('[role=tab]', '지구의 운동'); await sleep(2000)
    await page.screenshot({ path: `capture/check/${tag}-earth.png` })
    await click('[role=tab]', '하루의 태양'); await sleep(1200)
    await page.screenshot({ path: `capture/check/${tag}-sun.png` })
    await click('[role=tab]', '계절별 별자리'); await sleep(1500)
    await page.screenshot({ path: `capture/check/${tag}-stars.png` })
  }
}
await browser.close(); console.log('done')
