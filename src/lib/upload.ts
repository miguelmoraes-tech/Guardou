import { supabase } from "@/lib/supabase";

export async function enviarFotoPrato(arquivo: File): Promise<string> {
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
