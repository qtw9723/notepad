# Login Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 화면을 풀스크린 + 글래스 카드 + 보라 팔레트로 재디자인해 앱 본체와 무드를 통일한다.

**Architecture:** `App.jsx`의 오버레이 배경을 불투명 풀스크린으로 교체하고, `LoginPage.jsx`를 글래스 카드 레이아웃으로 전면 재작성한다. Props 인터페이스와 내부 로직(handleSubmit, 에러/로딩 상태)은 그대로 유지한다.

**Tech Stack:** React 19, Tailwind CSS 4 (Vite 플러그인), lucide-react

---

### Task 1: App.jsx 오버레이 배경 변경

**Files:**
- Modify: `src/App.jsx:77-88`

- [ ] **Step 1: 오버레이 div 클래스 교체**

`src/App.jsx`의 `showLoginModal` 블록을 찾아 아래와 같이 수정한다.

변경 전:
```jsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false) }}
>
```

변경 후:
```jsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center"
  style={{
    backgroundColor: '#0d1117',
    backgroundImage: `
      radial-gradient(ellipse 60% 50% at 50% 40%, rgba(157,143,252,0.12) 0%, transparent 70%),
      radial-gradient(circle 1px at center, rgba(157,143,252,0.08) 1px, transparent 1px)
    `,
    backgroundSize: 'auto, 20px 20px',
  }}
  onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false) }}
>
```

- [ ] **Step 2: dev 서버에서 시각 확인**

```bash
npm run dev
```

로그인 버튼 클릭 → 배경이 반투명 블러가 아닌 어두운 단색 + 닷 그리드로 보이는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/App.jsx
git commit -m "style: login overlay to fullscreen dark background"
```

---

### Task 2: LoginPage.jsx 재작성

**Files:**
- Modify: `src/components/LoginPage.jsx`

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

```jsx
import { useState } from 'react'
import { X, ChevronDown, PenLine } from 'lucide-react'

export default function LoginPage({ projects, onSignIn, onClose }) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProject) return
    setError(null)
    setLoading(true)
    try {
      await onSignIn(selectedProject.slug, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* 글래스 카드 */}
      <div
        className="relative rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(157,143,252,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ color: '#606070' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#e2e2e2'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#606070'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={15} />
          </button>
        )}

        {/* 심볼 아이콘 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{
            background: 'rgba(157,143,252,0.15)',
            border: '1px solid rgba(157,143,252,0.3)',
          }}
        >
          <PenLine size={18} color="#9d8ffc" />
        </div>

        {/* 타이틀 */}
        <h1
          className="text-3xl font-bold tracking-tight mb-1"
          style={{ color: '#f0f0f0' }}
        >
          Notepad
        </h1>
        <p className="text-sm mb-8" style={{ color: '#606070' }}>
          프로젝트를 선택하고 비밀번호를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 프로젝트 드롭다운 */}
          <div>
            <label
              className="block mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8b8890' }}
            >
              프로젝트
            </label>
            <div className="relative">
              <select
                value={selectedProject?.id ?? ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value) ?? null
                  setSelectedProject(p)
                  setError(null)
                }}
                required
                className="w-full appearance-none px-4 py-3 rounded-xl text-[15px] transition-colors cursor-pointer focus:outline-none"
                style={{
                  background: '#0a0a0c',
                  border: '1px solid #2a2a38',
                  color: selectedProject ? '#e2e2e2' : '#484f58',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#9d8ffc' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#2a2a38' }}
              >
                <option value="" disabled style={{ color: '#484f58', background: '#0a0a0c' }}>
                  선택...
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id} style={{ background: '#0a0a0c' }}>
                    {p.name}{p.is_master ? ' (마스터)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#606070' }}
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label
              className="block mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8b8890' }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 rounded-xl text-[15px] transition-colors focus:outline-none"
              style={{
                background: '#0a0a0c',
                border: '1px solid #2a2a38',
                color: '#e2e2e2',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#9d8ffc' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#2a2a38' }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-[13px] text-red-400 bg-red-400/10 px-4 py-2.5 rounded-lg">
              {error}
            </p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading || !selectedProject}
            className="w-full py-3 rounded-xl text-[15px] font-semibold transition-colors mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#9d8ffc', color: '#0d0d10' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#b8aeff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#9d8ffc' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: dev 서버에서 시각 확인**

```bash
npm run dev
```

체크리스트:
- 글래스 카드가 닷 그리드 배경 위에 떠 있는지
- 상단 보라 틴트 아이콘 박스 표시되는지
- 인풋 포커스 시 테두리가 `#9d8ffc`로 바뀌는지
- 버튼 hover 시 `#b8aeff`로 밝아지는지
- disabled 상태(프로젝트 미선택)에서 버튼 opacity 떨어지는지

- [ ] **Step 3: 커밋**

```bash
git add src/components/LoginPage.jsx
git commit -m "design: login page glass card redesign with purple palette"
```

---

### Task 3: 정리 및 배포

**Files:**
- Delete: `public/test.html`

- [ ] **Step 1: 브레인스토밍용 목업 파일 삭제**

```bash
git rm public/test.html
git commit -m "chore: remove login design mockup"
```

- [ ] **Step 2: main 푸시 → Vercel 자동 배포**

```bash
git push
```

Vercel 배포 완료 후 실제 URL에서 로그인 화면 최종 확인.
