# Note Loading Speed — Design Spec

**Date:** 2026-04-01
**Status:** Approved

## Problem

1. **목록 로딩**: Edge Function GET 목록이 `SELECT *`로 `content`(본문 전체)까지 포함해 반환 → 노트가 많아질수록 payload가 커져 느려짐
2. **개별 로딩**: 노트 클릭 시 Editor가 `api.getNote(noteId)`로 동일 노트를 다시 fetch → 이중 요청
3. **새 메모 생성**: 서버 응답을 기다린 후 목록에 추가 → 생성 버튼 클릭 후 딜레이 체감

## Solution

**목록**: meta 필드만 fetch(content 제외) → payload 경량화
**개별**: useNotes에 content 캐시(`Map`) 추가, `fetchNote(id)` 노출 → 두 번째 클릭부터 즉시 표시
**생성**: 낙관적 업데이트 — 임시 ID로 즉시 목록 추가, 서버 응답 시 교체

## Architecture

### Edge Function (GET 목록)
`SELECT *` → `SELECT id, title, tags, content_type, updated_at, user_id`
개별 조회(`GET ?id=`)는 `SELECT *` 그대로 유지 (content 필요)

### useNotes 캐시
```
contentCache = useRef(new Map<noteId, fullNote>())

fetchNote(id):
  if cache.has(id) → return cache.get(id)
  data = await api.getNote(id)
  cache.set(id, data)
  return data
```
- updateNote 성공 시 캐시 갱신
- deleteNote 시 캐시 삭제

### createNote 낙관적 업데이트
```
tempNote = { id: `temp-${Date.now()}`, title: '새 메모', ... }
setNotes(prev => [tempNote, ...prev])   // 즉시 추가
note = await api.createNote(body)
setNotes(prev => prev.map(n => n.id === tempNote.id ? note : n))  // 교체
setSelectedId(note.id)                  // 진짜 ID로 교체
```

### App.jsx → Editor
`fetchNote` prop 추가:
```jsx
<Editor
  key={selectedId}
  noteId={selectedId}
  fetchNote={fetchNote}
  onUpdate={handleUpdate}
  isLoggedIn={isMaster || !!currentProject}
/>
```

### Editor
`useEffect`에서 `api.getNote(noteId)` → `fetchNote(noteId)` 로 교체

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/notepad/index.ts` | GET 목록: SELECT에서 content 제거 |
| `src/hooks/useNotes.js` | contentCache 추가, fetchNote 노출, createNote 낙관적 업데이트, updateNote/deleteNote 캐시 관리 |
| `src/App.jsx` | fetchNote를 Editor에 전달 |
| `src/components/Editor.jsx` | api.getNote → fetchNote prop 사용 |

## Edge Cases

- **낙관적 생성 실패 시**: temp 노트를 목록에서 제거, 에러 상태 표시
- **캐시 불일치**: updateNote 후 캐시 즉시 갱신으로 방지
- **temp ID 선택 시 save 시도**: `updated?.id?.startsWith('temp-')` 체크로 save 스킵
