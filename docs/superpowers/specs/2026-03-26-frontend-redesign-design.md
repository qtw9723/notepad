# Frontend Redesign — Design Spec

## 목표
GitHub Dark / Raycast 느낌의 파란빛 다크 테마로 전환. Notion UX 참고, 깔끔하고 눈에 편한 디자인.

## 접근법
Approach A — 기존 컴포넌트 구조 유지, 색상 시스템 + 레이아웃만 교체.

---

## 1. 색상 시스템

| 역할 | 값 |
|------|-----|
| 배경 (메인) | `#0d1117` |
| 사이드바 배경 | `#161b22` |
| 테두리 | `#21262d` |
| 강조색 | `#388bfd` |
| 강조 hover | `#1f6feb` |
| 텍스트 기본 | `#e6edf3` |
| 텍스트 보조 | `#8b949e` |
| 선택 배경 | `#388bfd/12` |
| 저장 상태 텍스트 | `#58a6ff` |

---

## 2. 사이드바

- **접힌 상태** (기본): 너비 `48px`, 아이콘만 표시
  - 검색 아이콘, 구획별 아이콘(이니셜 뱃지), 로그인/아웃 아이콘
  - hover 시 툴팁
- **펼친 상태**: 너비 `288px`
  - 사이드바 상단 토글 버튼으로 전환
  - CSS transition (width + opacity)
  - 상태 localStorage 저장
- 선택된 노트: 왼쪽 파란 세로 바 강조

---

## 3. 에디터

- 툴바: 배경 `#161b22`, 파란 강조색 토글 버튼
- 본문: 최대 너비 `760px` 가운데 정렬
- 제목: `2.2rem`, `font-weight: 700`
- 줄간격: `1.9`
- 코드블록: 배경 `#161b22`, 테두리 `#21262d`
- 링크 색: `#58a6ff`
- 빈 상태: 앱 이름 연하게 표시

---

## 파일 범위
- `src/index.css`
- `src/components/Sidebar.jsx`
- `src/components/Editor.jsx`
- `src/components/LoginPage.jsx`
- `src/App.jsx`
