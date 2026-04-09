# Notepad App — Project Guide

## 프로젝트 개요
React + Vite + Tailwind CSS + Supabase 기반 메모장 앱. 다크 테마, 마크다운 지원, 태그 기반 필터링, 자동 저장 기능을 갖춘 싱글 유저용 노트 앱.

## 기술 스택
- **React 19** — UI 프레임워크
- **Vite 8** — 빌드 도구 / 개발 서버
- **Tailwind CSS 4** — 스타일링 (Vite 플러그인 방식)
- **Supabase** — PostgreSQL 백엔드 (BaaS) + Auth + Edge Functions
- **react-markdown + remark-gfm** — 마크다운 렌더링
- **lucide-react** — 아이콘

## 디렉토리 구조
```
src/
├── main.jsx              # 앱 진입점 + BrowserRouter + Routes
├── App.jsx               # 루트 컴포넌트, 전역 상태 관리
├── index.css             # 전역 스타일 + Tailwind + 컴포넌트 CSS
├── components/
│   ├── Sidebar.jsx       # 노트 목록, 검색, 태그 필터
│   ├── Editor.jsx        # 노트 에디터/미리보기 (split 레이아웃)
│   ├── SharePage.jsx     # 공유 링크 뷰 전용 페이지 (/share/:noteId)
│   ├── LoginPage.jsx     # 로그인/회원가입 모달
│   └── TagInput.jsx      # 태그 입력/관리 UI
├── hooks/
│   ├── useNotes.js       # 노트 CRUD 커스텀 훅
│   ├── useAuth.js        # Supabase Auth 세션 관리 훅
│   ├── useMobile.js      # 모바일 감지 훅 (≤767px)
│   └── useProjects.js    # 프로젝트 목록 훅
└── lib/
    ├── supabase.js       # Supabase 클라이언트 싱글톤
    ├── api.js            # Edge Function fetch 래퍼
    └── storage.js        # Supabase Storage 이미지 업로드/삭제
supabase/
└── functions/
    └── notepad/
        └── index.ts      # Edge Function (CRUD + 인증)
supabase-schema.sql       # DB 스키마 참고용
vercel.json               # SPA fallback rewrites
```

## 데이터 모델 (notes 테이블)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동 생성 |
| user_id | UUID | auth.users FK, nullable (기존 노트 호환) |
| title | TEXT | 노트 제목 |
| content | TEXT | 노트 내용 |
| content_type | TEXT | 'markdown' \| 'html' \| 'text' |
| tags | TEXT[] | 태그 배열 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 (트리거 자동 갱신) |

## 핵심 로직

### 상태 흐름
```
App.jsx (user, selectedId, notes)
  ├── useAuth  → Supabase Auth 세션 감지
  ├── useNotes(user) → Edge Function API 호출
  ├── Sidebar  ← 목록 표시, 선택/삭제
  └── Editor   ← 선택된 노트 편집
        ↓ 800ms debounce 자동 저장
      useNotes.updateNote
        ↓
      Edge Function (PATCH)
```

### useNotes 훅
- `user !== undefined` 일 때 fetch 실행 (undefined = auth 로딩 중)
- 비로그인(`user === null`)이어도 fetch 실행 → 공개 노트 표시
- createNote / updateNote / deleteNote 제공
- 로컬 상태 낙관적 업데이트

### Editor 자동 저장
- 제목/내용/태그 변경 시 800ms 디바운스 후 저장
- 저장 상태 표시: "저장 중..." / "저장됨"

## 디자인 시스템

### 컬러 팔레트

| 역할 | 값 | 사용처 |
|------|-----|--------|
| 앱 배경 | `#0d1117` | body, editor, main 배경 |
| 사이드바 배경 | `#0d0d14` | `.sidebar` |
| 서피스 (카드/헤더) | `#161b22` | 에디터 툴바, 헤더 영역 |
| 서피스 (인라인) | `#161b22` | 코드블록, 태그 배경 |
| 공유 페이지 외곽 | `#09090e` | SharePage 최외곽 배경 |
| 테두리 (기본) | `#21262d` | 구분선, 카드 테두리 |
| 테두리 (강조) | `rgba(157,143,252,0.1~0.2)` | 사이드바 테두리, 버튼 테두리 |
| 강조색 (보라) | `#7c6af5` | 브랜드 컬러 |
| 강조색 (밝은 보라) | `#9d8ffc` | 버튼, 링크, 아이콘 |
| 강조색 (더 밝음) | `#b8aeff` | 호버 상태 |
| 텍스트 (강함) | `#e6edf3` | 제목, 강조 텍스트 |
| 텍스트 (기본) | `#cdd9e5` | 본문 텍스트 |
| 텍스트 (보조) | `#8b949e` | 메타, 태그 |
| 텍스트 (흐림) | `#606070` / `#484f58` | placeholder, 비활성 |
| 텍스트 (매우 흐림) | `#21262d` / `#404050` | 빈 상태 |
| 링크 / 인라인코드 | `#79c0ff` | 마크다운 내 링크, code |
| 저장됨 표시 | `#58a6ff` | "저장됨" 텍스트 |
| 에러 / 삭제 | `rgb(248,113,113)` | 삭제 버튼 호버, 에러 메시지 |
| 콘텐츠 타입 선택 | `#388bfd` | MD/HTML/Text 선택 버튼 |

