# Share Page — Design Spec

Date: 2026-04-08

## Summary

노트별 공유 링크를 생성하고, 해당 링크에서 뷰 전용 공유 페이지를 제공한다. react-router-dom 기반 SPA 라우팅을 추가하며, 추후 비밀번호 보호·에디터 연동 확장을 고려한 구조로 설계한다.

---

## 1. 라우팅 구조

- **라이브러리**: `react-router-dom`
- **라우트**:
  - `/` → 기존 App (로그인, 사이드바, 에디터)
  - `/share/:noteId` → SharePage (뷰 전용, 인증 불필요)
- **SPA fallback**: `vercel.json`에 rewrites 설정 (모든 경로를 `index.html`로 fallback)

---

## 2. SharePage (`src/components/SharePage.jsx`)

- `useParams()`로 `noteId` 추출
- `api.getNote(noteId)` 호출 (Edge Function GET은 인증 불필요)
- 상태: 로딩 중 / 노트 없음(404) / 렌더링
- 렌더링: 제목 + 마크다운 미리보기만 표시
  - 기존 `markdown-body` CSS 클래스 + 다크 테마 동일 적용
  - `remark-gfm` 포함 (기존 Editor와 동일한 ReactMarkdown 설정)
  - 사이드바, 툴바, 태그, 편집 UI 없음
- 헤더: 앱 이름("Notepad") 로고 + 원본 앱 링크 (`/` 로 이동)

---

## 3. 링크 복사 버튼 (Editor 툴바)

- 위치: `Editor.jsx` 툴바 우측, 저장 상태 표시 왼쪽
- 표시 조건: `canEdit === true` (로그인 사용자만)
- 아이콘: `lucide-react`의 `Link` 아이콘
- 동작: `navigator.clipboard.writeText(window.location.origin + '/share/' + noteId)`
- 피드백: 클릭 후 1.5초간 "복사됨" 표시 후 원상복귀 (기존 저장됨 표시와 동일 패턴)

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `package.json` | `react-router-dom` 의존성 추가 |
| `src/main.jsx` | `BrowserRouter` 감싸기 |
| `src/App.jsx` | `Routes` / `Route` 로 분기 (`/`, `/share/:noteId`) |
| `src/components/SharePage.jsx` | 신규 — 공유 뷰 페이지 |
| `src/components/Editor.jsx` | 툴바에 링크 복사 버튼 추가 |
| `vercel.json` | SPA fallback rewrites 설정 |

---

## 범위 외 (Out of Scope)

- 비밀번호 보호
- 공유 페이지에서 편집
- 공유 활성화/비활성화 토글
- OG 메타태그 / SNS 미리보기
