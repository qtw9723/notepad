# Clipboard Image Paste Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마크다운 에디터에서 클립보드 이미지를 붙여넣으면 Supabase Storage에 업로드하고 퍼블릭 URL을 마크다운에 삽입한다. 노트 삭제 시 해당 이미지도 Storage에서 정리한다.

**Architecture:** 프론트에서 `supabase.storage`를 직접 사용해 `note-images` 버킷의 `images/{noteId}/{uuid}.{ext}` 경로에 업로드한다. Storage 유틸 함수는 `src/lib/storage.js`에 분리하고, Editor 컴포넌트의 모든 textarea에 `onPaste` 핸들러를 붙인다. 노트 삭제 시 `useNotes.js`에서 해당 폴더를 list → remove한다.

**Tech Stack:** React, Supabase JS SDK (`supabase.storage`), Vite + Tailwind

---

## Prerequisite: Supabase Storage 버킷 생성 (수동)

- [ ] Supabase 대시보드 → Storage → New bucket
  - Name: `note-images`
  - Public bucket: ✅ 체크
  - Save

> 이 단계가 완료되어야 이후 코드가 동작한다.

---

## Task 1: storage.js 유틸 생성

**Files:**
- Create: `src/lib/storage.js`

- [ ] **Step 1: `src/lib/storage.js` 파일 생성**

```js
import { supabase } from './supabase'

const BUCKET = 'note-images'

export async function uploadImage(noteId, file) {
  const ext = file.name.split('.').pop() || 'png'
  const uid = crypto.randomUUID()
  const path = `images/${noteId}/${uid}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteNoteImages(noteId) {
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`images/${noteId}`)
  if (!files?.length) return
  const paths = files.map(f => `images/${noteId}/${f.name}`)
  await supabase.storage.from(BUCKET).remove(paths)
}
```

- [ ] **Step 2: 개발 서버 확인**

```bash
npm run dev
```

에러 없이 실행되면 OK.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/storage.js
git commit -m "feat: Supabase Storage 업로드/삭제 유틸 추가"
```

---

## Task 2: useNotes.js — 노트 삭제 시 이미지 정리

**Files:**
- Modify: `src/hooks/useNotes.js`

- [ ] **Step 1: `deleteNoteImages` import 추가 + `deleteNote` 수정**

`src/hooks/useNotes.js` 상단에 import 추가:
```js
import { deleteNoteImages } from '../lib/storage'
```

기존 `deleteNote` 함수를:
```js
const deleteNote = async (id) => {
  await api.deleteNote(id)
  contentCache.current.delete(id)
  setNotes(prev => prev.filter(n => n.id !== id))
}
```

다음으로 교체:
```js
const deleteNote = async (id) => {
  await deleteNoteImages(id).catch(err => console.error('Storage 정리 실패:', err))
  await api.deleteNote(id)
  contentCache.current.delete(id)
  setNotes(prev => prev.filter(n => n.id !== id))
}
```

- [ ] **Step 2: 동작 확인**