### 타이포그래피

- **본문 폰트**: `-apple-system, BlinkMacSystemFont, 'Pretendard', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif`
- **코드 폰트**: `'Fira Code', 'Cascadia Code', 'D2Coding', monospace`
- **font-smoothing**: antialiased 적용
- **word-break**: `keep-all` (한국어 단어 분리 방지)

| 요소 | 크기 | 굵기 | 비고 |
|------|------|------|------|
| 노트 제목 (에디터) | `2.2rem` | 700 | `letter-spacing: -0.02em` |
| 노트 제목 (공유) | `2.2rem` | 700 | `letter-spacing: -0.03em` |
| 본문 textarea | `1rem` | 400 | `line-height: 2.0`, monospace |
| 사이드바 노트 제목 | `14px` | 500 | |
| 사이드바 섹션 헤더 | `10px` | 800 | uppercase, `letter-spacing: 0.12em` |
| 툴바 버튼 텍스트 | `11px` | 400 | |
| 태그 | `11~13px` | 400 | |

### 레이아웃

- **에디터 split 비율**: 에디터 42% / 프리뷰 58%
- **최대 콘텐츠 폭**: `760px` (에디터 프리뷰, 공유 페이지는 `720px`)
- **모바일 브레이크포인트**: `≤767px` (`useMobile` 훅)
- **모바일 뷰 상태**: `list → preview → edit` 3단계 전환

### 인터랙션

- **트랜지션**: `150ms ease` (버튼, 호버 등 대부분)
- **자동 저장 debounce**: `800ms`
- **저장됨 표시 유지**: `1500ms`
- **공유 링크 복사됨 표시**: `1500ms`

### CSS 클래스 구조 (`index.css`)

Tailwind 유틸리티로 처리하기 어려운 복잡한 컴포넌트는 `index.css`에 전용 클래스로 정의:

| 클래스 접두사 | 대상 컴포넌트 |
|--------------|--------------|
| `.markdown-body` | 마크다운 렌더링 본문 |
| `.login-*` | 로그인 모달 전체 |
| `.sidebar-*` | 사이드바 전체 (헤더, 검색, 태그, 노트 목록, 하단) |

나머지 컴포넌트(Editor, SharePage, TagInput 등)는 Tailwind 인라인 클래스 사용.

### 마크다운 렌더링 (`.markdown-body`)

- `h1`: `1.75rem`, 700, `#e6edf3`
- `h2`: `1.35rem`, 600, `#e6edf3`, 하단 border
- `h3`: `1.1rem`, 600, `#cdd9e5`
- `p`: `line-height: 1.9`
- `code`: bg `#161b22`, border `#21262d`, color `#79c0ff`, radius `4px`
- `pre`: bg `#161b22`, border `#21262d`, radius `10px`
- `blockquote`: 좌측 `3px solid #388bfd`, color `#8b949e`
- `img`: `max-width: 100%`, `border-radius: 10px`
- `table`: border `#21262d`, th bg `#161b22`

### 공유 페이지 디자인 (SharePage)

카드 페이퍼 스타일:
- 외곽 배경: `#09090e`
- 카드: `bg-[#0d1117]`, `rounded-2xl`, `border border-[#21262d]`, `shadow-2xl`
- 헤더/본문 구분: `border-b border-[#21262d]`
- 패딩: `px-12 pt-12 pb-8` (헤더), `px-12 py-12` (본문)
- 태그: `bg-[#21262d] text-[#8b949e]`, `rounded-full`
- body `overflow`/`height`는 SharePage 마운트 시 `auto`로 오버라이드 (전역 CSS가 `hidden` 설정)

