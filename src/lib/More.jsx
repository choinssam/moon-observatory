import React, { createContext, useContext, useEffect, useState } from 'react'

/*
 * 설명을 접어 두는 칸.
 * 초등 학습자에게는 글이 많으면 정작 봐야 할 그림을 못 본다.
 * 화면에는 핵심만 두고, 더 알고 싶을 때만 펼치게 한다.
 * 선생님이 한 번에 다 보고 싶을 때는 위쪽 '설명 펼치기'로 모두 연다.
 */
export const ExpandAll = createContext(false)

export default function More({ title = '더 알아보기', tag, count, children }) {
  const all = useContext(ExpandAll)
  const [open, setOpen] = useState(all)
  useEffect(() => { setOpen(all) }, [all])

  return (
    <div className={'more' + (open ? ' open' : '')}>
      <button className="more-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="more-mark" aria-hidden="true">▸</span>
        <span>{title}</span>
        {count ? <span className="more-count">{count}</span> : null}
        {tag ? <span className="std extra">{tag}</span> : null}
      </button>
      {open && <div className="more-body">{children}</div>}
    </div>
  )
}
