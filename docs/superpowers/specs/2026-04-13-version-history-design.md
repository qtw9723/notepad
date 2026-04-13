# 버전 히스토리 & 실행취소 버퍼 설계

**날짜:** 2026-04-13  
**범위:** 노트 내용 복구 기능 (버전 히스토리) + 실행취소용 인메모리 버퍼

---

## 개요

자동저장 중 실수로 내용을 삭제했을 때 복구할 수 있는 두 겹의 안전망.

- **1겹 (DB):** 자정 자동 백업 + 대량 삭제 감지 시 즉시 스냅샷
- **2겹 (인메모리):** 편집 중 50개 롤링 버퍼 (실행취소용, 이번 구현에서는 구조만)

---

## DB 스키마

```sql
create table note_versions (
  id           uuid        default gen_random_uuid() primary key,
  note_id      uuid        references notes(id) on delete cascade not null,
  title        text        not null default '',
  content      text        not null default '',
  content_type text        not null default 'markdown',
  tags         text[]      not null default '{}',
  trigger      text        not null check (trigger in ('daily_backup', 'shrinkage', 'pre_restore')),
  created_at   timestamptz not null default now()
);
```

### trigger 값 의미
| 값 | 설명 |
|----|------|
| `daily_backup` | 자정 cron이 생성한 일별 백업 |
| `shrinkage` | 클라이언트가 20% 이상 감소 감지 시 저장한 스냅샷 |
| `pre_restore` | 복구 버튼 클릭 직전 현재 내용을 보존한 스냅샷 |

### 보관 정책
- `daily_backup`: 노트당 최근 90개 초과 시 오래된 것부터 자동 삭제
- `shrinkage`, `pre_restore`: 전량 보관

---

## 트리거 로직

### 자정 백업 (Edge Function cron — server-side)
1. 모든 노트 조회
2. 각 노트의 마지막 `daily_backup` 스냅샷과 현재 content 비교
3. 변경된 노트만 `note_versions`에 `trigger = 'daily_backup'`으로 삽입
4. 노트당 90개 초과분 정리

cron 스케줄: `0 15 * * *` (UTC 15:00 = KST 00:00)  
pg_cron → `supabase_functions.http_request` → Edge Function `action: "backup"`

### 감소량 감지 (client-side → API)
- `Editor.jsx` `change('content', value)` 호출 시마다 체크
- 조건: `newContent.length < lastSnapshottedContent.length * 0.8` (20% 이상 감소)
- 발동 시: 변경 적용 전 `lastSavedContent.current`를 `shrinkage` 스냅샷으로 저장
- 중복 방지: `lastSnapshottedContent` ref — 스냅샷 저장 후 갱신, 다음 자동저장 완료 후 재설정

---

## Edge Function 신규 액션

기존 `supabase/functions/notepad/index.ts`에 아래 라우팅 추가.

| action | 메서드 | 인증 | 설명 |
|--------|--------|------|------|
| `backup` | POST | service_role (cron) | 자정 백업 실행 |
| `snapshot` | POST | 로그인 필요 | shrinkage 스냅샷 저장 |
| `versions` | GET | 비인증 허용 | 노트 버전 목록 반환 |
| `restore` | POST | 로그인 필요 | 특정 버전으로 복구 (pre_restore 먼저 저장) |

### `backup` 페이로드
```json
{ "action": "backup" }
```

### `snapshot` 페이로드
```json
{
  "action": "snapshot",
  "noteId": "uuid",
  "title": "...",
  "content": "...",
  "content_type": "markdown",
  "tags": []
}
```

### `versions` 쿼리 파라미터
```
GET /notepad?action=versions&noteId=uuid
```
응답: `[{ id, trigger, created_at, title, content, content_type, tags }]` (최신순)

### `restore` 페이로드
```json
{
  "action": "restore",
  "noteId": "uuid",
  "versionId": "uuid"
}
```
동작: pre_restore 스냅샷 저장 → notes 테이블 업데이트 → 업데이트된 note 반환

---

## 클라이언트 변경

### `src/lib/api.js`
- `getVersions(noteId)` — GET `?action=versions&noteId=...`
- `saveSnapshot(noteId, note)` — POST `action: "snapshot"`
- `restoreVersion(noteId, versionId)` — POST `action: "restore"`

### `src/components/Editor.jsx`
1. **감소량 감지**: `change()` 함수 내에 shrinkage 체크 추가
   - `lastSnapshottedContent = useRef('')` 추가
   - 20% 이상 감소 시 `api.saveSnapshot()` 비동기 호출 (저장 표시 없이 백그라운드)
   - 스냅샷 저장 후 `lastSnapshottedContent.current` 갱신
   - 자동저장 완료 후 `lastSnapshottedContent.current`도 갱신

2. **실행취소 버퍼** (구조만, Ctrl+Z 연결은 추후):
   - `undoBuffer = useRef([])` 추가
   - `change()` 호출마다 변경 전 `note` 상태를 push
   - 50개 초과 시 앞에서 제거 (`undoBuffer.current.shift()`)
   - `noteId` 변경 시 (`useEffect`) 클리어

3. **히스토리 버튼**: 툴바에 `<History size={11} />` 버튼 추가
   - `isLoggedIn` 일 때만 표시
   - 클릭 시 `showHistory` state → `VersionHistoryModal` 렌더

### `src/components/VersionHistoryModal.jsx` (신규)

```
┌─────────────────────────────────────────────┐
│ 버전 히스토리                            [✕] │
├─────────────────┬───────────────────────────┤
│ ● 2026-04-13    │  # 제목                   │
│   00:00 자정백업│                           │
│                 │  본문 미리보기 (markdown)  │
│   2026-04-12    │                           │
│   14:32 삭제감지│  [이 버전으로 복구]        │
│                 │                           │
│   2026-04-12    │                           │
│   00:00 자정백업│                           │
└─────────────────┴───────────────────────────┘
```

- 왼쪽 패널: 버전 목록, 선택된 항목 하이라이트
- 오른쪽 패널: 선택된 버전 마크다운 미리보기 (읽기 전용)
- trigger 레이블: `daily_backup` → "자정 백업", `shrinkage` → "삭제 감지", `pre_restore` → "복구 전 보존"
- "이 버전으로 복구" 버튼 → `api.restoreVersion()` 호출 → 성공 시 모달 닫고 노트 리로드

---

## 인프라 변경

### parking 프로젝트 마이그레이션
파일: `supabase/migrations/YYYYMMDDHHMMSS_add_note_versions.sql`
- `note_versions` 테이블 생성
- `daily_backup` 90개 초과 정리용 함수/트리거 (또는 `backup` 액션 내에서 처리)

### pg_cron (이미 등록됨)
```sql
select cron.schedule(
  'notepad-midnight-backup',
  '0 15 * * *',
  $$
  select supabase_functions.http_request(
    'https://enawzdqroidrhtjqhpka.supabase.co/functions/v1/notepad',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer <service_role_key>"}',
    '{"action":"backup"}',
    5000
  )
  $$
);
```

---

## 수정 파일 요약

| 파일 | 변경 종류 |
|------|-----------|
| `parking/supabase/migrations/*_add_note_versions.sql` | 신규 |
| `supabase/functions/notepad/index.ts` | 수정 (4개 액션 추가) |
| `src/lib/api.js` | 수정 (3개 함수 추가) |
| `src/components/Editor.jsx` | 수정 (감소량 감지, undo 버퍼, 히스토리 버튼) |
| `src/components/VersionHistoryModal.jsx` | 신규 |
