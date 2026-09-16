import React, { useRef, useState } from "react";
import { Camera, ImagePlus, X, Loader2, ShieldCheck } from "lucide-react";
import { readAttachmentObject } from "@/lib/attachments";

export default function AttachmentInput({ attachments, onAdd, onRemove }) {
  const camRef = useRef(null);
  const libRef = useRef(null);
  const [reading, setReading] = useState(false);

  async function handleFiles(files) {
    if (!files || !files.length) return;
    setReading(true);
    try {
      for (const file of Array.from(files)) {
        const obj = await readAttachmentObject(file);
        onAdd?.(obj);
      }
    } finally {
      setReading(false);
      if (camRef.current) camRef.current.value = "";
      if (libRef.current) libRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          Attachments are stored <span className="font-semibold">only on this device</span> for your
          privacy. They are never uploaded, and the AI never sees them.
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((a, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove?.(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => camRef.current?.click()}
          disabled={reading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Take photo
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>
        <button
          type="button"
          onClick={() => libRef.current?.click()}
          disabled={reading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          From library
          <input
            ref={libRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>
      </div>
    </div>
  );
}