개발 서버에서 이미지가 있는 노트를 삭제 → Supabase 대시보드 Storage에서 해당 폴더가 사라지는지 확인.
(이미지 없는 노트 삭제도 에러 없이 동작해야 함)

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useNotes.js
git commit -m "feat: 노트 삭제 시 Storage 이미지 자동 정리"
```

---

## Task 3: Editor.jsx — 클립보드 이미지 붙여넣기

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: `uploadImage` import 추가**

`src/components/Editor.jsx` 상단 import에 추가:
```js
import { uploadImage } from '../lib/storage'
```

- [ ] **Step 2: `handlePaste` 함수 추가**

`Editor` 컴포넌트 내부, `handlePreviewScroll` 정의 바로 아래에 추가:

```js
const handlePaste = async (e) => {
  if (!canEdit || !note?.id) return
  const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'))
  if (!files.length) return
  e.preventDefault()

  const file = files[0]
  const { selectionStart: start, selectionEnd: end } = e.target
  const uid = crypto.randomUUID().slice(0, 8)
  const placeholder = `![업로드 중...-${uid}]()`

  const withPlaceholder = note.content.slice(0, start) + placeholder + note.content.slice(end)
  change('content', withPlaceholder)

  try {
    const url = await uploadImage(note.id, file)
    setNote(prev => {
      const next = { ...prev, content: prev.content.replace(placeholder, `![](${url})`) }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  } catch (err) {
    console.error('이미지 업로드 실패:', err)
    setNote(prev => {
      const next = { ...prev, content: prev.content.replace(placeholder, '') }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  }
}
```

> `handlePaste`는 `note`, `change`, `save`, `saveTimer`를 컴포넌트 스코프에서 직접 참조하므로 `useCallback` 불필요.

- [ ] **Step 3: 데스크탑 split 뷰 textarea에 `onPaste` 연결**

`isSplit` 분기의 왼쪽 패널 textarea (현재 `ref={textareaRef}`가 붙어 있는 것):

```jsx
<textarea
  ref={textareaRef}
  value={note.content}
  onChange={e => change('content', e.target.value)}
  onScroll={handleEditorScroll}
  onPaste={handlePaste}          {/* 추가 */}
  readOnly={!canEdit}
  placeholder={
    note.content_type === 'markdown'
      ? '# 제목\n\n내용을 입력하세요...'
      : '<h1>제목</h1>\n<p>내용을 입력하세요...</p>'
  }
  className="flex-1 w-full px-10 pb-10 bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d] font-mono"
  spellCheck={false}
/>
```

- [ ] **Step 4: 데스크탑 text-only 뷰 textarea에 `onPaste` 연결**

`isSplit` 분기의 else 블록 textarea:

```jsx
<textarea
  value={note.content}
  onChange={e => change('content', e.target.value)}
  onPaste={handlePaste}          {/* 추가 */}
  readOnly={!canEdit}
  placeholder="내용을 입력하세요..."
  className="w-full bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d]"
  style={{ minHeight: 'calc(100vh - 320px)' }}
  spellCheck={false}
/>
```

- [ ] **Step 5: 모바일 edit 뷰 textarea에 `onPaste` 연결**

`isMobile && mobileView === 'edit'` 분기의 본문 textarea:

```jsx
<textarea
  value={note.content}
  onChange={e => change('content', e.target.value)}
  onPaste={handlePaste}          {/* 추가 */}
  readOnly={!canEdit}
  placeholder="내용을 입력하세요..."
  className="flex-1 w-full px-6 py-4 bg-transparent text-[#e6edf3] text-[1rem] leading-[2.0] resize-none outline-none placeholder-[#21262d] font-mono min-h-0"
  spellCheck={false}
/>
```

- [ ] **Step 6: 동작 확인**

1. `npm run dev` 실행
2. 마크다운 모드 노트 편집창에서 스크린샷을 복사 후 Cmd+V
3. `![업로드 중...-xxxxxxxx]()` 가 먼저 나타나고, 업로드 완료 후 `![](https://...)` 로 바뀌는지 확인
4. 미리보기 패널에서 이미지가 렌더링되는지 확인
5. Supabase 대시보드 Storage → `note-images` → `images/{noteId}/` 폴더에 파일이 생성됐는지 확인

- [ ] **Step 7: 커밋**

```bash
git add src/components/Editor.jsx
git commit -m "feat: 클립보드 이미지 붙여넣기 — Supabase Storage 업로드"
```

---

## Task 4: 배포

- [ ] **Step 1: main 브랜치 push**

```bash
git push origin main
```

Vercel이 `main` 브랜치 push를 감지해 자동 배포 시작.

- [ ] **Step 2: 배포 확인**

Vercel 대시보드 또는 프로덕션 URL에서:
1. 노트 편집창에 이미지 붙여넣기 동작 확인
2. 노트 삭제 후 Storage 폴더 정리 확인
