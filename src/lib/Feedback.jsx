import React, { useEffect, useRef, useState } from 'react'
import { fmtKST } from './astro.js'

/*
 * 잘못된 내용·오류·건의를 받는 창.
 * 서버가 없는 정적 사이트라 메일로 보낸다. 어느 기기에서나 되고 가입도 필요 없다.
 * 보내는 사람이 굳이 적지 않아도 되도록, 어느 화면에서 무엇을 보고 있었는지를 자동으로 붙인다.
 */
const TO = 'ksb6857@gmail.com'
const REPO = 'https://github.com/choinssam/moon-observatory/issues/new'

const KINDS = [
  { key: 'wrong', ko: '내용이 잘못됐어요', hint: '과학적으로 틀렸거나 교과서와 다른 설명·용어' },
  { key: 'bug', ko: '오류가 나요', hint: '화면이 깨지거나 숫자가 이상하거나 눌러도 안 되는 것' },
  { key: 'idea', ko: '이런 게 있으면 좋겠어요', hint: '수업에 필요한 화면이나 기능' },
  { key: 'class', ko: '수업에 써 봤어요', hint: '아이들 반응이나 수업에서 겪은 일' }
]

export default function Feedback({ onClose, screen, grade, date, loc }) {
  const [kind, setKind] = useState('wrong')
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const boxRef = useRef(null)
  const areaRef = useRef(null)

  useEffect(() => {
    areaRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const kindKo = KINDS.find(k => k.key === kind)?.ko || ''
  /* 어디서 무엇을 보다가 쓴 글인지 — 고치는 사람이 그대로 재현할 수 있게 */
  const context = [
    `화면: ${screen} (${grade}학년 모드)`,
    `보고 있던 날짜·시각: ${fmtKST(date, true)}`,
    `위치: ${loc.name} (북위 ${loc.lat.toFixed(2)}° 동경 ${loc.lon.toFixed(2)}°)`,
    `창 크기: ${window.innerWidth}×${window.innerHeight}`,
    `브라우저: ${navigator.userAgent}`
  ].join('\n')

  const subject = `[달 관찰소] ${kindKo} — ${screen}`
  const body = `${text}\n\n\n──────────\n아래는 자동으로 붙인 정보입니다. 지우지 마시고 그대로 보내 주세요.\n${context}`
  const mailto = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch (e) { setCopied(false) }
  }

  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" ref={boxRef} role="dialog" aria-modal="true" aria-label="의견 보내기">
        <div className="modal-head">
          <h3 style={{ fontSize: '1.1em' }}>의견 보내기</h3>
          <button className="btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <p className="hint" style={{ margin: '0 0 12px' }}>
          잘못된 내용이나 오류를 찾으셨거나, 이런 화면이 있으면 좋겠다 싶으시면 알려 주세요.
          <b style={{ color: 'var(--moon)' }}> 특히 교과서와 다른 용어나 설명</b>은 꼭 알려 주시면 고치겠습니다.
        </p>

        <div className="fb-kinds">
          {KINDS.map(k => (
            <button key={k.key} className={'fb-kind' + (kind === k.key ? ' on' : '')}
              onClick={() => setKind(k.key)} aria-pressed={kind === k.key}>
              <b>{k.ko}</b>
              <span>{k.hint}</span>
            </button>
          ))}
        </div>

        <textarea ref={areaRef} className="fb-text" value={text} onChange={e => setText(e.target.value)}
          rows={6} aria-label="내용"
          placeholder={kind === 'wrong'
            ? '예) 오늘의 달 화면에서 그믐달이라고 나오는데, 교과서에서는 이 모양을 하현달이라고 합니다.'
            : kind === 'bug'
              ? '예) 태블릿에서 별자리 화면을 열면 아무것도 안 보입니다.'
              : '자유롭게 적어 주세요.'} />

        <details className="fb-ctx">
          <summary>함께 보내지는 정보 (어느 화면에서 쓰셨는지)</summary>
          <pre>{context}</pre>
        </details>

        <div className="toolrow" style={{ marginTop: 12 }}>
          <a className="btn on" href={mailto} onClick={() => setTimeout(onClose, 400)}
            style={{ textDecoration: 'none' }}>메일 보내기</a>
          <button className="btn" onClick={copyAll}>{copied ? '복사했습니다' : '내용 복사'}</button>
          <a className="btn" href={REPO} target="_blank" rel="noreferrer"
            style={{ textDecoration: 'none' }}>깃허브에 남기기</a>
        </div>
        <p className="hint">
          '메일 보내기'를 누르면 쓰시던 메일 프로그램이 열립니다. 열리지 않으면 <b>내용 복사</b>를 누른 뒤
          <b> {TO}</b> 로 붙여넣어 보내 주세요.
        </p>
      </div>
    </div>
  )
}
