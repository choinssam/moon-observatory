import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--window-size=1280,760', '--hide-scrollbars', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 760 })
async function click(sel, text) { await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().includes(t)); el && el.click() }, sel, text); await sleep(500) }
fs.mkdirSync('capture/check', { recursive: true })
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' }); await page.evaluate(() => localStorage.clear())
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle0' }); await sleep(800)
await click('.seg button', '6학년'); await click('[role=tab]', '계절별 별자리'); await sleep(1500)
await click('.seg button', '겨울'); await sleep(1500)
await page.screenshot({ path: 'capture/check/g6-stars.png' })
await click('[role=tab]', '하루의 태양'); await sleep(1500)
await page.screenshot({ path: 'capture/check/g6-sun.png' })
await click('[role=tab]', '지구의 운동'); await sleep(2000)
await page.screenshot({ path: 'capture/check/g6-earth.png' })
await click('.seg button', '4학년'); await click('[role=tab]', '태양계'); await sleep(2500)
await page.screenshot({ path: 'capture/check/g4-solar.png' })
await click('[role=tab]', '별자리'); await sleep(1500)
await page.screenshot({ path: 'capture/check/g4-stars.png' })
await browser.close(); console.log('done')
