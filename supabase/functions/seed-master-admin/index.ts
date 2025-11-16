// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing environment variables" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Master admin credentials (idempotent seeding)
    const email = "ramonmatos390@gmail.com";
    const password = "M@415263s";

    let userId: string | undefined;
    let created = false;

    // Try to find by profile first (fast path)
    const { data: existingProf, error: profErr } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (profErr) throw profErr;

    if (existingProf && existingProf.length > 0) {
      userId = existingProf[0].id as any;
    } else {
      // Create auth user (idempotent - if exists, we'll fetch it)
      const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome: "Master Admin" },
      });

      if (createErr) {
        // If already exists, resolve id by listing users
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) throw listErr;
        const found = list?.users?.find((u: any) => u.email === email);
        if (!found) throw createErr;
        userId = found.id;
      } else {
        userId = createdUser.user?.id;
        created = true;
      }
    }

    if (!userId) throw new Error("Could not resolve master admin user id");

    // Upsert full-permission profile for dashboard logic already in app
    const permissoes = {
      visualizar_estoque: true,
      visualizar_alertas: true,
      visualizar_cadastro: true,
      visualizar_terminal: true,
      visualizar_pedidos: true,
      editar_valores: true,
      editar_alertas: true,
      editar_estoque: true,
      editar_pedidos: true,
      gerenciar_admin: true,
    } as any;

    const { error: upsertErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          nome: "Master Admin",
          email,
          senha_temporaria: false,
          tipo_acesso: "admin",
          permissoes,
        },
        { onConflict: "id" }
      );

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ ok: true, created, userId }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
});
