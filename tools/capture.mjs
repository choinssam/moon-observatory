/**
 * 인디스쿨 소개글에 쓸 기능별 화면을 프레임 단위로 캡처한다.
 * 결과: capture/<장면>/frame_000.png ...
 *
 *   node tools/capture.mjs
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const URL = 'http://localhost:5183/'
const OUT = 'capture'
const VW = 1280, VH = 760

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const exe = fs.existsSync(CHROME) ? CHROME : EDGE

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function clickText(page, selector, text) {
  const ok = await page.evaluate((sel, t) => {
    const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(t))
    if (!el) return false
    el.click()
    return true
  }, selector, text)
  if (!ok) throw new Error(`못 찾음: ${selector} "${text}"`)
  await sleep(320)
}

/** React 가 관리하는 input 에 값을 넣는다 */
async function setSlider(page, label, value) {
  await page.evaluate((lb, v) => {
    const el = document.querySelector(`input[aria-label="${lb}"]`)
    if (!el) throw new Error('슬라이더 없음: ' + lb)
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, label, value)
}

async function shoot(page, dir, i, clip) {
  const f = path.join(OUT, dir, `frame_${String(i).padStart(3, '0')}.png`)
  await page.screenshot({ path: f, clip })
}

function prep(dir) {
  const d = path.join(OUT, dir)
  fs.rmSync(d, { recursive: true, force: true })
  fs.mkdirSync(d, { recursive: true })
}

/* 화면 위쪽(머리말 + 무대)만 잘라 담는다 */
const CLIP_TOP = { x: 0, y: 0, width: VW, height: 600 }
const CLIP_FULL = { x: 0, y: 0, width: VW, height: VH }

async function main() {
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: 'new',
    args: ['--window-size=' + VW + ',' + VH, '--force-device-scale-factor=1', '--hide-scrollbars']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 })

  async function fresh(tabName, grade) {
    await page.goto(URL, { waitUntil: 'networkidle0' })
    await page.evaluate(() => localStorage.clear())
    await page.goto(URL, { waitUntil: 'networkidle0' })
    await sleep(700)
    if (grade) await clickText(page, '.seg button', grade)
    await clickText(page, '[role=tab]', tabName)
    await sleep(900)
  }

  /* ---------- 1. 위상 만들기 : 한 달을 한 바퀴 ---------- */
  {
    const name = '01-phase'
    prep(name)
    await fresh('위상 만들기')
    const N = 44
    for (let i = 0; i < N; i++) {
      await setSlider(page, '달의 위상', (i / N).toFixed(3))
      await sleep(70)
      await shoot(page, name, i, CLIP_TOP)
    }
    console.log('✓', name)
  }

  /* ---------- 2. 달 표면 : 돌려보기 ---------- */
  {
    const name = '02-globe'
    prep(name)
    await fresh('달 표면')
    await sleep(2200)                       // 텍스처 로딩
    const box = await page.$eval('.stage canvas', el => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    })
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    const N = 40
    for (let i = 0; i < N; i++) {
      await page.mouse.move(cx - i * 7, cy + Math.sin(i / 7) * 14)
      await sleep(45)
      await shoot(page, name, i, CLIP_TOP)
    }
    await page.mouse.up()
    console.log('✓', name)
  }

  /* ---------- 3. 한 달 보기 : 30일 훑기 ---------- */
  {
    const name = '03-month'
    prep(name)
    await fresh('한 달 보기')
    await sleep(1500)
    const cells = await page.$$('.card > div > button')
    const N = Math.min(30, cells.length)
    for (let i = 0; i < N; i++) {
      await cells[i].click()
      await sleep(90)
      await shoot(page, name, i, CLIP_FULL)
    }
    console.log('✓', name, `(${N}칸)`)
  }

  /* ---------- 4. 오늘의 달 : 하루 동안의 길 ---------- */
  {
    const name = '04-tonight'
    prep(name)
    await fresh('오늘의 달')
    await sleep(1200)
    const N = 40
    for (let i = 0; i < N; i++) {
      const m = Math.round((i / (N - 1)) * 1430)
      await setSlider(page, '하루 중 시각', m)
      await sleep(60)
      await shoot(page, name, i, CLIP_FULL)
    }
    console.log('✓', name)
  }

  /* ---------- 5. 지구의 운동 : 공전 + 자전축 ---------- */
  {
    const name = '05-earth'
    prep(name)
    await fresh('지구의 운동', '6학년')
    await sleep(1600)
    const N = 46
    for (let i = 0; i < N; i++) {
      const d = Math.round((i / (N - 1)) * 364)
      await page.evaluate(v => {
        const el = document.querySelector('input[aria-label="일 년 중 날짜"]')
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        s.call(el, String(v))
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }, d)
      await sleep(60)
      await shoot(page, name, i, CLIP_TOP)
    }
    console.log('✓', name)
  }

  /* ---------- 6. 계절 변화 : 절기별 태양 고도 ---------- */
  {
    const name = '06-season'
    prep(name)
    await fresh('계절 변화', '6학년')
    await sleep(1400)
    let i = 0
    for (const s of ['춘분', '하지', '추분', '동지', '하지', '동지']) {
      await clickText(page, '.btn', s)
      await sleep(260)
      for (let k = 0; k < 5; k++) { await shoot(page, name, i++, CLIP_TOP); await sleep(60) }
    }
    console.log('✓', name)
  }

  await browser.close()
  console.log('\n캡처 완료 →', OUT)
}

main().catch(e => { console.error('실패:', e.message); process.exit(1) })
