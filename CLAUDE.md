# Notepad App — Project Guide

## 프로젝트 개요
React + Vite + Tailwind CSS + Supabase 기반 메모장 앱. 다크 테마, 마크다운 지원, 태그 기반 필터링, 자동 저장 기능을 갖춘 싱글 유저용 노트 앱.

## 기술 스택
- **React 19** — UI 프레임워크
- **Vite 8** — 빌드 도구 / 개발 서버
- **Tailwind CSS 4** — 스타일링 (Vite 플러그인 방식)
- **Supabase** — PostgreSQL 백엔드 (BaaS)
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
│   └── TagInput.jsx      # 태그 입력/관리 UI
├── hooks/
│   └── useNotes.js       # 노트 CRUD 커스텀 훅
└── lib/
    └── supabase.js       # Supabase 클라이언트 싱글톤
supabase-schema.sql       # DB 스키마
```

## 데이터 모델 (notes 테이블)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, 자동 생성 |
| title | TEXT | 노트 제목 |
| content | TEXT | 노트 내용 |
| content_type | TEXT | 'markdown' \| 'html' \| 'text' |
| tags | TEXT[] | 태그 배열 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 (트리거 자동 갱신) |

## 핵심 로직

### 상태 흐름
```
App.jsx (selectedId, notes)
  ├── Sidebar ← 목록 표시, 선택/삭제
  └── Editor  ← 선택된 노트 편집
        ↓ 800ms debounce 자동 저장
      useNotes hook
        ↓
      Supabase API
```

### useNotes 훅
- 마운트 시 전체 노트 fetch (updated_at DESC 정렬)
- createNote / updateNote / deleteNote 제공
- 로컬 상태 낙관적 업데이트

### Editor 자동 저장
- 제목/내용/태그 변경 시 800ms 디바운스 후 Supabase에 저장
- 저장 상태 표시: "저장 중..." / "저장됨"

## 디자인 시스템
- 배경: `#0f0f10`
- 강조색: `#7c6af5` (보라)
- 텍스트: `#e2e2e2` (밝은 회색)
- 보조 텍스트: `#606070`
- 테두리: `#242428` / `#2a2a38`

## 백엔드 연동

백엔드는 `/Users/sangjun/IdeaProjects/parking` Supabase 프로젝트의 `notepad` Edge Function으로 운영됩니다.

**현재 상태:** 프론트가 Supabase SDK로 DB에 직접 연결 중 (`src/lib/supabase.js`, `src/hooks/useNotes.js`)

**Edge Function 전환 시:** `useNotes.js`의 Supabase SDK 호출을 아래 패턴으로 교체
```js
// 목록 조회
fetch(`${EDGE_FUNCTION_URL}/notepad`)
// 생성
fetch(`${EDGE_FUNCTION_URL}/notepad`, { method: 'POST', body: JSON.stringify({...}) })
// 수정
fetch(`${EDGE_FUNCTION_URL}/notepad?id=${id}`, { method: 'PATCH', body: JSON.stringify(changes) })
// 삭제
fetch(`${EDGE_FUNCTION_URL}/notepad?id=${id}`, { method: 'DELETE' })
```

## 환경 변수
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
`.env.example` 파일 참고. 실제 값은 `.env`에 저장 (gitignore됨).

## 개발 명령어
```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 실행
```

## 현재 상태 / 한계
- **인증 없음** — 단일 사용자 or 공개 접근 (user_id 컬럼은 스키마에 준비됨)
- **RLS 비활성화** — 모든 노트가 누구에게나 보임 (스키마에 주석으로 준비됨)
- **Supabase 직접 연결** — Edge Function 전환 전까지 anon key로 DB 직접 접근
- **테스트 없음** — 테스트 파일 없음
- **TypeScript 미사용** — 순수 JavaScript
