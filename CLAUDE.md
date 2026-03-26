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
├── main.jsx              # 앱 진입점
├── App.jsx               # 루트 컴포넌트, 전역 상태 관리
├── index.css             # 전역 스타일 + Tailwind + 마크다운 스타일
├── components/
│   ├── Sidebar.jsx       # 노트 목록, 검색, 태그 필터
│   ├── Editor.jsx        # 노트 에디터/미리보기
│   ├── LoginPage.jsx     # 로그인/회원가입 모달
│   └── TagInput.jsx      # 태그 입력/관리 UI
├── hooks/
│   ├── useNotes.js       # 노트 CRUD 커스텀 훅
│   └── useAuth.js        # Supabase Auth 세션 관리 훅
└── lib/
    ├── supabase.js       # Supabase 클라이언트 싱글톤
    └── api.js            # Edge Function fetch 래퍼
supabase/
└── functions/
    └── notepad/
        └── index.ts      # Edge Function (CRUD + 인증)
supabase-schema.sql       # DB 스키마 참고용
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
- 배경: `#0f0f10`
- 강조색: `#7c6af5` (보라)
- 텍스트: `#e2e2e2` (밝은 회색)
- 보조 텍스트: `#606070`
- 테두리: `#242428` / `#2a2a38`

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
# notepad 레포 루트에서
supabase functions deploy notepad --project-ref enawzdqroidrhtjqhpka
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

## 현재 상태 / 한계
- **단일 사용자** — 계정은 Supabase 대시보드에서 직접 생성
- **테스트 없음** — 테스트 파일 없음
- **TypeScript 미사용** — 순수 JavaScript
