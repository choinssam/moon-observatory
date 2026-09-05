/** 태양계 탭을 여러 화면 크기로 찍는다. node tools/shot-solar.mjs 1920x1080,1366x768 [big-real-saturn-sun] */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sizes = (process.argv[2] || '2000x1090,1920x1080,1366x768,900x1200').split(',').map(s => s.split('x').map(Number))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new',
  args: ['--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
fs.mkdirSync('C:/projects/moon-observatory/capture/solar', { recursive: true })
for (const [VW, VH] of sizes) {
  const page = await browser.newPage()
  await page.setViewport({ width: VW, height: VH })
  await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.clear())
  await page.evaluate(() => { [...document.querySelectorAll('.seg button')].find(b => b.textContent.includes('4학년'))?.click() })
  await sleep(300)
  await page.evaluate(() => { [...document.querySelectorAll('[role=tab]')].find(b => b.textContent.includes('태양계'))?.click() })
  const opts = process.argv[3] || ''
  if (opts.includes('big')) await page.evaluate(() => { [...document.querySelectorAll('.topbar .btn')].find(b => b.textContent.includes('큰 글씨'))?.click() })
  if (opts.includes('real')) await page.evaluate(() => { [...document.querySelectorAll('.solar-tools .seg button')].find(b => b.textContent.includes('실제'))?.click() })
  if (opts.includes('saturn')) await page.evaluate(() => { [...document.querySelectorAll('.size-cell')].find(b => b.textContent.includes('토성'))?.click() })
  if (opts.includes('sun')) await page.evaluate(() => { [...document.querySelectorAll('.size-cell')].find(b => b.textContent.includes('태양'))?.click() })
  await sleep(2500)
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
  const info = await page.evaluate(() => {
    const q = s => document.querySelector(s)?.getBoundingClientRect()
    const r = s => { const b = q(s); return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null }
    return { orbit: r('.solar-orbit'), globe: r('.solar-globe'), info: r('.solar-info'), sizes: r('.solar-sizes'), footer: r('footer'),
      scrollH: document.querySelector('main').scrollHeight, clientH: document.querySelector('main').clientHeight }
  })
  console.log(`${VW}x${VH}`, JSON.stringify(info))
  await page.screenshot({ path: `C:/projects/moon-observatory/capture/solar/${VW}x${VH}${opts ? '-' + opts : ''}.png` })
  if (errs.length) console.log('console errors:', errs)
  await page.close()
}
await browser.close()
