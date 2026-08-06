"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type QrCodeCardProps = {
  slug: string;
  nome: string;
};

export function QrCodeCard({ slug, nome }: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const url = `${baseUrl}/l/${slug}`;

  function baixarPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qrcode-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-900/5">
      <h2 className="text-lg font-bold text-stone-800">Meu QR Code</h2>
      <p className="text-sm text-stone-500">
        Imprima e cole no balcão pra clientes reservarem pelo celular.
      </p>
      <div className="rounded-xl border border-stone-200 p-3">
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={176}
          fgColor="#b53d0e"
          title={`QR code de ${nome}`}
        />
      </div>
      <p className="break-all text-xs text-stone-400">{url}</p>
      <button
        type="button"
        onClick={baixarPng}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700"
      >
        Baixar QR code (PNG)
      </button>
    </div>
  );
}
