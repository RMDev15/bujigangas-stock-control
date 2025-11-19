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

    // SEED: Admin Master e Usuário Comum conforme documento
    const users = [
      {
        email: "ramonmatos390@gmail.com",
        password: "M@415263s",
        nome: "Master Admin",
        tipo_acesso: "admin",
        permissoes: {
          gerenciar_usuarios: "total",
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
        },
      },
      {
        email: "comum@teste.com",
        password: "Temp100@",
        nome: "Usuário Comum",
        tipo_acesso: "comum",
        permissoes: {
          gerenciar_usuarios: "visualizar",
          visualizar_estoque: true,
          visualizar_alertas: false,
          visualizar_cadastro: false,
          visualizar_terminal: true,
          visualizar_pedidos: false,
          editar_valores: false,
          editar_alertas: false,
          editar_estoque: false,
          editar_pedidos: false,
          gerenciar_admin: false,
        },
      },
    ];

    const results = [];

    for (const userData of users) {
      let userId: string | undefined;
      let created = false;

      // Verificar se o perfil já existe
      const { data: existingProf, error: profErr } = await admin
        .from("profiles")
        .select("id")
        .eq("email", userData.email)
        .limit(1);

      if (profErr) throw profErr;

      if (existingProf && existingProf.length > 0) {
        userId = existingProf[0].id as any;
      } else {
        // Criar usuário de autenticação
        const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { nome: userData.nome },
        });

        if (createErr) {
          // Se já existe, buscar o usuário
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (listErr) throw listErr;
          const found = list?.users?.find((u: any) => u.email === userData.email);
          if (!found) throw createErr;
          userId = found.id;
        } else {
          userId = createdUser.user?.id;
          created = true;
        }
      }

      if (!userId) throw new Error(`Could not resolve user id for ${userData.email}`);

      // Upsert perfil completo
      const { error: upsertErr } = await admin
        .from("profiles")
        .upsert(
          {
            id: userId,
            nome: userData.nome,
            email: userData.email,
            senha_temporaria: userData.email === "comum@teste.com", // Apenas comum tem senha temporária
            tipo_acesso: userData.tipo_acesso,
            permissoes: userData.permissoes,
          },
          { onConflict: "id" }
        );

      if (upsertErr) throw upsertErr;

      results.push({
        email: userData.email,
        created,
        userId,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, users: results }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
});
