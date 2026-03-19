-- notes 테이블 생성
create table notes (
  id uuid default gen_random_uuid() primary key,
  title text not null default '',
  content text not null default '',
  content_type text not null default 'markdown' check (content_type in ('markdown', 'html', 'text')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- 나중에 인증 추가 시 아래 컬럼 추가:
  -- user_id uuid references auth.users(id) on delete cascade
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

-- RLS (나중에 인증 추가 시 활성화)
-- alter table notes enable row level security;
-- create policy "본인 메모만 접근" on notes
--   for all using (auth.uid() = user_id);
