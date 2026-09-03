import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const URL = 'http://localhost:5183/', OUT = 'capture/06-season', VW = 1280, VH = 760
const exe = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function clickText(page, sel, text) {
  const ok = await page.evaluate((s, t) => {
    const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().includes(t))
    if (!el) return false; el.click(); return true
  }, sel, text)
  if (!ok) throw new Error('못 찾음: ' + text)
  await sleep(320)
}
async function setVal(page, label, v) {
  await page.evaluate((lb, val) => {
    const el = document.querySelector(`input[aria-label="${lb}"]`)
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    s.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, v)
}

const b = await puppeteer.launch({ executablePath: exe, headless: 'new',
  args: ['--window-size=1280,760', '--hide-scrollbars'] })
const page = await b.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())
await page.goto(URL, { waitUntil: 'networkidle0' })
await sleep(700)
await clickText(page, '.seg button', '6학년')
await clickText(page, '[role=tab]', '계절 변화')
await sleep(1400)

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true })
let i = 0
for (const s of ['하지', '춘분', '동지']) {
  await clickText(page, '.btn', s)
  await sleep(400)
  for (let k = 0; k <= 13; k++) {                 // 하루를 훑는다
    await setVal(page, '시각', Math.round(300 + (k / 13) * 900))
    await sleep(55)
    await page.screenshot({ path: path.join(OUT, `frame_${String(i++).padStart(3, '0')}.png`),
      clip: { x: 0, y: 0, width: VW, height: 600 } })
  }
}
await b.close()
console.log('계절 변화 재캡처 완료:', i, '프레임')
