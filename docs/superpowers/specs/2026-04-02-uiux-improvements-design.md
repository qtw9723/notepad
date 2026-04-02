# UI/UX 개선 — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Scope

1. **에디터/프리뷰 비율** — 기본 split 비율 조정
2. **타이포그래피** — 폰트 크기 및 줄간격 가독성 개선
3. **스크롤 싱크** — 에디터 스크롤 시 프리뷰 동기화
4. **반응형 (모바일)** — 모바일에서 list → preview → edit 3단계 뷰

---

## 1. 에디터/프리뷰 비율

현재 `defaultSize={50}` (50:50). 프리뷰를 더 넓게.

**변경:** 에디터 42% / 프리뷰 58% (`defaultSize={42}`)

---

## 2. 타이포그래피

| 항목 | 현재 | 변경 |
|------|------|------|
| 에디터 textarea 폰트 | `0.95rem` | `1rem` |
| 프리뷰 본문 폰트 | `0.95rem` | `1rem` |
| 에디터 줄간격 | `1.9` | `2.0` |
| 제목 input | `2.2rem` | 유지 |

---

## 3. 스크롤 싱크

에디터 textarea 스크롤 비율 → 프리뷰 div에 동기화.

```
scrollTop / (scrollHeight - clientHeight) = 비율
프리뷰.scrollTop = 비율 × (프리뷰.scrollHeight - 프리뷰.clientHeight)
```

- `useRef`로 textarea와 preview div 참조
- textarea `onScroll` 핸들러에서 계산 후 프리뷰 scrollTop 설정
- markdown 모드에서만 활성화 (html도 동일 적용, text는 split 없음)

---

## 4. 반응형 (모바일 ≤ 767px)

### 뷰 상태
```
list  →  (노트 선택)  →  preview  →  (편집 버튼)  →  edit
                                ←  (← 목록 버튼)      ←
```

### 각 뷰
- **list**: 사이드바 전체화면 (기존 사이드바 그대로)
- **preview**: 노트 미리보기 전체화면 + 상단 툴바에 "편집" 버튼 + "← 목록" 버튼
- **edit**: 에디터 전체화면 + 상단 툴바에 "← 목록" 버튼 (split 없음)

### useMobile 훅
```js
// src/hooks/useMobile.js
export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 767)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 767)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}
```

### 상태 관리 (App.jsx)
```js
const isMobile = useMobile()
const [mobileView, setMobileView] = useState('list') // 'list' | 'preview' | 'edit'

// 노트 선택 시
const handleSelect = (id) => {
  setSelectedId(id)
  if (isMobile) setMobileView('preview')
}

// 데스크탑으로 전환 시 list로 리셋
useEffect(() => {
  if (!isMobile) setMobileView('list')
}, [isMobile])
```

### 레이아웃 (App.jsx)
```jsx
// 모바일: 뷰 상태에 따라 사이드바/에디터 show/hide
// 데스크탑: 기존과 동일

<div className="flex h-full bg-[#0d1117]">
  {/* 사이드바: 모바일에서 list 뷰일 때만 */}
  <div className={isMobile && mobileView !== 'list' ? 'hidden' : ''}>
    <Sidebar onSelect={handleSelect} ... />
  </div>

  {/* 에디터: 모바일에서 content 뷰일 때만 */}
  <main className={...}>
    {isMobile && mobileView === 'list' ? null : (
      <Editor
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        ...
      />
    )}
  </main>
</div>
```

### Editor 모바일 동작
- `mobileView === 'preview'`: 프리뷰만 표시, 툴바에 "편집" + "← 목록" 버튼
- `mobileView === 'edit'`: 에디터만 표시 (split 없음), 툴바에 "← 목록" 버튼
- 데스크탑: 기존 split 동작 유지

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useMobile.js` | 신규: 모바일 감지 훅 |
| `src/App.jsx` | useMobile, mobileView 상태, handleSelect 수정 |
| `src/components/Editor.jsx` | 비율, 타이포, 스크롤싱크, 모바일 뷰 |
| `src/components/Sidebar.jsx` | 모바일에서 onSelect 시 App에서 처리 (변경 없음) |
