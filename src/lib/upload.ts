import type { SupabaseClient } from "@supabase/supabase-js";

export async function enviarFotoPrato(
  supabase: SupabaseClient,
  arquivo: File
): Promise<string> {
  const extensao = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage.from("pratos").upload(caminho, arquivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Falha ao enviar foto: ${error.message}`);
  }

  const { data } = supabase.storage.from("pratos").getPublicUrl(caminho);
  return data.publicUrl;
}

// Reaproveita o bucket "pratos" (já público, sem auth) numa subpasta
// separada — evita precisar criar e configurar um bucket novo só pra logo.
export async function enviarLogoLanchonete(
  supabase: SupabaseClient,
  arquivo: File
): Promise<string> {
  const extensao = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `logos/${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage.from("pratos").upload(caminho, arquivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Falha ao enviar logo: ${error.message}`);
  }

  const { data } = supabase.storage.from("pratos").getPublicUrl(caminho);
  return data.publicUrl;
}
