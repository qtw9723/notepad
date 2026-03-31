# Master Create in All Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마스터 계정으로 로그인하면 모든 프로젝트 섹션에서 노트를 생성할 수 있도록 한다.

**Architecture:** Sidebar의 `sections` 배열에 `userId` 필드를 추가하고, 마스터일 때 모든 섹션의 `canCreate`를 true로 설정한다. `onCreate(targetUserId)` 형태로 생성 대상 프로젝트를 명시적으로 전달하고, Edge Function POST 핸들러에서 마스터가 `body.user_id`를 지정하면 허용한다.

**Tech Stack:** React 19, Vite, Supabase Edge Function (Deno/TypeScript)

---

### Task 1: Sidebar — sections에 userId 추가 및 canCreate 조건 수정

**Files:**
- Modify: `src/components/Sidebar.jsx`

현재 `sections` useMemo에서 `canCreate: isMySection`으로 마스터도 본인 섹션만 생성 가능하다. `userId` 필드를 추가하고, 마스터는 모든 프로젝트 섹션에서 생성 가능하도록 수정한다.

- [ ] **Step 1: sections useMemo 수정**

`src/components/Sidebar.jsx`의 `sections` useMemo에서 아래 변경을 적용한다.

변경 전:
```js
result.push({ name: '공개', notes: sortByOrder(filtered.filter(n => !n.user_id)), canCreate: false, icon: '🌐' })
if (isMaster) {
  projects.forEach(p => {
    const pNotes = sortByOrder(filtered.filter(n => n.user_id === p.user_id))
    const isMySection = currentProject?.user_id === p.user_id
    result.push({ name: p.name, notes: pNotes, canCreate: isMySection, icon: p.name[0].toUpperCase() })
  })
} else if (currentProject) {
  const myNotes = sortByOrder(filtered.filter(n => n.user_id === currentProject.user_id))
  result.push({ name: currentProject.name, notes: myNotes, canCreate: true, icon: currentProject.name[0].toUpperCase() })
}
```

변경 후:
```js
result.push({ name: '공개', notes: sortByOrder(filtered.filter(n => !n.user_id)), canCreate: false, userId: null, icon: '🌐' })
if (isMaster) {
  projects.forEach(p => {
    const pNotes = sortByOrder(filtered.filter(n => n.user_id === p.user_id))
    result.push({ name: p.name, notes: pNotes, canCreate: true, userId: p.user_id, icon: p.name[0].toUpperCase() })
  })
} else if (currentProject) {
  const myNotes = sortByOrder(filtered.filter(n => n.user_id === currentProject.user_id))
  result.push({ name: currentProject.name, notes: myNotes, canCreate: true, userId: currentProject.user_id, icon: currentProject.name[0].toUpperCase() })
}
```

- [ ] **Step 2: SortableSection 렌더링 시 onCreate를 userId와 함께 호출하도록 수정**

`sortedSections.map(section => ...)` 안의 `SortableSection` 렌더링에서 `onCreate` prop을 수정한다.

변경 전:
```jsx
<SortableSection
  key={section.name}
  section={section}
  isCollapsed={collapsedSections.has(section.name)}
  onToggle={() => toggleSection(section.name)}
  onCreate={onCreate}
  selectedId={selectedId}
  onSelect={onSelect}
  onDelete={onDelete}
  isLoggedIn={isLoggedIn}
  fmt={fmt}
  onNoteDragEnd={handleNoteDragEnd}
/>
```

변경 후:
```jsx
<SortableSection
  key={section.name}
  section={section}
  isCollapsed={collapsedSections.has(section.name)}
  onToggle={() => toggleSection(section.name)}
  onCreate={() => onCreate(section.userId)}
  selectedId={selectedId}
  onSelect={onSelect}
  onDelete={onDelete}
  isLoggedIn={isLoggedIn}
  fmt={fmt}
  onNoteDragEnd={handleNoteDragEnd}
/>
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/Sidebar.jsx
git commit -m "feat: master can create notes in all project sections"
```

---

### Task 2: App.jsx — handleCreate에 targetUserId 수용

**Files:**
- Modify: `src/App.jsx`

