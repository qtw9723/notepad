# Version History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자정 자동 백업과 대량 삭제 감지로 노트 내용을 복구할 수 있는 버전 히스토리 기능 구현.

**Architecture:** parking 프로젝트에 `note_versions` 테이블 추가. Supabase Edge Function(`notepad`)에 backup/snapshot/versions/restore 액션 추가. 클라이언트에서 20% 이상 content 감소 시 자동 스냅샷 저장. Editor 툴바에 히스토리 모달 연결.

**Tech Stack:** Supabase Edge Function (Deno/TypeScript), PostgreSQL, React 19, Tailwind CSS 4, lucide-react

---

## File Map

| 파일 | 역할 |
|------|------|
| `parking/supabase/migrations/20260413000000_add_note_versions.sql` | 신규 — note_versions 테이블 생성 |
| `parking/supabase/functions/notepad/data.ts` | 수정 — saveVersion, getVersions, runDailyBackup, restoreVersion 추가 |
| `parking/supabase/functions/notepad/index.ts` | 수정 — 새 액션 라우팅 추가 |
| `src/lib/api.js` | 수정 — getVersions, saveSnapshot, restoreVersion 추가 |
| `src/components/Editor.jsx` | 수정 — shrinkage 감지, undo 버퍼, 히스토리 버튼 |
| `src/components/VersionHistoryModal.jsx` | 신규 — 버전 목록 + 미리보기 + 복구 모달 |

---

## Task 1: DB 마이그레이션 (parking 프로젝트)

**Files:**
- Create: `parking/supabase/migrations/20260413000000_add_note_versions.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

`/Users/sangjun/IdeaProjects/parking/supabase/migrations/20260413000000_add_note_versions.sql`:

```sql
create table note_versions (
  id           uuid        default gen_random_uuid() primary key,
  note_id      uuid        references notes(id) on delete cascade not null,
  title        text        not null default '',
  content      text        not null default '',
  content_type text        not null default 'markdown'
                           check (content_type in ('markdown', 'html', 'text')),
  tags         text[]      not null default '{}',
  trigger      text        not null
                           check (trigger in ('daily_backup', 'shrinkage', 'pre_restore')),
  created_at   timestamptz not null default now()
);

create index note_versions_note_id_idx on note_versions(note_id);
create index note_versions_note_trigger_idx on note_versions(note_id, trigger, created_at desc);
```

- [ ] **Step 2: 마이그레이션 실행**

```bash
cd /Users/sangjun/IdeaProjects/parking
supabase db push
```

Expected: `Applying migration 20260413000000_add_note_versions.sql... done`

- [ ] **Step 3: 커밋 (parking 프로젝트)**

```bash
cd /Users/sangjun/IdeaProjects/parking
git add supabase/migrations/20260413000000_add_note_versions.sql
git commit -m "feat: note_versions 테이블 추가"
```

---

## Task 2: Edge Function — data.ts에 버전 함수 추가

**Files:**
- Modify: `/Users/sangjun/IdeaProjects/parking/supabase/functions/notepad/data.ts`

- [ ] **Step 1: data.ts 하단에 함수 4개 추가**

기존 `deleteNote` 함수 뒤에 아래 코드를 추가한다.

```typescript
// ─── note_versions ────────────────────────────────────────────────────────

