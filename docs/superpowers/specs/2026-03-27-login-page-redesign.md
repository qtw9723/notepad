# Login Page Redesign

**Date:** 2026-03-27
**Status:** Approved

## Problem

현재 로그인 모달은 GitHub Dark 팔레트(`#161b22`, 파란 강조 `#388bfd`)를 사용해 앱 본체의 팔레트(`#0d1117`, 보라 `#7c6af5`)와 무드가 불일치한다. 가시성 부족, 텍스트 여백 부족, 크기 불균형 문제도 있다.

## Goals

- 앱 팔레트와 일관된 무드로 통일
- 가시성과 여백 개선
- 풀스크린 경험으로 격상 (모달 → 전체화면)

## Design Decisions

| 항목 | 결정 |
|------|------|
| 형태 | 풀스크린 (반투명 오버레이 제거) |
| 배경 | 닷 그리드 + 중앙 보라 글로우 |
| 강조색 | `#9d8ffc` (기존 `#7c6af5`보다 밝고 생동감 있게) |
| 폼 컨테이너 | 글래스 카드 |

## Visual Design

### 배경 (`App.jsx` 오버레이)

```
배경색:   #0d1117
닷 그리드: radial-gradient(#9d8ffc0a 1px, transparent 1px), 18px 간격
보라 글로우: radial-gradient(ellipse 60% 50% at 50% 40%, #9d8ffc18, transparent 70%)
```

기존 `bg-black/60 backdrop-blur-sm` → `bg-[#0d1117]` + 위 패턴을 인라인 스타일로 적용

### 글래스 카드

```
너비:    max-w-sm (384px)
배경:    rgba(255,255,255,0.03)
테두리:  1px solid rgba(157,143,252,0.2)
blur:    backdrop-filter: blur(12px)
모서리:  rounded-2xl
패딩:    p-8
```

### 카드 내부 레이아웃 (위→아래)

1. **심볼 아이콘** — `w-10 h-10` 보라 틴트 rounded-xl 박스, 중앙 정렬
   - 배경: `rgba(157,143,252,0.15)`, 테두리: `rgba(157,143,252,0.3)`
   - 아이콘: lucide `PenLine` size 18, 색상 `#9d8ffc`
2. **타이틀** "Notepad" — `text-3xl font-bold text-[#f0f0f0] tracking-tight`, `mt-4`
3. **서브타이틀** — `text-sm text-[#606070]`, `mt-1 mb-8`
4. **프로젝트 드롭다운** — label + select
5. **비밀번호 인풋** — label + input
6. **에러 메시지** — 기존 스타일 유지 (red-400 tint)
7. **로그인 버튼** — 풀 너비, `bg-[#9d8ffc]` 배경, `text-[#0d0d10]` 텍스트

### 인풋 스타일

```
배경:    #0a0a0c
테두리:  1px solid #2a2a38
포커스:  border-color #9d8ffc
패딩:    px-4 py-3
텍스트:  text-[15px] text-[#e2e2e2]
placeholder: text-[#484f58]
rounded: rounded-xl
```

### 레이블 스타일

```
text-[12px] font-semibold text-[#8b8890] uppercase tracking-wider mb-2
```

### 버튼 스타일

```
배경:    #9d8ffc
hover:   #b8aeff
disabled: opacity-40
텍스트:  #0d0d10, font-semibold text-[15px]
패딩:    py-3
rounded: rounded-xl
```

### X 버튼 (닫기)

풀스크린 전환 후에도 `onClose`가 있을 경우 표시. 우상단 고정.

## Implementation Scope

### 변경 파일

1. **`src/components/LoginPage.jsx`** — 전체 재작성
   - 심볼 아이콘 추가 (lucide `PenLine`)
   - 글래스 카드 레이아웃
   - 새 색상/타이포 적용

2. **`src/App.jsx`** — 오버레이 클래스 변경
   - `bg-black/60 backdrop-blur-sm` → `bg-[#0d1117]` + dot grid 배경 인라인 스타일

### 변경하지 않는 것

- Props 인터페이스 (`projects`, `onSignIn`, `onClose`) — 동일 유지
- 로직 (handleSubmit, 에러 처리, 로딩 상태) — 동일 유지
- `useAuth.js`, `useProjects.js` — 변경 없음

## Out of Scope

- 회원가입 기능
- 소셜 로그인
- 애니메이션/트랜지션 (별도로 논의 가능)