`handleCreate`가 `targetUserId`를 받아 `createNote`로 전달하도록 수정한다.

- [ ] **Step 1: handleCreate 수정**

`src/App.jsx`에서 아래 변경을 적용한다.

변경 전:
```js
const handleCreate = async () => {
  const note = await createNote()
  if (note) setSelectedId(note.id)
}
```

변경 후:
```js
const handleCreate = async (targetUserId) => {
  const note = await createNote(targetUserId)
  if (note) setSelectedId(note.id)
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: pass targetUserId through handleCreate"
```

---

### Task 3: useNotes.js — createNote에 targetUserId 파라미터 추가

**Files:**
- Modify: `src/hooks/useNotes.js`

`createNote`가 `targetUserId`를 받아 API body에 포함시킨다. `targetUserId`가 없으면 백엔드가 `user.id`를 사용한다.

- [ ] **Step 1: createNote 수정**

`src/hooks/useNotes.js`에서 아래 변경을 적용한다.

변경 전:
```js
const createNote = async () => {
  const note = await api.createNote({ title: '새 메모', content: '', content_type: 'markdown', tags: [] })
  if (note) setNotes(prev => [note, ...prev])
  return note
}
```

변경 후:
```js
const createNote = async (targetUserId) => {
  const body = { title: '새 메모', content: '', content_type: 'markdown', tags: [] }
  if (targetUserId) body.user_id = targetUserId
  const note = await api.createNote(body)
  if (note) setNotes(prev => [note, ...prev])
  return note
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/useNotes.js
git commit -m "feat: createNote accepts targetUserId for master use"
```

---

### Task 4: Edge Function — 마스터의 user_id 오버라이드 허용

**Files:**
- Modify: `supabase/functions/notepad/index.ts`

POST 핸들러에서 마스터가 `body.user_id`를 지정하면 해당 값을 사용하고, 아니면 `user.id`를 강제한다.

- [ ] **Step 1: POST 핸들러 수정**

`supabase/functions/notepad/index.ts`의 POST 핸들러를 아래와 같이 수정한다.

변경 전:
```typescript
if (method === "POST") {
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "바디가 비어있습니다." }, 400);

  const { data, error } = await adminClient
    .from("notes")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return json(data, 201);
}
```

변경 후:
```typescript
if (method === "POST") {
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "바디가 비어있습니다." }, 400);

  // 마스터는 body.user_id를 지정해 다른 프로젝트 소속으로 생성 가능
  const { user_id: bodyUserId, ...rest } = body;
  const userId = (isMaster && bodyUserId) ? bodyUserId : user.id;

  const { data, error } = await adminClient
    .from("notes")
    .insert({ ...rest, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return json(data, 201);
}
```

- [ ] **Step 2: Edge Function 배포**

```bash
cd /Users/sangjun/IdeaProjects/parking
supabase functions deploy notepad --project-ref enawzdqroidrhtjqhpka
```

Expected: `Deployed Functions notepad` 메시지 확인.

- [ ] **Step 3: 커밋**

```bash
cd /Users/sangjun/IdeaProjects/notepad
git add supabase/functions/notepad/index.ts
git commit -m "feat: allow master to create notes in any project via body.user_id"
```

---

### Task 5: 통합 검증

- [ ] **Step 1: 개발 서버 시작**

```bash
npm run dev
```

- [ ] **Step 2: 마스터 로그인 후 검증**

1. 로그인 버튼 클릭 → 마스터 프로젝트 선택 → 로그인
2. 사이드바에서 모든 프로젝트 섹션에 "+" 버튼이 표시되는지 확인
3. 다른 프로젝트 섹션의 "+" 클릭 → 새 노트 생성 확인
4. 생성된 노트가 해당 섹션에 표시되는지 확인 (Supabase 대시보드에서 `user_id`가 해당 프로젝트의 `user_id`인지도 확인 가능)

- [ ] **Step 3: 비마스터 로그인 후 검증**

1. 로그아웃 → 일반 프로젝트로 로그인
2. 본인 섹션에만 "+" 버튼이 있는지 확인 (다른 섹션에는 없어야 함)