// 버전 저장
export async function saveVersion(
  noteId: string,
  note: { title: string; content: string; content_type: string; tags: string[] },
  trigger: "daily_backup" | "shrinkage" | "pre_restore",
) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("note_versions")
    .insert({
      note_id: noteId,
      title: note.title,
      content: note.content,
      content_type: note.content_type,
      tags: note.tags,
      trigger,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// 버전 목록 조회 (최신순, 최대 200개)
export async function getVersions(noteId: string) {
  const supabase = getClient()
  const { data, error } = await supabase
    .from("note_versions")
    .select("id, trigger, created_at, title, content, content_type, tags")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

// 자정 백업 실행 — 변경된 노트만, daily_backup 90개 초과분 정리
export async function runDailyBackup() {
  const supabase = getClient()

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, title, content, content_type, tags")
  if (notesError) throw notesError

  for (const note of notes ?? []) {
    // 마지막 daily_backup 조회
    const { data: lastBackup } = await supabase
      .from("note_versions")
      .select("content")
      .eq("note_id", note.id)
      .eq("trigger", "daily_backup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // 변경된 경우에만 저장
    if (!lastBackup || lastBackup.content !== note.content) {
      await saveVersion(note.id, note, "daily_backup")
    }

    // 90개 초과분 정리
    const { data: allBackups } = await supabase
      .from("note_versions")
      .select("id")
      .eq("note_id", note.id)
      .eq("trigger", "daily_backup")
      .order("created_at", { ascending: false })

    const toDelete = (allBackups ?? []).slice(90)
    if (toDelete.length > 0) {
      await supabase
        .from("note_versions")
        .delete()
        .in("id", toDelete.map((v) => v.id))
    }
  }
}

// 특정 버전으로 복구 (현재 상태를 pre_restore로 먼저 저장)
export async function restoreVersion(noteId: string, versionId: string) {
  const supabase = getClient()

  // 복구할 버전 조회
  const { data: version, error: versionError } = await supabase
    .from("note_versions")
    .select("title, content, content_type, tags")
    .eq("id", versionId)
    .single()
  if (versionError || !version) throw new Error("version not found")

  // 현재 노트 상태를 pre_restore로 저장
  const { data: currentNote } = await supabase
    .from("notes")
    .select("title, content, content_type, tags")
    .eq("id", noteId)
    .single()
  if (currentNote) {
    await saveVersion(noteId, currentNote, "pre_restore")
  }

  // 노트를 해당 버전으로 업데이트
  const { data: updatedNote, error: updateError } = await supabase
    .from("notes")
    .update({
      title: version.title,
      content: version.content,
      content_type: version.content_type,
      tags: version.tags,
    })
    .eq("id", noteId)
    .select()
    .single()
  if (updateError) throw updateError
  return updatedNote
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/sangjun/IdeaProjects/parking
git add supabase/functions/notepad/data.ts
git commit -m "feat: note_versions CRUD 함수 추가 (data.ts)"
```

---

## Task 3: Edge Function — index.ts 라우팅 추가

**Files:**
- Modify: `/Users/sangjun/IdeaProjects/parking/supabase/functions/notepad/index.ts`

- [ ] **Step 1: import 줄 수정**

기존:
```typescript
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "./data.ts"
```

교체:
```typescript
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  saveVersion,
  getVersions,
  runDailyBackup,
  restoreVersion,
} from "./data.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
```

- [ ] **Step 2: `Deno.serve` 내부 GET 블록 교체**

기존 GET 블록:
```typescript
    if (method === "GET") {
      if (id) {
        const note = await getNoteById(id)
        if (!note) return json({ error: "note not found", id }, 404)
        return json(note)
      }
      const notes = await getNotes()
      return json(notes)
    }
```

교체:
```typescript
    if (method === "GET") {
      const action = url.searchParams.get("action")

      // GET ?action=versions&noteId=xxx
      if (action === "versions") {
        const noteId = url.searchParams.get("noteId")
        if (!noteId) return json({ error: "noteId required" }, 400)
        const versions = await getVersions(noteId)
        return json(versions)
      }

      if (id) {
        const note = await getNoteById(id)
        if (!note) return json({ error: "note not found", id }, 404)
        return json(note)
      }
      const notes = await getNotes()
      return json(notes)
    }
```

- [ ] **Step 3: POST 블록 교체**

기존 POST 블록:
```typescript
    // POST /notepad — 노트 생성
    if (method === "POST") {
      const body = await req.json()
      const note = await createNote(body)
      return json(note, 201)
    }
```

교체:
```typescript
    // POST /notepad
    if (method === "POST") {
      const body = await req.json()

      // action: backup — pg_cron이 service_role key로 호출
      if (body.action === "backup") {
        const authHeader = req.headers.get("Authorization") ?? ""
        const token = authHeader.replace("Bearer ", "")
        if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
          return json({ error: "unauthorized" }, 401)
        }
        await runDailyBackup()
        return json({ success: true })
      }

      // action: snapshot — 클라이언트 shrinkage 감지 시 호출
      if (body.action === "snapshot") {
        const user = await getUserFromRequest(req)
        if (!user) return json({ error: "unauthorized" }, 401)
        if (!body.noteId) return json({ error: "noteId required" }, 400)
        const version = await saveVersion(body.noteId, {
          title: body.title ?? "",
          content: body.content ?? "",
          content_type: body.content_type ?? "markdown",
          tags: body.tags ?? [],
        }, "shrinkage")
        return json(version)
      }

      // action: restore — 특정 버전으로 복구
      if (body.action === "restore") {
        const user = await getUserFromRequest(req)
        if (!user) return json({ error: "unauthorized" }, 401)
        if (!body.noteId || !body.versionId) {
          return json({ error: "noteId and versionId required" }, 400)
        }
        const note = await restoreVersion(body.noteId, body.versionId)
        return json(note)
      }

      // 기본: 노트 생성
      const note = await createNote(body)
      return json(note, 201)
    }
```

- [ ] **Step 4: `json` 함수 아래에 `getUserFromRequest` 헬퍼 추가**

`function json(...)` 정의 바로 아래에 추가:

```typescript
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/sangjun/IdeaProjects/parking
git add supabase/functions/notepad/index.ts
git commit -m "feat: backup/snapshot/versions/restore 액션 라우팅 추가"
```

---

## Task 4: Edge Function 배포

**Files:** 없음 (배포만)

- [ ] **Step 1: 배포**

```bash
cd /Users/sangjun/IdeaProjects/parking
supabase functions deploy notepad --project-ref enawzdqroidrhtjqhpka --no-verify-jwt
```

Expected: `Deployed Functions notepad`

- [ ] **Step 2: 자정 백업 수동 테스트 (선택)**

Supabase Dashboard → SQL Editor:
```sql
select supabase_functions.http_request(
  'https://enawzdqroidrhtjqhpka.supabase.co/functions/v1/notepad',
  'POST',
  jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
  )::text,
  '{"action":"backup"}',
  5000
);
```

또는 curl로 테스트:
```bash
curl -X POST https://enawzdqroidrhtjqhpka.supabase.co/functions/v1/notepad \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <service_role_key>" \
  -d '{"action":"backup"}'
```

Expected: `{"success":true}`

---

## Task 5: api.js — 버전 API 함수 추가

**Files:**
- Modify: `src/lib/api.js`

- [ ] **Step 1: api 객체에 3개 함수 추가**

기존 `api` 객체:
```javascript
export const api = {
  getProjects: () => request('?type=projects'),
  getNotes: () => request(),
  getNote: (id) => request(`?id=${id}`),
  createNote: (body) => request('', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id, changes) => request(`?id=${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteNote: (id) => request(`?id=${id}`, { method: 'DELETE' }),
}
```

교체:
```javascript
export const api = {
  getProjects: () => request('?type=projects'),
  getNotes: () => request(),
  getNote: (id) => request(`?id=${id}`),
  createNote: (body) => request('', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id, changes) => request(`?id=${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteNote: (id) => request(`?id=${id}`, { method: 'DELETE' }),
  getVersions: (noteId) => request(`?action=versions&noteId=${noteId}`),
  saveSnapshot: (noteId, note) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'snapshot', noteId, ...note }),
  }),
  restoreVersion: (noteId, versionId) => request('', {
    method: 'POST',
    body: JSON.stringify({ action: 'restore', noteId, versionId }),
  }),
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/sangjun/IdeaProjects/notepad
git add src/lib/api.js
git commit -m "feat: getVersions, saveSnapshot, restoreVersion API 추가"
```

---

## Task 6: Editor.jsx — shrinkage 감지, undo 버퍼, 히스토리 버튼

**Files:**
- Modify: `src/components/Editor.jsx`

- [ ] **Step 1: import에 History 아이콘 추가**

기존:
```javascript
import { FileText, Code, FileCode2, Pencil, ArrowLeft, Link } from 'lucide-react'
```

교체:
```javascript
import { FileText, Code, FileCode2, Pencil, ArrowLeft, Link, History } from 'lucide-react'
```

- [ ] **Step 2: state/ref 추가**

`const [copied, setCopied] = useState(false)` 아래에 추가:

```javascript
const [showHistory, setShowHistory] = useState(false)
```

`const lastSavedContent = useRef('')` 아래에 추가:

```javascript
const lastSnapshottedContent = useRef('')
const undoBuffer = useRef([])
```

- [ ] **Step 3: note 로드 시 ref 초기화**

기존:
```javascript
  useEffect(() => {
    if (!noteId) return
    fetchNote(noteId).then(data => {
      setNote(data)
      lastSavedContent.current = data?.content ?? ''
    })
  }, [noteId, fetchNote])
```

교체:
```javascript
  useEffect(() => {
    if (!noteId) return
    fetchNote(noteId).then(data => {
      setNote(data)
      lastSavedContent.current = data?.content ?? ''
      lastSnapshottedContent.current = data?.content ?? ''
      undoBuffer.current = []
    })
  }, [noteId, fetchNote])
```

- [ ] **Step 4: save 함수에서 lastSnapshottedContent 갱신**

기존 `save` 함수:
```javascript
  const save = useCallback(async (updated) => {
    if (!updated?.id) return
    setSaving(true)
    const removed = findRemovedStoragePaths(lastSavedContent.current, updated.content)
    if (removed.length) deleteImagePaths(removed).catch(console.error)
    lastSavedContent.current = updated.content ?? ''
    const data = await api.updateNote(updated.id, {
      title: updated.title,
      content: updated.content,
      content_type: updated.content_type,
      tags: updated.tags,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    if (data) onUpdate(data)
  }, [onUpdate])
```

교체:
```javascript
  const save = useCallback(async (updated) => {
    if (!updated?.id) return
    setSaving(true)
    const removed = findRemovedStoragePaths(lastSavedContent.current, updated.content)
    if (removed.length) deleteImagePaths(removed).catch(console.error)
    lastSavedContent.current = updated.content ?? ''
    lastSnapshottedContent.current = updated.content ?? ''
    const data = await api.updateNote(updated.id, {
      title: updated.title,
      content: updated.content,
      content_type: updated.content_type,
      tags: updated.tags,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    if (data) onUpdate(data)
  }, [onUpdate])
```

- [ ] **Step 5: change 함수에 shrinkage 감지 + undo 버퍼 추가**

기존:
```javascript
  const change = (field, value) => {
    if (!canEdit) return
    setNote(prev => {
      const next = { ...prev, [field]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  }
```

교체:
```javascript
  const change = (field, value) => {
    if (!canEdit) return

    // undo 버퍼: 변경 전 상태 저장 (최대 50개 FIFO)
    setNote(prev => {
      if (prev) {
        undoBuffer.current = [...undoBuffer.current.slice(-49), { ...prev }]
      }

      // shrinkage 감지: content가 마지막 스냅샷 대비 20% 이상 감소 시
      if (field === 'content' && prev) {
        const lastLen = lastSnapshottedContent.current.length
        const newLen = value.length
        if (lastLen > 50 && newLen < lastLen * 0.8) {
          const snapshotNote = {
            title: prev.title,
            content: lastSavedContent.current,
            content_type: prev.content_type,
            tags: prev.tags,
          }
          api.saveSnapshot(prev.id, snapshotNote).catch(console.error)
          lastSnapshottedContent.current = value
        }
      }

      const next = { ...prev, [field]: value }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => save(next), 800)
      return next
    })
  }
```

- [ ] **Step 6: 데스크탑 툴바에 히스토리 버튼 추가**

툴바의 공유 버튼 바로 앞에 히스토리 버튼을 추가한다. 기존 공유 버튼 블록:

```javascript
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

교체:
```javascript
        {canEdit && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
          >
            <History size={11} />
            히스토리
          </button>
        )}

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

- [ ] **Step 7: 모달 렌더링 + onRestore 핸들러 추가**

`Editor.jsx` 최상단 return 바로 앞(데스크탑 뷰 return 시작 전 `// 데스크탑 뷰` 주석 위)에 추가:

```javascript
  const handleRestore = (restoredNote) => {
    setNote(restoredNote)
    lastSavedContent.current = restoredNote.content ?? ''
    lastSnapshottedContent.current = restoredNote.content ?? ''
    undoBuffer.current = []
    setShowHistory(false)
    onUpdate(restoredNote)
  }
```

그리고 데스크탑 뷰 return 최상단 `<div className="flex-1 flex flex-col h-full...">` 안, 툴바 `<div>` 바로 뒤에 추가:

```javascript
      {showHistory && (
        <VersionHistoryModal
          noteId={noteId}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      )}
```

- [ ] **Step 8: VersionHistoryModal import 추가**

파일 최상단 import 목록에 추가:
```javascript
import VersionHistoryModal from './VersionHistoryModal'
```

- [ ] **Step 9: 커밋**

```bash
cd /Users/sangjun/IdeaProjects/notepad
git add src/components/Editor.jsx
git commit -m "feat: shrinkage 감지, undo 버퍼, 히스토리 버튼 추가"
```

---

## Task 7: VersionHistoryModal.jsx 생성

**Files:**
- Create: `src/components/VersionHistoryModal.jsx`

- [ ] **Step 1: 파일 생성**

`src/components/VersionHistoryModal.jsx`:

```javascript
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X } from 'lucide-react'
import { api } from '../lib/api'

const TRIGGER_LABELS = {
  daily_backup: '자정 백업',
  shrinkage: '삭제 감지',
  pre_restore: '복구 전 보존',
}

function formatDate(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function VersionHistoryModal({ noteId, onClose, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    api.getVersions(noteId)
      .then(data => {
        setVersions(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [noteId])

  const handleRestore = async () => {
    if (!selected || restoring) return
    setRestoring(true)
    try {
      const restoredNote = await api.restoreVersion(noteId, selected.id)
      onRestore(restoredNote)
    } catch (e) {
      console.error('복구 실패:', e)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1117] border border-[#21262d] rounded-2xl shadow-2xl w-[860px] max-w-[95vw] h-[580px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d] shrink-0">
          <span className="text-[14px] font-semibold text-[#e6edf3]">버전 히스토리</span>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#484f58]">
            불러오는 중...
          </div>
        ) : versions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#484f58]">
            저장된 버전이 없습니다
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* 버전 목록 */}
            <div className="w-[220px] shrink-0 border-r border-[#21262d] overflow-y-auto">
              {versions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`w-full text-left px-4 py-3 border-b border-[#21262d] transition-colors ${
                    selected?.id === v.id
                      ? 'bg-[#161b22]'
                      : 'hover:bg-[#161b22]/50'
                  }`}
                >
                  <p className="text-[12px] text-[#cdd9e5] font-mono">{formatDate(v.created_at)}</p>
                  <p className={`text-[11px] mt-0.5 ${
                    v.trigger === 'shrinkage' ? 'text-[#f87171]'
                    : v.trigger === 'pre_restore' ? 'text-[#9d8ffc]'
                    : 'text-[#8b949e]'
                  }`}>
                    {TRIGGER_LABELS[v.trigger]}
                  </p>
                </button>
              ))}
            </div>

            {/* 미리보기 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selected && (
                  <>
                    <h2
                      className="text-[1.4rem] font-bold text-[#e6edf3] leading-tight mb-4"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {selected.title || <span className="text-[#21262d]">제목 없음</span>}
                    </h2>
                    <div className="border-t border-[#21262d] mb-5" />
                    {selected.content_type === 'markdown' ? (
                      <div className="markdown-body text-[#cdd9e5] text-[0.9rem]">
                        {selected.content
                          ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
                          : <p className="text-[#484f58] italic text-sm">내용 없음</p>
                        }
                      </div>
                    ) : selected.content_type === 'html' ? (
                      <div
                        className="text-[#cdd9e5] text-[0.9rem] leading-[2.0]"
                        dangerouslySetInnerHTML={{ __html: selected.content || '' }}
                      />
                    ) : (
                      <p className="text-[#cdd9e5] text-[0.9rem] leading-[2.0] whitespace-pre-wrap">
                        {selected.content}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* 복구 버튼 */}
              <div className="shrink-0 px-8 py-4 border-t border-[#21262d] flex justify-end">
                <button
                  onClick={handleRestore}
                  disabled={!selected || restoring}
                  className="px-5 py-2 rounded-lg bg-[#9d8ffc] text-[#0d0d10] text-[13px] font-semibold hover:bg-[#b8aeff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoring ? '복구 중...' : '이 버전으로 복구'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 개발 서버로 동작 확인**

```bash
cd /Users/sangjun/IdeaProjects/notepad
npm run dev
```

확인 항목:
1. 편집기 툴바에 "히스토리" 버튼 표시
2. 버튼 클릭 시 모달 오픈
3. 버전 목록 로드 (처음엔 비어있을 수 있음)
4. 자정 백업 수동 트리거 후 버전 표시 확인
5. 복구 버튼 클릭 시 노트 내용 교체 확인

- [ ] **Step 3: 커밋 및 배포**

```bash
cd /Users/sangjun/IdeaProjects/notepad
git add src/components/VersionHistoryModal.jsx
git commit -m "feat: VersionHistoryModal 추가"
git push origin main
```

Vercel이 main 브랜치 push 시 자동 배포. Dashboard에서 배포 완료 확인.
