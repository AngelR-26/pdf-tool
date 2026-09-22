"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropZone } from "@/components/drop-zone";
import { PDF_TOOLS, type PdfTool, usePdfWorkspace } from "@/lib/pdf-workspace";
import { formatFileSize } from "@/lib/pdf/utils";

const TOOL_ORDER: PdfTool[] = ["unir", "separar", "organizar"];

export default function Home() {
  const router = useRouter();
  const { files, setFiles, addFiles, removeFile } = usePdfWorkspace();
  const [tool, setTool] = useState<PdfTool | null>(null);

  const allowsMultiple = tool ? PDF_TOOLS[tool].multiple : true;
  const canContinue = tool !== null && files.length > 0;

  function handleSelectTool(next: PdfTool) {
    setTool(next);
    if (!PDF_TOOLS[next].multiple && files.length > 1) {
      setFiles(files.slice(0, 1));
    }
  }

  function handleFiles(incoming: File[]) {
    if (allowsMultiple) {
      addFiles(incoming);
    } else {
      setFiles([incoming[0]]);
    }
  }

  function handleContinue() {
    if (!tool || files.length === 0) return;
    router.push(`/${tool}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:px-10 sm:py-16">
      <header className="mb-14 flex items-center gap-3">
        <InkStamp />
        <span className="font-serif text-lg text-ink">PDF Tool</span>
      </header>

      <section className="mb-12">
        <h1 className="font-serif text-4xl leading-[1.08] text-ink sm:text-5xl">
          Tus PDF, en orden.
        </h1>
        <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
          Une, separa o reorganiza documentos sin subir nada a ningún servidor.
          Todo ocurre aquí mismo, en tu navegador.
        </p>
      </section>

      <section className="mb-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TOOL_ORDER.map((key) => (
            <ToolCard
              key={key}
              toolKey={key}
              selected={tool === key}
              onSelect={() => handleSelectTool(key)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <DropZone
          onFiles={handleFiles}
          multiple={allowsMultiple}
          label={
            tool
              ? `Suelta tu PDF para ${PDF_TOOLS[tool].label.toLowerCase()}`
              : "Suelta un PDF aquí o haz clic para elegirlo"
          }
          hint={
            allowsMultiple
              ? "Puedes soltar varios archivos a la vez."
              : "Esta herramienta trabaja con un archivo a la vez."
          }
        />
      </section>

      {files.length > 0 && (
        <section className="mb-10">
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{file.name}</p>
                  <p className="text-xs text-ink-soft">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Quitar ${file.name}`}
                  className="shrink-0 text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-stamp"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-auto flex items-center gap-4 pt-4">
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={[
            "rounded-sm px-6 py-3 text-sm font-medium transition-colors duration-150",
            canContinue
              ? "bg-stamp text-paper-raised hover:bg-stamp-dark"
              : "cursor-not-allowed bg-line text-ink-soft",
          ].join(" ")}
        >
          Continuar
        </button>
        {!tool && (
          <p className="text-sm text-ink-soft">Elige una herramienta para empezar.</p>
        )}
        {tool && files.length === 0 && (
          <p className="text-sm text-ink-soft">Ahora suelta un PDF arriba.</p>
        )}
      </section>
    </main>
  );
}

function ToolCard({
  toolKey,
  selected,
  onSelect,
}: {
  toolKey: PdfTool;
  selected: boolean;
  onSelect: () => void;
}) {
  const tool = PDF_TOOLS[toolKey];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group relative w-full pt-6 text-left"
    >
      <span
        className={[
          "absolute left-5 top-0 z-10 px-3 py-1.5 font-serif text-sm transition-colors duration-150",
          "[clip-path:polygon(10%_0,90%_0,100%_100%,0_100%)]",
          selected ? "bg-pine text-paper-raised" : "bg-line text-ink-soft group-hover:bg-ink-soft group-hover:text-paper-raised",
        ].join(" ")}
      >
        {tool.label}
      </span>
      <div
        className={[
          "flex h-full flex-col gap-2 border px-5 pb-5 pt-8 transition-colors duration-150",
          selected ? "border-pine bg-paper-raised" : "border-line bg-paper-raised/60 group-hover:border-ink-soft",
        ].join(" ")}
      >
        <ToolIcon toolKey={toolKey} selected={selected} />
        <p className="text-sm text-ink-soft">{tool.description}</p>
      </div>
    </button>
  );
}

function ToolIcon({ toolKey, selected }: { toolKey: PdfTool; selected: boolean }) {
  const stroke = selected ? "var(--color-pine)" : "var(--color-ink)";
  const common = { stroke, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (toolKey === "unir") {
    return (
      <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
        <rect x="1" y="1" width="14" height="18" rx="1.5" {...common} />
        <rect x="9" y="5" width="14" height="18" rx="1.5" {...common} fill="var(--color-paper-raised)" />
      </svg>
    );
  }
  if (toolKey === "separar") {
    return (
      <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
        <rect x="2" y="1" width="10" height="14" rx="1.2" {...common} />
        <rect x="16" y="9" width="10" height="14" rx="1.2" {...common} />
      </svg>
    );
  }
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
      <rect x="2" y="1" width="8" height="10" rx="1" {...common} />
      <rect x="12" y="13" width="8" height="10" rx="1" {...common} />
      <path d="M20 5h6M23 2v6" {...common} />
    </svg>
  );
}

function InkStamp() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11.5" stroke="var(--color-stamp)" strokeWidth="1.4" fill="none" />
      <path
        d="M8 13.5 11.5 17 18 9"
        stroke="var(--color-stamp)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
