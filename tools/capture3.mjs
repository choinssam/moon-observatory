/** 새 배치로 바뀐 다섯 화면을 다시 캡처한다. node tools/capture3.mjs */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const URL = 'http://localhost:5183/', OUT = 'capture', VW = 1280, VH = 760
const exe = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const ONLY = process.argv.slice(2)
const want = n => !ONLY.length || ONLY.some(o => n.includes(o))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const CLIP_TOP = { x: 0, y: 0, width: VW, height: 620 }
const CLIP_FULL = { x: 0, y: 0, width: VW, height: VH }

async function clickText(page, sel, text) {
  const ok = await page.evaluate((s, t) => {
    const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().includes(t))
    if (!el) return false; el.click(); return true
  }, sel, text)
  if (!ok) throw new Error('못 찾음: ' + text)
  await sleep(340)
}
async function setVal(page, label, v) {
  await page.evaluate((lb, val) => {
    const el = document.querySelector(`input[aria-label="${lb}"]`)
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    s.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, v)
}
function prep(d) { const p = path.join(OUT, d); fs.rmSync(p, { recursive: true, force: true }); fs.mkdirSync(p, { recursive: true }); }
const shot = (page, d, i, clip) => page.screenshot({ path: path.join(OUT, d, `frame_${String(i).padStart(3, '0')}.png`), clip })

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new',
  args: ['--window-size=1280,760', '--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 })

async function fresh(tab, grade) {
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(700)
  if (grade) await clickText(page, '.seg button', grade)
  await clickText(page, '[role=tab]', tab)
  await sleep(900)
}
async function canvasBox(page) {
  return page.$eval('.stage canvas', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
}

/* 1. 달 표면 — 정사각 무대의 큰 달을 돌린다 */
if (want('02-globe')) {
  const n = '02-globe'; prep(n)
  await fresh('달 표면'); await sleep(2400)
  const b = await canvasBox(page)
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let i = 0; i < 40; i++) { await page.mouse.move(cx - i * 7, cy + Math.sin(i / 7) * 12); await sleep(45); await shot(page, n, i, CLIP_FULL) }
  await page.mouse.up(); console.log('✓ 달 표면')
}

/* 2. 오늘의 달 — 하늘 돔 위를 지나는 달 */
if (want('04-tonight')) {
  const n = '04-tonight'; prep(n)
  await fresh('오늘의 달'); await sleep(1200)
  for (let i = 0; i < 40; i++) { await setVal(page, '하루 중 시각', Math.round(i / 39 * 1430)); await sleep(60); await shot(page, n, i, CLIP_FULL) }
  console.log('✓ 오늘의 달')
}

/* 3. 별자리 — 3D 하늘: 시각을 밀어 별이 돌고, 끌어서 둘러본다 */
if (want('07-stars')) {
  const n = '07-stars'; prep(n)
  await fresh('별자리'); await sleep(1500)
  await setVal(page, '시각', 21 * 60); await sleep(400)
  let i = 0
  for (let k = 0; k < 26; k++) { await setVal(page, '시각', 21 * 60 + k * 20); await sleep(70); await shot(page, n, i++, CLIP_FULL) }
  const b = await canvasBox(page)
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let k = 1; k <= 18; k++) { await page.mouse.move(cx + k * 14, cy + k * 3); await sleep(60); await shot(page, n, i++, CLIP_FULL) }
  await page.mouse.up()
  console.log('✓ 별자리', i, '프레임')
}

/* 4. 태양계 — 행성을 하나씩 눌러 실제 사진으로 */
if (want('08-planets')) {
  const n = '08-planets'; prep(n)
  await fresh('태양계'); await sleep(2200)
  let i = 0
  for (const ko of ['지구', '화성', '목성', '토성', '천왕성', '해왕성', '금성', '태양']) {
    await page.evaluate(t => {
      const el = [...document.querySelectorAll('.stage svg text')].find(e => e.textContent === t)
      el.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }, ko)
    await sleep(1500)
    for (let k = 0; k < 6; k++) { await shot(page, n, i++, CLIP_FULL); await sleep(150) }
  }
  console.log('✓ 태양계', i, '프레임')
}

/* 5. 밀물·썰물 — 세 그림이 한 줄에 */
if (want('09-tide')) {
  const n = '09-tide'; prep(n)
  await fresh('밀물·썰물'); await sleep(900)
  for (let i = 0; i < 44; i++) { await setVal(page, '하루 중 시각', (i / 44).toFixed(3)); await sleep(55); await shot(page, n, i, CLIP_FULL) }
  console.log('✓ 밀물·썰물')
}

await browser.close()
console.log('\n완료')
