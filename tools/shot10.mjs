import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const exe='C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const b=await puppeteer.launch({executablePath:exe,headless:'new',args:['--window-size=1920,940','--hide-scrollbars','--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist']})
const page=await b.newPage(); await page.setViewport({width:1920,height:940})
const click=async(sel,t)=>{await page.evaluate((s,x)=>{const e=[...document.querySelectorAll(s)].find(q=>q.textContent.trim().includes(x));e&&e.click()},sel,t);await sleep(500)}
fs.mkdirSync('capture/check',{recursive:true})
await page.goto('http://localhost:5183/',{waitUntil:'networkidle0'}); await page.evaluate(()=>localStorage.clear())
await page.goto('http://localhost:5183/',{waitUntil:'networkidle0'}); await sleep(900)
await click('[role=tab]','한 달 보기'); await sleep(2000)
await page.screenshot({path:'capture/check/month-new.png'})
await page.setViewport({width:1280,height:800}); await sleep(900)
await page.screenshot({path:'capture/check/month-new-1280.png'})
await b.close(); console.log('done')
