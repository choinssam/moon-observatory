/*
 * 의견을 어디에 쌓을지 정하는 곳.
 *
 * ENDPOINT 에 주소를 넣으면 그리로 보내 쌓입니다.
 * 비워 두면 보내기 단추가 '내용 복사'로만 동작합니다.
 *
 * 설정 방법은 docs/의견-받기-설정.md 를 보세요.
 * (구글 스프레드시트에 쌓는 방법 · 3분이면 됩니다)
 */
export const ENDPOINT = ''

/** 보낸 것을 브라우저에도 남겨 둔다 — 전송이 실패해도 글이 날아가지 않게 */
const LOCAL_KEY = 'moon-obs:feedback-drafts'

function keepLocal(payload) {
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    prev.unshift(payload)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prev.slice(0, 20)))
  } catch (e) { /* 저장 못 해도 보내기는 계속한다 */ }
}

/**
 * 의견을 보낸다.
 * @returns {Promise<'sent'|'nostore'|'failed'>}
 */
export async function sendFeedback(payload) {
  keepLocal(payload)
  if (!ENDPOINT) return 'nostore'
  try {
    /* text/plain 으로 보내면 사전 요청(preflight) 없이 바로 간다.
       구글 앱스 스크립트는 응답을 읽을 수 없으므로(no-cors), 오류가 없으면 보낸 것으로 본다. */
    await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    return 'sent'
  } catch (e) {
    return 'failed'
  }
}
