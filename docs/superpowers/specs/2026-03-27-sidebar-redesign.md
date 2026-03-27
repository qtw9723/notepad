# Sidebar Redesign

**Date:** 2026-03-27
**Status:** Approved

## Problem

현재 사이드바는 GitHub Dark 팔레트(`#161b22` 배경, `#388bfd` 파란 강조)를 사용해 로그인 화면의 보라 팔레트와 무드가 불일치한다. 텍스트(12~14px)와 버튼(24~28px)이 전반적으로 작고, 프로젝트 섹션 구분이 약하다.

## Goals

- 로그인 화면과 같은 보라 팔레트로 통일
- 텍스트/버튼 크기 개선
- 프로젝트별 섹션 구분 명확화 (패널 방식)

## Design Decisions

| 항목 | 결정 |
|------|------|
| 너비 | 288px (필요 시 320px) |
| 배경 | `#0d0d14` (보라 틴트 다크) |
| 강조색 | `#9d8ffc` (로그인과 동일) |
| 섹션 스타일 | 패널형 — 프로젝트마다 둥근 카드로 감쌈 |

## CSS 전략

로그인 화면과 동일하게 `index.css`에 `.sidebar-*` 클래스로 정의. 인라인 스타일 없음.

## Visual Design

### 전체 레이아웃

```
배경:  #0d0d14
너비:  288px (open), 48px (closed)
border-right: 1px solid rgba(157,143,252,0.1)
```

### 헤더

```
padding: 14px 16px 12px
border-bottom: 1px solid rgba(157,143,252,0.1)

레이블 "메모":
  font-size: 11px, font-weight: 800
  text-transform: uppercase, letter-spacing: 0.12em
  color: #8b8890

토글 버튼:
  28×28px, border-radius: 8px
  background: rgba(157,143,252,0.08)
  border: 1px solid rgba(157,143,252,0.2)
  color: #9d8ffc
  hover: background rgba(157,143,252,0.15)
```

### 검색창

```
container padding: 12px 14px 10px
border-bottom: 1px solid rgba(157,143,252,0.06)

input:
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(157,143,252,0.15)
  border-radius: 9px
  padding: 8px 12px
  font-size: 13px
  color: #e2e2e2
  placeholder: #606070
  focus border-color: #9d8ffc
```

### 태그 필터

```
container: px 14px, pb 10px, flex-wrap, gap 6px

비활성 태그 pill:
  font-size: 11px, padding: 4px 10px
  border-radius: 999px
  color: #606070
  hover: background rgba(255,255,255,0.05), color #a090e0

활성 태그 pill:
  background: rgba(157,143,252,0.15)
  border: 1px solid rgba(157,143,252,0.3)
  color: #9d8ffc
```

### 섹션 패널 (핵심)

```
스크롤 영역:
  padding: 10px 10px 0
  display: flex, flex-direction: column, gap: 10px

패널 컨테이너:
  background: rgba(255,255,255,0.02)
  border: 1px solid rgba(157,143,252,0.12)
  border-radius: 12px
  overflow: hidden

패널 헤더:
  padding: 10px 14px
  background: rgba(157,143,252,0.05)
  border-bottom: 1px solid rgba(157,143,252,0.1)
  display: flex, align-items: center, justify-content: space-between

  왼쪽:
    보라 점 (6×6px, border-radius:50%, background:#9d8ffc, opacity:0.6)
    + 섹션명 (10px, uppercase, tracking 0.12em, #8b8890)

  오른쪽:
    노트 수 (10px, #404050)
    + 새 메모 버튼 (canCreate 섹션만, hover 시 opacity 1)
      24×24px, color #9d8ffc, hover bg rgba(157,143,252,0.15)

노트 로우:
  padding: 9px 10px, border-radius: 8px
  hover: background rgba(255,255,255,0.04)
  selected: background rgba(157,143,252,0.12)

  제목: 14px, font-weight: 500
    기본 #c8c8d8 / 선택 #f0f0f0

  메타 (날짜 + 태그): 11px, color #484858
    태그: color #7060c0, margin-left: 6px

  삭제 버튼: 기본 opacity 0, group-hover 시 opacity 1
    hover: text red-400, bg red-400/10
```

### 하단 유저 영역

```
border-top: 1px solid rgba(157,143,252,0.1)
padding: 12px 14px

로그인 상태:
  아바타 박스: 30×30px, border-radius: 9px
    background: rgba(157,143,252,0.15)
    border: 1px solid rgba(157,143,252,0.3)
    이니셜: 12px, font-weight: 800, color #9d8ffc
  유저명: 14px, font-weight: 500, color #c0c0d0, truncate
  로그아웃 버튼: 30×30px, border-radius: 8px
    background: rgba(255,255,255,0.04), color #606070
    hover: color red-400, bg rgba(red,0.1)

비로그인 상태:
  버튼: 전체 너비, padding: 10px
  border: 1px solid rgba(157,143,252,0.25)
  border-radius: 10px
  color: #9d8ffc, font-size: 14px, font-weight: 500
  hover: background rgba(157,143,252,0.1)
```

### 접힌 상태 (48px)

```
아이콘 버튼: 모두 32×32px, color #606070
hover: color #a090e0, background rgba(157,143,252,0.08)
로그인 버튼: color #9d8ffc
로그아웃 버튼: hover color red-400
```

## Implementation Scope

### 변경 파일

1. **`src/index.css`** — `.sidebar-*` CSS 클래스 추가
2. **`src/components/Sidebar.jsx`** — 전체 재작성 (클래스 기반)

### 변경하지 않는 것

- Props 인터페이스 동일 유지
- 상태 로직 (isOpen, search, activeTag, collapsedSections) 동일 유지
- 섹션 계산 로직 (sections useMemo) 동일 유지

## Out of Scope

- 접힌 상태 애니메이션 개선
- 드래그로 너비 조절
- 노트 순서 변경
