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
const H=[]
for (const tab of ['위상 만들기','달 표면','오늘의 달','한 달 보기','태양계','별자리','밀물·썰물','일식·월식']) {
  await click('[role=tab]',tab); await sleep(tab==='태양계'||tab==='별자리'||tab==='달 표면'?2200:1200)
  const h=await page.evaluate(()=>{const m=document.querySelector('main');return {sh:m.scrollHeight, ch:m.clientHeight, chars:m.innerText.length}})
  H.push([tab,h.sh,h.ch,h.chars])
  await page.screenshot({path:`capture/check/fold-${tab.replace(/[·\s]/g,'')}.png`})
}
console.log('탭'.padEnd(12),'스크롤높이  화면높이  글자수')
H.forEach(([t,sh,ch,c])=>console.log(String(t).padEnd(12), String(sh).padStart(6), String(ch).padStart(8), String(c).padStart(7)))
await b.close()