## 인증 (Auth)

Supabase Auth (이메일/패스워드) 기반. 개인용 앱이므로 계정은 Supabase 대시보드에서 직접 생성.

- `src/hooks/useAuth.js` — signIn / signOut + onAuthStateChange 세션 관리
- `src/components/LoginPage.jsx` — 로그인 UI (사이드바 하단 버튼으로 열림)
- `App.jsx` — `user === undefined`(로딩) / `user === null`(비로그인) / user 있음(로그인)
- `src/lib/api.js` — 요청마다 `supabase.auth.getSession()`으로 JWT 주입 (없으면 anon key 폴백)
- `Sidebar.jsx` — 하단에 이메일 + 로그아웃 버튼 표시

### 접근 권한
- **비로그인**: `user_id = NULL`인 노트 읽기만 가능
- **로그인**: 본인 노트(`user_id = 나`) + 기존 노트(`user_id = NULL`) 읽기/쓰기 가능
- **새 계정 생성**: Supabase 대시보드 → Authentication → Users → Add user

## 백엔드 연동

백엔드는 `/Users/sangjun/IdeaProjects/parking` Supabase 프로젝트의 `notepad` Edge Function.
프론트는 `src/lib/api.js`를 통해 Edge Function에만 요청. DB 직접 접근 없음.

### Edge Function (`supabase/functions/notepad/index.ts`)
- `adminClient` (service_role key): DB 접근, RLS 우회
- `userClient` (anon key + JWT): 인증 확인 전용
- GET은 비인증 허용, POST/PATCH/DELETE는 로그인 필요

### Edge Function 배포
```bash
# notepad 레포 루트에서 (--no-verify-jwt 필수 — 함수 내부에서 직접 JWT 검증)
supabase functions deploy notepad --project-ref enawzdqroidrhtjqhpka --no-verify-jwt
```

### DB 마이그레이션
마이그레이션 파일은 `/Users/sangjun/IdeaProjects/parking/supabase/migrations/`에 관리.
```bash
cd /Users/sangjun/IdeaProjects/parking
supabase db push
```

## 배포

- **프론트엔드**: Vercel — `main` 브랜치 push 시 자동 배포
- **Edge Function**: 수동 배포 (`supabase functions deploy` 명령어)
- **DB 마이그레이션**: 수동 (`supabase db push` in parking 프로젝트)

## 환경 변수
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_NOTEPAD_URL=...   # Edge Function URL
```
`.env.example` 파일 참고. 실제 값은 `.env`에 저장 (gitignore됨).
Vercel 배포 시 동일한 환경 변수를 Vercel 대시보드에 등록 필요.

## 개발 명령어
```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 실행
```

## 이미지 업로드 (Supabase Storage)

- **버킷**: `note-images` (public)
- **경로**: `public/{noteId}/{uuid}.{ext}`
- **업로드 트리거**: 에디터 textarea `onPaste` 이벤트 (이미지 파일 감지 시)
- **플로우**: 클립보드 이미지 → `![업로드 중...-uid]()` 삽입 → Storage 업로드 → 실제 URL로 교체 → 자동 저장
- **삭제**: 노트 삭제 시 `public/{noteId}/` 폴더 전체 삭제, 에디터에서 이미지 markdown 제거 후 저장 시 Storage에서도 자동 삭제
- **Storage 정책**: `note-images` 버킷 — `FOR ALL TO public USING (bucket_id = 'note-images')`
- **유틸 함수** (`src/lib/storage.js`):
  - `uploadImage(noteId, file)` → publicUrl 반환
  - `deleteNoteImages(noteId)` → 노트 폴더 전체 삭제
  - `findRemovedStoragePaths(oldContent, newContent)` → 제거된 이미지 경로 배열 반환
  - `deleteImagePaths(paths)` → 경로 배열로 일괄 삭제

## 라우팅

- **라이브러리**: `react-router-dom` v7
- **설정 위치**: `src/main.jsx` (`BrowserRouter` + `Routes`)
- **라우트**:
  - `/*` → `App` (메인 앱)
  - `/share/:noteId` → `SharePage` (공유 뷰, 인증 불필요)
- **Vercel SPA fallback**: `vercel.json` — `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`

## 현재 상태 / 한계
- **단일 사용자** — 계정은 Supabase 대시보드에서 직접 생성
- **테스트 없음** — 테스트 파일 없음
- **TypeScript 미사용** — 순수 JavaScript
