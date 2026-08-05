"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QrCodePage() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-8 text-center print:min-h-0 print:gap-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl">🍲</span>
        <h1 className="text-2xl font-extrabold text-stone-800">Guardou</h1>
        <p className="text-stone-500">Escaneie e reserve o prato do dia</p>
      </div>

      <div className="rounded-2xl border-4 border-brand-600 p-6">
        <QRCodeSVG value={url} size={280} fgColor="#b53d0e" />
      </div>

      <p className="max-w-xs text-sm text-stone-400">{url}</p>

      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-brand-600 px-6 py-3 font-bold text-white transition-colors duration-150 hover:bg-brand-700 print:hidden"
      >
        Imprimir cartaz
      </button>
    </div>
  );
}
