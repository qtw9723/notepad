import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  const { method } = req;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // 유저 JWT로 Supabase 클라이언트 생성 → RLS 자동 적용
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // GET / — 노트 목록
    if (method === "GET" && !id) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return json(data);
    }

    // GET ?id=... — 단일 노트
    if (method === "GET" && id) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return json(data);
    }

    // POST — 노트 생성
    if (method === "POST") {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return json({ error: "Unauthorized" }, 401);

      const body = await req.json().catch(() => null);
      if (!body) return json({ error: "바디가 비어있습니다." }, 400);

      const { data, error } = await supabase
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

      const { data, error } = await supabase
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
      const { error } = await supabase
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
