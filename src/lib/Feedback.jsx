import React, { useEffect, useRef, useState } from 'react'
import { fmtKST } from './astro.js'
import { sendFeedback, ENDPOINT } from './feedbackStore.js'

/*
 * 잘못된 내용·오류·건의를 받는 창.
 * 보낸 글은 선생님 계정의 저장소에 쌓인다(docs/의견-받기-설정.md).
 * 저장소를 아직 안 붙였거나 전송이 막히면, 글이 날아가지 않도록 복사·메일 길을 남겨 둔다.
 */
const TO = 'choinssam@gmail.com'
const REPO = 'https://github.com/choinssam/moon-observatory/issues/new'

const KINDS = [
  { key: '내용이 잘못됐어요', hint: '과학적으로 틀렸거나 교과서와 다른 설명·용어' },
  { key: '오류가 나요', hint: '화면이 깨지거나 숫자가 이상하거나 눌러도 안 되는 것' },
  { key: '이런 게 있으면 좋겠어요', hint: '수업에 필요한 화면이나 기능' },
  { key: '수업에 써 봤어요', hint: '아이들 반응이나 수업에서 겪은 일' }
]

export default function Feedback({ onClose, screen, grade, date, loc }) {
  const [kind, setKind] = useState(KINDS[0].key)
  const [text, setText] = useState('')
  const [state, setState] = useState('write')   // write | sending | sent | nostore | failed
  const [copied, setCopied] = useState(false)
  const areaRef = useRef(null)

  useEffect(() => {
    areaRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape' && state !== 'sending') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, state])

  const payload = {
    kind,
    screen,
    grade,
    text: text.trim(),
    when: fmtKST(date, true),
    loc: `${loc.name} (북위 ${loc.lat.toFixed(2)}° 동경 ${loc.lon.toFixed(2)}°)`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    ua: navigator.userAgent
  }
  const asText =
    `[달 관찰소] ${kind} — ${screen}\n\n${payload.text}\n\n` +
    `──────────\n화면: ${screen} (${grade}학년 모드)\n보던 날짜: ${payload.when}\n` +
    `위치: ${payload.loc}\n창 크기: ${payload.viewport}\n브라우저: ${payload.ua}`

  async function submit() {
    if (!payload.text) { areaRef.current?.focus(); return }
    setState('sending')
    setState(await sendFeedback(payload))
  }
  async function copyAll() {
    try {
      await navigator.clipboard.writeText(asText)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      /* 클립보드가 막힌 환경 — 글상자를 통째로 골라 준다 */
      areaRef.current?.select()
    }
  }
  const mailto = `mailto:${TO}?subject=${encodeURIComponent(`[달 관찰소] ${kind} — ${screen}`)}` +
    `&body=${encodeURIComponent(asText)}`

  /* ---------- 보낸 뒤 ---------- */
  if (state === 'sent') {
    return (
      <Shell onClose={onClose} title="보냈습니다">
        <p style={{ color: 'var(--text-2)', margin: 0 }}>
          고맙습니다. 잘 받았습니다. 고치고 나면 사이트에 반영해 두겠습니다.
        </p>
        <div className="toolrow" style={{ marginTop: 16 }}>
          <button className="btn on" onClick={onClose}>닫기</button>
        </div>
      </Shell>
    )
  }
  if (state === 'nostore' || state === 'failed') {
    return (
      <Shell onClose={onClose} title={state === 'failed' ? '보내지 못했습니다' : '한 번만 더 눌러 주세요'}>
        <p style={{ color: 'var(--text-2)', margin: 0 }}>
          {state === 'failed'
            ? '인터넷이 잠깐 끊겼거나 보내는 길이 막혔습니다. 쓰신 글은 그대로 있습니다 —'
            : '아직 받는 곳이 연결되지 않았습니다. 쓰신 글은 그대로 있습니다 —'}
          {' '}아래 <b>내용 복사</b>를 누른 뒤 <b>{TO}</b> 로 붙여넣어 보내 주시면 확실합니다.
        </p>
        <textarea className="fb-text" readOnly value={asText} rows={7} ref={areaRef}
          style={{ marginTop: 12 }} onFocus={e => e.target.select()} />
        <div className="toolrow" style={{ marginTop: 12 }}>
          <button className="btn on" onClick={copyAll}>{copied ? '복사했습니다' : '내용 복사'}</button>
          <a className="btn" href={mailto} style={{ textDecoration: 'none' }}>메일 앱으로 열기</a>
          <a className="btn" href={REPO} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            깃허브에 남기기
          </a>
          <div className="spacer" />
          <button className="btn" onClick={() => setState('write')}>다시 쓰기</button>
        </div>
      </Shell>
    )
  }

  /* ---------- 쓰는 중 ---------- */
  return (
    <Shell onClose={onClose} title="의견 보내기">
      <p className="hint" style={{ margin: '0 0 12px' }}>
        잘못된 내용이나 오류를 찾으셨거나, 이런 화면이 있으면 좋겠다 싶으시면 알려 주세요.
        <b style={{ color: 'var(--moon)' }}> 특히 교과서와 다른 용어나 설명</b>은 꼭 알려 주시면 고치겠습니다.
      </p>

      <div className="fb-kinds">
        {KINDS.map(k => (
          <button key={k.key} className={'fb-kind' + (kind === k.key ? ' on' : '')}
            onClick={() => setKind(k.key)} aria-pressed={kind === k.key}>
            <b>{k.key}</b>
            <span>{k.hint}</span>
          </button>
        ))}
      </div>

      <textarea ref={areaRef} className="fb-text" value={text} onChange={e => setText(e.target.value)}
        rows={6} aria-label="내용"
        placeholder={kind === '내용이 잘못됐어요'
          ? '예) 오늘의 달 화면에서 그믐달이라고 나오는데, 교과서에서는 이 모양을 하현달이라고 합니다.'
          : kind === '오류가 나요'
            ? '예) 태블릿에서 별자리 화면을 열면 아무것도 안 보입니다.'
            : '자유롭게 적어 주세요.'} />

      <details className="fb-ctx">
        <summary>함께 보내지는 정보 (어느 화면에서 쓰셨는지)</summary>
        <pre>{`화면: ${screen} (${grade}학년 모드)\n보던 날짜: ${payload.when}\n위치: ${payload.loc}\n창 크기: ${payload.viewport}\n브라우저: ${payload.ua}`}</pre>
      </details>

      <div className="toolrow" style={{ marginTop: 12 }}>
        <button className="btn on" onClick={submit} disabled={state === 'sending' || !text.trim()}>
          {state === 'sending' ? '보내는 중…' : '보내기'}
        </button>
        <button className="btn" onClick={copyAll}>{copied ? '복사했습니다' : '내용 복사'}</button>
        <div className="spacer" />
        <button className="btn" onClick={onClose}>취소</button>
      </div>
      {!ENDPOINT && (
        <p className="hint">
          지금은 받는 곳이 아직 연결되지 않아, 보내기를 누르면 붙여넣어 보내실 수 있게 정리해 드립니다.
        </p>
      )}
    </Shell>
  )
}

function Shell({ onClose, title, children }) {
  return (
    <div className="modal-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3 style={{ fontSize: '1.1em' }}>{title}</h3>
          <button className="btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
