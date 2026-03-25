-- notes 테이블 생성
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

-- RLS 활성화
alter table notes enable row level security;

-- 본인 메모만 접근 가능
create policy "본인 메모만 접근" on notes
  for all using (auth.uid() = user_id);

-- 기존 테이블에 user_id 컬럼 추가 시 (마이그레이션용)
-- alter table notes add column user_id uuid references auth.users(id) on delete cascade;
-- alter table notes alter column user_id set not null;
-- alter table notes enable row level security;
-- create policy "본인 메모만 접근" on notes for all using (auth.uid() = user_id);
