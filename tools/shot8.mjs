import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe='C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await puppeteer.launch({executablePath:exe,headless:'new',args:['--window-size=1440,900','--hide-scrollbars','--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist']})
const page=await b.newPage(); await page.setViewport({width:1440,height:900})
const click=async(sel,t)=>{await page.evaluate((s,x)=>{const e=[...document.querySelectorAll(s)].find(q=>q.textContent.trim().includes(x));e&&e.click()},sel,t);await sleep(500)}
fs.mkdirSync('capture/check',{recursive:true})
await page.goto('http://localhost:5183/',{waitUntil:'networkidle0'}); await page.evaluate(()=>localStorage.clear())
await page.goto('http://localhost:5183/',{waitUntil:'networkidle0'}); await sleep(900)
await click('[role=tab]','위상 만들기'); await sleep(1500)
await page.evaluate(()=>{const t=document.querySelector('.termtable'); t&&t.scrollIntoView({block:'center'})}); await sleep(600)
await page.screenshot({path:'capture/check/terms.png'})
await click('[role=tab]','오늘의 달'); await sleep(1400)
await page.screenshot({path:'capture/check/tonight-term.png'})
await page.evaluate(()=>{document.querySelector('.linklike').click()}); await sleep(700)
await page.screenshot({path:'capture/check/feedback.png'})
await b.close(); console.log('done')
