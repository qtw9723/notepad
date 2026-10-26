# Notepad

마크다운 메모와 할 일(Todo) 일정을 한 곳에서 관리하는 개인용 웹 앱입니다.
다크 테마, 태그 필터링, 자동 저장, 버전 기록, 공유 링크를 지원합니다.

## 주요 기능

### 노트
- 마크다운 / HTML / 텍스트 노트, 에디터와 미리보기를 나란히 보는 분할 화면 (스크롤 동기화)
- 입력 후 800ms 뒤 자동 저장, 저장 상태 표시
- 태그 입력과 태그별 필터링, 검색 (태그는 `#` 제거·공백 하이픈 변환으로 정규화)
- 클립보드 이미지 붙여넣기 업로드, 노트 삭제나 이미지 제거 시 저장소에서도 자동 정리
- 문서 파일 첨부와 뷰어
- 버전 기록: 스냅샷 저장, 이전 버전 복원, 내용이 크게 줄어들 때 감지
- 공유 링크(`/share/:noteId`)로 로그인 없이 읽기 전용 열람
- 프로젝트 단위로 노트를 나누고, 로그아웃 없이 프로젝트 전환
- 모바일 화면: 목록 → 미리보기 → 편집 3단계 전환

### Todo
- 일정 등록, 완료 처리와 수행 시간 계산
- 보드 / 달력 / 타임라인 보기
- 시작·종료 시간 입력 (10분 단위), 종료 일자
- 여러 노트를 연결하고 오른쪽 패널에서 미리보기

## 기술 스택

| 영역 | 사용 |
|------|------|
| 프론트엔드 | React 19, Vite 8, React Router, Tailwind CSS 4 |
| 편집·표시 | react-markdown, remark-gfm, dnd-kit, react-resizable-panels, lucide-react |
| 백엔드 | Supabase (PostgreSQL, Auth, Edge Function) |
| 파일 저장 | Cloudflare R2 (이미지·첨부) |
| 테스트 | Vitest |
| 배포 | Vercel (SPA rewrite) |

## 구조

```
src/
├── components/   Sidebar, Editor, SharePage, VersionHistoryModal, todo/ ...
├── hooks/        useNotes, useAuth, useProjects, useTodos, usePush, useMobile
├── lib/          API 래퍼, 스토리지, 태그 로직, 노트 설정
└── pages/        TodoPage
supabase/
└── functions/notepad/   Edge Function (노트 CRUD + 인증 확인)
supabase-schema.sql      DB 스키마 참고용
docs/                    설계 문서·계획
```

프론트엔드는 DB에 직접 접근하지 않고 Edge Function을 통해서만 요청합니다.
조회는 비로그인으로도 가능하고, 생성·수정·삭제는 로그인(Supabase Auth)이 필요합니다.

## 시작하기

```bash
npm install
cp .env.example .env   # 값을 채웁니다
npm run dev
```

### 환경 변수

| 변수 | 용도 |
|------|------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase 클라이언트 |
| `VITE_NOTEPAD_URL` | Edge Function 주소 |
| `VITE_R2_PUBLIC_URL` | 이미지·첨부 공개 주소 |

### 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run test:run` | 테스트 1회 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run verify` | lint, 테스트, 빌드를 한 번에 실행 |

## 배포

- 프론트엔드: Vercel (`main` 푸시 시 자동 배포, 환경 변수는 Vercel 대시보드에 등록)
- Edge Function: Supabase CLI로 수동 배포 (함수 내부에서 JWT를 직접 검증하므로 `--no-verify-jwt` 필요)

## 참고

개인용으로 만든 앱이라 계정은 Supabase 대시보드에서 직접 생성합니다.
