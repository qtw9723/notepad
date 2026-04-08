# Share Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노트별 공유 링크(`/share/:noteId`)를 생성하고, 인증 없이 접근 가능한 뷰 전용 공유 페이지를 제공한다.

**Architecture:** react-router-dom을 추가하고, `main.jsx`에서 `/share/:noteId` → SharePage, `/*` → 기존 App으로 분기한다. SharePage는 `api.getNote()`로 노트를 fetch해 마크다운 렌더링만 한다. Editor 툴바에 링크 복사 버튼을 추가한다.

**Tech Stack:** react-router-dom v7, React 19, Tailwind CSS 4, lucide-react

---

## Task 1: react-router-dom 설치 + vercel.json 추가

**Files:**
- Modify: `package.json` (npm install)
- Create: `vercel.json`

- [ ] **Step 1: react-router-dom 설치**

```bash
npm install react-router-dom
```

Expected: `package.json`의 dependencies에 `"react-router-dom"` 추가됨.

- [ ] **Step 2: vercel.json 생성**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```

Expected: `✓ built in ...`

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json vercel.json
git commit -m "feat: react-router-dom 추가, Vercel SPA fallback 설정"
```

---

## Task 2: 라우팅 설정 (main.jsx)

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: main.jsx 전체 교체**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SharePage from './components/SharePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/share/:noteId" element={<SharePage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 2: 개발 서버 실행 후 기존 앱 동작 확인**

```bash
npm run dev
```

`http://localhost:5173` 접속 → 기존 앱 정상 동작 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/main.jsx
git commit -m "feat: BrowserRouter + Routes 설정"
```

---

## Task 3: SharePage 컴포넌트 생성

**Files:**
- Create: `src/components/SharePage.jsx`

- [ ] **Step 1: SharePage.jsx 생성**

```jsx
import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../lib/api'

export default function SharePage() {
  const { noteId } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.getNote(noteId)
      .then(data => {
        if (data) setNote(data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [noteId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-pulse text-[#484f58] text-sm">불러오는 중...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#484f58] text-sm">노트를 찾을 수 없습니다</p>
          <Link to="/" className="text-[#7c6af5] text-sm mt-2 block hover:opacity-80">
            ← Notepad로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#21262d] bg-[#161b22]">
        <div className="max-w-[760px] mx-auto px-6 py-3">
          <Link to="/" className="text-[#7c6af5] text-sm font-medium hover:opacity-80 transition-opacity">
            ← Notepad
          </Link>
        </div>
      </header>
      <main className="max-w-[760px] mx-auto px-6 py-10">
        <h1
          className="text-[2.2rem] font-bold text-[#e6edf3] leading-tight mb-4"
          style={{ letterSpacing: '-0.02em' }}
        >
          {note.title || <span className="text-[#21262d]">제목 없음</span>}
        </h1>
        <div className="border-t border-[#21262d] mb-6" />
        {note.content_type === 'markdown' ? (
          <div className="markdown-body text-[#cdd9e5] text-[1rem]">
            {note.content
              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              : <p className="text-[#484f58] italic text-sm">내용이 없습니다</p>
            }
          </div>
        ) : note.content_type === 'html' ? (
          <div
            className="text-[#cdd9e5] text-[1rem] leading-[2.0]"
            dangerouslySetInnerHTML={{ __html: note.content || '' }}
          />
        ) : (
          <p className="text-[#cdd9e5] text-[1rem] leading-[2.0] whitespace-pre-wrap">
            {note.content}
          </p>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: `/share/` 경로 동작 확인**

개발 서버에서 존재하는 noteId를 복사 후 `http://localhost:5173/share/{noteId}` 접속.
→ 노트 제목 + 마크다운 렌더링 확인.
→ 없는 ID 접속 시 "노트를 찾을 수 없습니다" 표시 확인.
→ "← Notepad" 클릭 시 메인 앱으로 이동 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/SharePage.jsx
git commit -m "feat: 공유 페이지 컴포넌트 추가"
```

---

## Task 4: Editor 툴바에 링크 복사 버튼 추가

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: import에 Link 아이콘 추가**

`src/components/Editor.jsx` 상단 lucide-react import에 `Link` 추가:

```jsx
import { FileText, Code, FileCode2, Pencil, ArrowLeft, Link } from 'lucide-react'
```

- [ ] **Step 2: copied 상태 + copyShareLink 함수 추가**

`Editor` 컴포넌트 내부, `saving`/`saved` useState 바로 아래에 추가:

```jsx
const [copied, setCopied] = useState(false)

const copyShareLink = () => {
  navigator.clipboard.writeText(`${window.location.origin}/share/${noteId}`)
  setCopied(true)
  setTimeout(() => setCopied(false), 1500)
}
```

- [ ] **Step 3: 데스크탑 툴바에 버튼 추가**

데스크탑 뷰 툴바 (`flex items-center gap-2 px-6 py-2.5 border-b ...`) 안에서, `canEdit` 블록 바로 앞에 추가:

```jsx
{canEdit && (
  <button
    onClick={copyShareLink}
    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
  >
    <Link size={11} />
    {copied ? '복사됨' : '공유'}
  </button>
)}
```

전체 툴바 블록은 다음과 같은 모습이 됨:

```jsx
<div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
  <div className="flex bg-[#0d1117] rounded-lg p-0.5 gap-0.5">
    {/* 콘텐츠 타입 버튼들 */}
  </div>

  {isSplit && (
    <span className="text-[11px] text-[#484f58] select-none">미리보기 자동</span>
  )}

  <div className="flex-1" />

  {canEdit && (
    <button
      onClick={copyShareLink}
      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
    >
      <Link size={11} />
      {copied ? '복사됨' : '공유'}
    </button>
  )}

  {canEdit ? (
    <span className={`text-[11px] transition-all duration-300 ${
      saved ? 'text-[#58a6ff] opacity-100' : saving ? 'text-[#8b949e] opacity-100' : 'opacity-0'
    }`}>
      {saved ? '저장됨' : '저장 중...'}
    </span>
  ) : (
    <span className="text-[11px] text-[#484f58]">읽기 전용</span>
  )}
</div>
```

- [ ] **Step 4: 동작 확인**

1. 노트 선택 → 툴바에 "공유" 버튼 표시 확인
2. 클릭 → "복사됨" 으로 1.5초 표시 후 원복 확인
3. 클립보드에 복사된 URL(`http://localhost:5173/share/{noteId}`) 새 탭에서 열어 공유 페이지 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/Editor.jsx
git commit -m "feat: Editor 툴바에 공유 링크 복사 버튼 추가"
```

---

## Task 5: 배포

- [ ] **Step 1: 최종 빌드 확인**

```bash
npm run build
```

Expected: `✓ built in ...`

- [ ] **Step 2: push**

```bash
git push origin main
```

Vercel이 자동 배포 시작. `vercel.json`의 rewrites 설정으로 `/share/:noteId` 새로고침도 정상 동작.
