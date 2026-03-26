import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// RLS 우회 — DB 직접 접근용 (서버 전용)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  const { method } = req;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const type = url.searchParams.get("type");

  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // GET ?type=projects — 프로젝트 목록 (공개, 인증 불필요)
  if (method === "GET" && type === "projects") {
    const { data, error } = await adminClient
      .from("projects")
      .select("id, name, slug, is_master, user_id")
      .order("created_at", { ascending: true });
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // JWT로 유저 인증 확인 (선택적 — GET은 비인증 허용)
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();

  // 마스터 여부 확인
  let isMaster = false;
  if (user) {
    const { data: project } = await adminClient
      .from("projects")
      .select("is_master")
      .eq("user_id", user.id)
      .maybeSingle();
    isMaster = project?.is_master ?? false;
  }

  try {
    // GET / — 노트 목록
    // 비로그인:     user_id = NULL 인 공개 노트만
    // 로그인(일반): 본인 노트 + 공개 노트
    // 마스터:       전체 노트
    if (method === "GET" && !id) {
      const query = adminClient
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      const { data, error } = await (
        isMaster
          ? query
          : user
            ? query.or(`user_id.eq.${user.id},user_id.is.null`)
            : query.is("user_id", null)
      );
      if (error) throw error;
      return json(data);
    }

    // GET ?id=... — 단일 노트 (비인증 허용)
    if (method === "GET" && id) {
      const { data, error } = await adminClient
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return json(data);
    }

    // 쓰기 작업은 로그인 필요
    if (!user) return json({ error: "Unauthorized" }, 401);

    // POST — 노트 생성
    if (method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "바디가 비어있습니다." }, 400);

      const { data, error } = await adminClient
        .from("notes")
        .insert({ ...body, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return json(data, 201);
    }

    // PATCH ?id=... — 노트 수정
    if (method === "PATCH" && id) {
      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "바디가 비어있습니다." }, 400);

      const { data, error } = await adminClient
        .from("notes")
        .update(body)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return json(data);
    }

    // DELETE ?id=... — 노트 삭제
    if (method === "DELETE" && id) {
      const { error } = await adminClient
        .from("notes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Not Found" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
