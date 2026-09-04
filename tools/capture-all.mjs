/**
 * 열 화면을 현재 배치로 모두 다시 캡처한다.
 *   node tools/capture-all.mjs            전부
 *   node tools/capture-all.mjs 03 07      번호로 고르기
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const URL = 'http://localhost:5183/', OUT = 'capture', VW = 1280, VH = 760
const exe = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const ONLY = process.argv.slice(2)
const want = n => !ONLY.length || ONLY.some(o => n.startsWith(o))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const FULL = { x: 0, y: 0, width: VW, height: VH }

const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  args: ['--window-size=1280,760', '--hide-scrollbars', '--use-gl=angle',
         '--enable-webgl', '--ignore-gpu-blocklist', '--force-device-scale-factor=1']
})
const page = await browser.newPage()
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 })

async function clickText(sel, text) {
  const ok = await page.evaluate((s, t) => {
    const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().includes(t))
    if (!el) return false; el.click(); return true
  }, sel, text)
  if (!ok) throw new Error('못 찾음: ' + text)
  await sleep(340)
}
async function setVal(label, v) {
  await page.evaluate((lb, val) => {
    const el = document.querySelector(`input[aria-label="${lb}"]`)
    if (!el) throw new Error('슬라이더 없음: ' + lb)
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    s.call(el, String(val)); el.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, v)
}
function prep(d) { const p = path.join(OUT, d); fs.rmSync(p, { recursive: true, force: true }); fs.mkdirSync(p, { recursive: true }) }
const shot = (d, i) => page.screenshot({ path: path.join(OUT, d, `frame_${String(i).padStart(3, '0')}.png`), clip: FULL })

async function fresh(tab, grade) {
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.clear())
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(700)
  if (grade) await clickText('.seg button', grade)
  await clickText('[role=tab]', tab)
  await sleep(900)
}
async function canvasBox() {
  return page.$eval('.stage canvas', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
}

/* 1. 위상 만들기 — 한 달 한 바퀴 */
if (want('01')) {
  const n = '01-phase'; prep(n)
  await fresh('위상 만들기'); await sleep(600)
  for (let i = 0; i < 40; i++) { await setVal('달의 위상', (i / 40).toFixed(3)); await sleep(70); await shot(n, i) }
  console.log('✓ 위상 만들기')
}

/* 2. 달 표면 — 끌어 돌리기 */
if (want('02')) {
  const n = '02-globe'; prep(n)
  await fresh('달 표면'); await sleep(2400)
  const b = await canvasBox()
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let i = 0; i < 38; i++) { await page.mouse.move(cx - i * 7, cy + Math.sin(i / 7) * 12); await sleep(45); await shot(n, i) }
  await page.mouse.up()
  console.log('✓ 달 표면')
}

/* 3. 한 달 보기 — 30일 훑기 (달이 왼쪽에 크게) */
if (want('03')) {
  const n = '03-month'; prep(n)
  await fresh('한 달 보기'); await sleep(1600)
  const total = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.card')].find(c => c.querySelector('h3')?.textContent.includes('한 달 동안'))
    return card ? card.querySelectorAll('button').length : 0
  })
  const N = Math.min(30, total)
  for (let i = 0; i < N; i++) {
    await page.evaluate(k => {
      const card = [...document.querySelectorAll('.card')].find(c => c.querySelector('h3')?.textContent.includes('한 달 동안'))
      card.querySelectorAll('button')[k].click()
    }, i)
    await sleep(110); await shot(n, i)
  }
  console.log('✓ 한 달 보기', N, '칸')
}

/* 4. 오늘의 달 — 뜰 때부터 질 때까지 */
if (want('04')) {
  const n = '04-tonight'; prep(n)
  await fresh('오늘의 달'); await sleep(1200)
  for (let i = 0; i < 40; i++) { await setVal('하루 중 시각', Math.round(i / 39 * 1430)); await sleep(60); await shot(n, i) }
  console.log('✓ 오늘의 달')
}

/* 5. 지구의 운동 (6학년) */
if (want('05')) {
  const n = '05-earth'; prep(n)
  await fresh('지구의 운동', '6학년'); await sleep(2000)
  for (let i = 0; i < 44; i++) { await setVal('일 년 중 날짜', Math.round(i / 43 * 364)); await sleep(60); await shot(n, i) }
  console.log('✓ 지구의 운동')
}

/* 6. 계절 변화 (6학년) */
if (want('06')) {
  const n = '06-season'; prep(n)
  await fresh('계절 변화', '6학년'); await sleep(1400)
  let i = 0
  for (const s of ['춘분', '하지', '추분', '동지', '하지', '동지']) {
    await clickText('.btn', s); await sleep(260)
    for (let k = 0; k < 5; k++) { await shot(n, i++); await sleep(60) }
  }
  console.log('✓ 계절 변화', i)
}

/* 7. 별자리 — 별이 돌고, 끌어서 둘러보기 */
if (want('07')) {
  const n = '07-stars'; prep(n)
  await fresh('별자리'); await sleep(1600)
  await setVal('시각', 21 * 60); await sleep(500)
  let i = 0
  for (let k = 0; k < 24; k++) { await setVal('시각', 21 * 60 + k * 20); await sleep(70); await shot(n, i++) }
  const b = await canvasBox()
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2
  await page.mouse.move(cx, cy); await page.mouse.down()
  for (let k = 1; k <= 16; k++) { await page.mouse.move(cx + k * 14, cy + k * 3); await sleep(60); await shot(n, i++) }
  await page.mouse.up()
  console.log('✓ 별자리', i)
}

/* 8. 태양계 — 행성을 하나씩 */
if (want('08')) {
  const n = '08-planets'; prep(n)
  await fresh('태양계'); await sleep(2400)
  let i = 0
  for (const ko of ['지구', '화성', '목성', '토성', '천왕성', '해왕성', '금성', '태양']) {
    await page.evaluate(t => {
      const el = [...document.querySelectorAll('.stage svg text')].find(e => e.textContent === t)
      el.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }, ko)
    await sleep(1500)
    for (let k = 0; k < 5; k++) { await shot(n, i++); await sleep(150) }
  }
  console.log('✓ 태양계', i)
}

/* 9. 밀물·썰물 */
if (want('09')) {
  const n = '09-tide'; prep(n)
  await fresh('밀물·썰물'); await sleep(1000)
  for (let i = 0; i < 40; i++) { await setVal('하루 중 시각', (i / 40).toFixed(3)); await sleep(55); await shot(n, i) }
  console.log('✓ 밀물·썰물')
}

/* 10. 일식·월식 */
if (want('10')) {
  const n = '10-eclipse'; prep(n)
  await fresh('일식·월식'); await sleep(1600)
  let i = 0
  for (const t of ['일식', '월식', '일식', '월식']) {
    await clickText('.seg button', t); await sleep(700)
    for (let k = 0; k < 5; k++) { await shot(n, i++); await sleep(120) }
  }
  console.log('✓ 일식·월식', i)
}

await browser.close()
console.log('\n완료')
