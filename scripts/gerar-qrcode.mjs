// Gera public/qrcode-cardapio.png apontando pra home do site.
// Uso: node scripts/gerar-qrcode.mjs [url]
// Se nenhuma url for passada, usa NEXT_PUBLIC_SITE_URL do .env.local (ou localhost como fallback).

import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

function lerEnvLocal() {
  return readFile(path.resolve("./.env.local"), "utf8")
    .then((conteudo) => {
      const linha = conteudo
        .split("\n")
        .find((l) => l.startsWith("NEXT_PUBLIC_SITE_URL="));
      return linha ? linha.split("=")[1].trim() : null;
    })
    .catch(() => null);
}

async function main() {
  const urlArg = process.argv[2];
  const url = urlArg ?? (await lerEnvLocal()) ?? "http://localhost:3000";

  const destino = path.resolve("./public/qrcode-cardapio.png");
  await QRCode.toFile(destino, url, {
    type: "png",
    width: 1024,
    margin: 2,
    color: {
      dark: "#c2410c",
      light: "#ffffff",
    },
  });

  console.log(`QR code gerado em ${destino}`);
  console.log(`Apontando para: ${url}`);
}

main().catch((erro) => {
  console.error("Falha ao gerar QR code:", erro);
  process.exit(1);
});
