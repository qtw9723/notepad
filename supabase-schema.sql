-- notes 테이블 생성 (신규)
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,  -- nullable: 기존 데이터 호환
  title text not null default '',
  content text not null default '',
  content_type text not null default 'markdown' check (content_type in ('markdown', 'html', 'text')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ※ RLS 비활성화 — Edge Function이 service_role key로 접근하므로 불필요
--   인증은 Edge Function에서 JWT 검증으로 처리

-- 기존 테이블에 user_id 컬럼 추가 시 (마이그레이션용, nullable로)
-- alter table notes add column if not exists user_id uuid references auth.users(id) on delete cascade;
-- 기존 노트에 특정 유저 ID 일괄 할당 시:
-- update notes set user_id = '<your-user-uuid>' where user_id is null;
