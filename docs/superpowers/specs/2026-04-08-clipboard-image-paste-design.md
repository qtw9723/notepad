# Clipboard Image Paste — Design Spec

Date: 2026-04-08

## Summary

마크다운 에디터에서 클립보드 이미지를 붙여넣으면 Supabase Storage에 업로드하고, 퍼블릭 URL을 마크다운에 자동 삽입한다. 노트 삭제 시 해당 노트의 이미지도 Storage에서 함께 삭제한다.

---

## 1. Storage 구조

- **버킷**: `note-images` (public) — Supabase 대시보드에서 수동 생성 필요
- **파일 경로**: `images/{noteId}/{uuid}.{ext}`
- **마크다운 삽입 형식**: `![](https://<project>.supabase.co/storage/v1/object/public/note-images/images/{noteId}/{uuid}.{ext})`

---

## 2. 붙여넣기 플로우

**적용 대상**: 데스크탑 textarea + 모바일 edit 뷰 textarea 모두

1. `onPaste` 핸들러에서 `event.clipboardData.files`에 이미지 파일이 있으면 기본 동작 차단
2. 커서 위치에 `![업로드 중...]()` 임시 텍스트 삽입 (사용자 피드백)
3. `supabase.storage.from('note-images').upload('images/{noteId}/{uuid}.{ext}', file)` 호출
4. 업로드 완료 시 임시 텍스트를 `![](publicUrl)`로 교체
5. `change('content', updatedContent)` 호출 → 기존 800ms debounce 자동 저장

**에러 처리**: 업로드 실패 시 임시 텍스트를 제거하고 콘솔에 에러 출력 (간단한 처리).

---

## 3. 노트 삭제 시 이미지 정리

`useNotes.js`의 `deleteNote` 함수에서:

1. `supabase.storage.from('note-images').list('images/{noteId}')` 로 파일 목록 조회
2. 파일이 있으면 전체 경로 배열 구성 후 `supabase.storage.from('note-images').remove([...paths])` 일괄 삭제
3. Storage 삭제 결과와 무관하게 `api.deleteNote(id)` 호출 (Storage 실패가 노트 삭제를 막지 않음)

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/Editor.jsx` | textarea에 `onPaste` 핸들러 추가 (데스크탑 + 모바일) |
| `src/hooks/useNotes.js` | `deleteNote`에 Storage 정리 로직 추가 |
| Supabase 대시보드 | `note-images` public 버킷 수동 생성 |

---

## 범위 외 (Out of Scope)

- 이미지 크기 제한 / 리사이즈
- 드래그 앤 드롭
- 이미지 관리 UI (삭제, 목록 등)
- 파일 선택 버튼
