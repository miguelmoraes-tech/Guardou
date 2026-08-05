"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCodeCard() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-900/5">
      <h2 className="text-lg font-bold text-stone-800">QR code do cardápio</h2>
      <p className="text-sm text-stone-500">
        Imprima e cole no balcão pra clientes reservarem pelo celular.
      </p>
      <div className="rounded-xl border border-stone-200 p-3">
        <QRCodeSVG value={url} size={176} fgColor="#b53d0e" />
      </div>
      <p className="break-all text-xs text-stone-400">{url}</p>
    </div>
  );
}
