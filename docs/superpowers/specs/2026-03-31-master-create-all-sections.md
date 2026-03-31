# Master Create in All Sections — Design Spec

**Date:** 2026-03-31
**Status:** Approved

## Problem

마스터 계정으로 로그인하면 모든 프로젝트 노트를 볼 수 있지만, 노트 생성은 본인 섹션에서만 가능하다 (`canCreate: isMySection`). 마스터는 모든 프로젝트 섹션에서 노트를 생성할 수 있어야 한다.

## Solution

섹션에 `userId` 필드를 추가하고 `onCreate(targetUserId)` 형태로 생성 대상 프로젝트를 명시적으로 전달한다. 백엔드는 마스터가 `body.user_id`를 지정할 경우 이를 허용한다.

## Architecture

### Data Flow

```
Sidebar sections[].userId
  → SortableSection.onCreate(userId)
  → App.handleCreate(targetUserId)
  → useNotes.createNote(targetUserId)
  → api.createNote({ title, ..., user_id: targetUserId })
  → Edge Function POST: 마스터면 body.user_id 사용, 아니면 user.id 강제
```

### Component Changes

**`Sidebar.jsx`**
- `sections` 배열 각 항목에 `userId` 필드 추가 (해당 프로젝트의 `user_id`)
- `canCreate: isMaster || isMySection`으로 변경 (마스터는 모든 섹션에 "+" 버튼 표시)
- `SortableSection`에 `sectionUserId` prop 전달
- `onCreate()` 호출 시 `onCreate(sectionUserId)` 형태로 변경

**`App.jsx`**
- `handleCreate(targetUserId?)` 수용
- `onCreate` prop을 `handleCreate`로 연결

**`useNotes.js`**
- `createNote(targetUserId?)` 파라미터 추가
- `api.createNote({ ..., user_id: targetUserId })` — `targetUserId`가 없으면 백엔드가 `user.id` 사용

**`supabase/functions/notepad/index.ts`**
- POST 핸들러: `isMaster && body.user_id` 조건 시 `body.user_id` 사용, 아니면 `user.id` 강제

## Edge Cases

- **공개 섹션 (`user_id = null`)**: "+" 버튼 미표시 유지. 공개 노트는 비로그인 생성용.
- **마스터 본인 섹션**: `targetUserId === user.id` → 기존과 동일
- **비마스터 유저**: `canCreate: isMySection`만 true, 변경 없음
- **비마스터가 다른 user_id를 body에 전달**: 백엔드에서 `user.id`로 강제 덮어씀

## Files Changed

| File | Change |
|------|--------|
| `src/components/Sidebar.jsx` | sections에 userId 추가, canCreate 조건 수정, onCreate(userId) 전달 |
| `src/App.jsx` | handleCreate(targetUserId?) 수용 |
| `src/hooks/useNotes.js` | createNote(targetUserId?) 파라미터 추가 |
| `supabase/functions/notepad/index.ts` | POST: 마스터 user_id 오버라이드 허용 |
