// Cria o usuário inicial do dono da lanchonete no Supabase Auth.
// Precisa da service role key (NUNCA vai pro navegador nem é commitada) —
// pegue em Project Settings > API > service_role no dashboard do Supabase.
//
// Uso:
//   SUPABASE_SERVICE_ROLE_KEY=sua-chave node scripts/criar-admin.mjs
//
// Alternativa sem rodar script nenhum: Dashboard do Supabase >
// Authentication > Users > Add user > marque "Auto Confirm User".

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const EMAIL = process.argv[2] ?? "dono@guardou.app";
const SENHA = process.argv[3] ?? "Guardou@2026";

async function lerSupabaseUrl() {
  try {
    const conteudo = await readFile("./.env.local", "utf8");
    const linha = conteudo
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));
    return linha ? linha.split("=")[1].trim() : null;
  } catch {
    return null;
  }
}

async function main() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error(
      "Defina SUPABASE_SERVICE_ROLE_KEY (Project Settings > API > service_role) antes de rodar."
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (await lerSupabaseUrl());
  if (!url) {
    console.error("Não achei NEXT_PUBLIC_SUPABASE_URL (nem no .env.local).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: SENHA,
    email_confirm: true,
  });

  if (error) {
    console.error("Falha ao criar usuário:", error.message);
    process.exit(1);
  }

  console.log(`Usuário admin criado: ${data.user.email} (id: ${data.user.id})`);
  console.log(`Faça login em /login com email "${EMAIL}" e a senha escolhida.`);
}

main();
