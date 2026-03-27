# Mailer App Design

**Date:** 2026-03-27
**Status:** Approved

## Overview

메일을 반복적으로 발송하는 작업(job)을 관리하는 단일 페이지 웹앱.
발신자는 하드코딩(Gmail, Outlook), 수신자는 UI에서 입력.
일정 간격으로 반복 발송하며, 브라우저를 닫아도 서버에서 계속 실행됨.

## Architecture

```
[Vercel] React/Vite 앱 (새 레포: mailer)
    ↕ REST (anon key)
[Supabase: parking 프로젝트] Edge Function: mailer
    ├── CRUD: 작업 생성/조회/수정/삭제/시작/중지
    └── tick: 발송할 차례인 작업 처리
[Supabase] pg_cron
    └── 매 1분마다 → POST /functions/v1/mailer?action=tick
[Supabase] PostgreSQL
    └── mail_jobs 테이블
[SMTP]
    ├── Gmail: smtp.gmail.com:587 (App Password)
    └── Outlook: smtp.office365.com:587 (App Password)
```

- Edge Function: `parking` 프로젝트의 `supabase/functions/mailer/`
- 프론트: 새 Vite 앱 (`/Users/sangjun/IdeaProjects/mailer`)
- 발신 계정 정보는 Supabase Secrets에 저장 (코드 노출 없음)

## Data Model

### `mail_jobs` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK, gen_random_uuid() |
| `name` | TEXT NOT NULL | 작업 이름 (UI 표시용) |
| `subject` | TEXT NOT NULL | 메일 제목 |
| `body` | TEXT NOT NULL | 메일 본문 (plain text) |
| `recipients` | TEXT[] NOT NULL | 수신자 이메일 배열 |
| `sender` | TEXT NOT NULL | `'gmail'` \| `'ms'` |
| `interval_minutes` | INTEGER NOT NULL | 발송 간격 (분, 최소 1) |
| `is_active` | BOOLEAN NOT NULL DEFAULT false | 실행 중 여부 |
| `last_sent_at` | TIMESTAMPTZ | 마지막 발송 시각 (NULL = 미발송) |
| `send_count` | INTEGER NOT NULL DEFAULT 0 | 누적 발송 횟수 |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT now() | 생성일시 |

## Edge Function: mailer

경로: `supabase/functions/mailer/index.ts` (parking 레포)

### 엔드포인트

| 메서드 | 파라미터 | 설명 |
|--------|----------|------|
| GET | — | 전체 작업 목록 조회 |
| POST | body: JobCreate | 작업 생성 |
| PATCH | `?id=` + body: JobUpdate | 작업 수정 (내용 or 시작/중지) |
| DELETE | `?id=` | 작업 삭제 |
| POST | `?action=tick` | pg_cron 호출 — 발송 처리 |

### tick 로직

```
SELECT * FROM mail_jobs
WHERE is_active = true
  AND (last_sent_at IS NULL OR now() >= last_sent_at + interval_minutes * interval '1 minute')

→ 각 작업의 모든 수신자에게 SMTP 메일 발송 (병렬)
→ UPDATE last_sent_at = now(), send_count = send_count + 1
→ 발송 실패 시 console.error 기록 (Supabase Dashboard → Edge Function Logs에서 확인 가능)
→ 작업 중지하지 않음 — 다음 tick에 재시도
```

### 메일 발송

- Deno SMTP 라이브러리: `denomailer` (deno.land/x/denomailer)
- Gmail: `smtp.gmail.com:587`, STARTTLS
- Outlook: `smtp.office365.com:587`, STARTTLS

### Supabase Secrets

```
GMAIL_USER=<gmail주소>
GMAIL_APP_PASSWORD=<앱비밀번호>
MS_USER=<outlook주소>
MS_APP_PASSWORD=<앱비밀번호>
APP_PASSWORD=<프론트 비밀번호 게이트용>
```

### 보안

- tick 엔드포인트: Authorization 헤더 검증 (anon key)
- CRUD 엔드포인트: `X-App-Password` 헤더로 APP_PASSWORD 검증
- CORS: `*` 허용 (APP_PASSWORD로 충분히 보호됨)

## pg_cron 설정

Supabase SQL Editor에서 1회 실행:

```sql
SELECT cron.schedule(
  'mailer-tick',
  '* * * * *',
  $$SELECT net.http_post(
    'https://enawzdqroidrhtjqhpka.supabase.co/functions/v1/mailer?action=tick',
    '{}',
    'application/json',
    '{"Authorization": "Bearer <anon-key>"}'::jsonb
  )$$
);
```

## Frontend

**레포**: `/Users/sangjun/IdeaProjects/mailer`
**스택**: React 19 + Vite + Tailwind CSS 4 (notepad와 동일)
**배포**: Vercel (별도 프로젝트)

### 화면 구성

**비밀번호 게이트**: 앱 진입 시 비밀번호 입력. 맞으면 localStorage에 저장해 재입력 불필요. notepad 로그인과 동일한 스타일.

**메인 화면 — 작업 목록**:
- 상단: `[+ 새 작업]` 버튼
- 작업 카드 (notepad sidebar-section 패널 스타일):
  - 작업명, 발신자(Gmail/MS 뱃지), 수신자 수, 발송 간격
  - 마지막 발송 시각, 누적 발송 횟수
  - `[시작]` / `[중지]` 토글 버튼, `[수정]` 버튼, `[삭제]` 버튼
  - 활성 작업: 보라 테두리 강조

**작업 생성/수정 모달**:
- 작업 이름
- 발신자: Gmail / MS (라디오 버튼)
- 메일 제목
- 메일 본문 (textarea)
- 수신자 (태그 입력 — 엔터/쉼표로 추가, X로 제거)
- 발송 간격: 숫자 입력 + 분/시간 선택 (시간 선택 시 내부적으로 분으로 변환)

### 디자인 시스템

notepad와 동일한 팔레트:
- 배경: `#0d0d14`
- 강조: `#9d8ffc`
- 텍스트: `#e2e2e2`
- 보조: `#606070`
- 테두리: `rgba(157,143,252,0.15)`

## 환경 변수 (프론트)

```
VITE_SUPABASE_URL=https://enawzdqroidrhtjqhpka.supabase.co
VITE_MAILER_URL=https://enawzdqroidrhtjqhpka.supabase.co/functions/v1/mailer
```

## Out of Scope

- 발송 이력/로그 화면
- 메일 템플릿 저장
- 수신자 그룹 관리
- HTML 메일 (plain text만)
- 재시도 횟수 제한
