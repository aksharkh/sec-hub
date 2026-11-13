"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloudUpload } from "lucide-react";
import { useRef, useState } from "react";
import { FileIcon } from "@/components/ui/misc";
import type { FileKind } from "@/lib/types";
import { cn, fileSize } from "@/lib/utils";

export type UploadFile = { name: string; kind: FileKind; sizeKb: number };

const kindOf = (name: string): FileKind => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "txt", "md"].includes(ext)) return "docx";
  if (["xls", "xlsx"].includes(ext)) return "xlsx";
  if (ext === "csv") return "csv";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "png";
  return "zip";
};

/** Accepts real files from the computer but only keeps their names: uploads are simulated. */
export function Dropzone({ onDone, compact, label = "Drop evidence here or browse", sub = "PDF, Word, Excel, CSV or screenshots · up to 50 MB" }: { onDone: (files: UploadFile[]) => void; compact?: boolean; label?: string; sub?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [queue, setQueue] = useState<(UploadFile & { p: number; key: string })[]>([]);

  const start = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).map((f, i) => ({ name: f.name, kind: kindOf(f.name), sizeKb: Math.max(12, f.size / 1024), p: 0, key: `${Date.now()}-${i}` }));
    setQueue((q) => [...q, ...files]);
    const started = Date.now();
    const tick = setInterval(() => {
      const t = (Date.now() - started) / 1400;
      setQueue((q) => q.map((f) => (files.some((x) => x.key === f.key) ? { ...f, p: Math.min(1, t * (0.8 + (f.sizeKb % 7) / 20)) } : f)));
      if (t >= 1.25) {
        clearInterval(tick);
        onDone(files.map(({ name, kind, sizeKb }) => ({ name, kind, sizeKb })));
        setQueue((q) => q.filter((f) => !files.some((x) => x.key === f.key)));
      }
    }, 60);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          start(e.dataTransfer.files);
        }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border border-dashed text-left transition-[background-color,border-color] duration-200",
          compact ? "px-3 py-2.5" : "flex-col justify-center px-4 py-6 text-center",
          over ? "border-brand bg-brand-soft" : "border-line-strong bg-raised hover:border-brand/50 hover:bg-brand-soft/40",
        )}
      >
        <span className={cn("grid shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted shadow-xs transition-colors group-hover:text-brand", compact ? "size-8" : "size-10")}>
          <CloudUpload className="size-4" />
        </span>
        <span>
          <span className="block text-[13px] font-medium text-ink">
            {label.split(" or ")[0]} {label.includes(" or ") && <>or <span className="text-brand underline decoration-brand/30 underline-offset-2">{label.split(" or ")[1]}</span></>}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">{sub}</span>
        </span>
      </button>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => { start(e.target.files); e.target.value = ""; }} />
      <AnimatePresence initial={false}>
        {queue.map((f) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <FileIcon kind={f.kind} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                  <span className="truncate font-medium text-ink">{f.name}</span>
                  <span className="tnum shrink-0 text-faint">{f.p >= 1 ? "Scanning" : `${Math.round(f.p * 100)}%`} · {fileSize(f.sizeKb)}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-subtle-2">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-100" style={{ width: `${f.p * 100}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
