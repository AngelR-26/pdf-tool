"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { usePdfWorkspace } from "@/lib/pdf-workspace";
import { mergePdfFiles } from "@/lib/pdf/merge";
import { formatFileSize } from "@/lib/pdf/utils";

export default function UnirPage() {
  const { files, setFiles, removeFile } = usePdfWorkspace();

  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mueve un archivo hacia arriba o hacia abajo
   * dentro de la lista de documentos.
   */
  function moveFile(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= files.length) {
      return;
    }

    const reorderedFiles = [...files];

    const [movedFile] = reorderedFiles.splice(index, 1);

    reorderedFiles.splice(targetIndex, 0, movedFile);

    setFiles(reorderedFiles);
  }

  /**
   * Une los archivos seleccionados y descarga
   * el documento PDF resultante.
   */
  async function handleMerge() {
    if (files.length === 0) {
      setError("Debes seleccionar al menos un archivo PDF.");
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedPdfBytes = await mergePdfFiles(files);

      const blob = new Blob([mergedPdfBytes], {
        type: "application/pdf",
      });

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "pdf-unido.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (mergeError) {
      const message =
        mergeError instanceof Error
          ? mergeError.message
          : "Ocurrió un error al unir los archivos PDF.";

      setError(message);
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <ToolPageShell
      title="Unir PDF"
      description="Combina los archivos cargados en un solo documento, en el orden en que aparecen."
    >
      <section className="mt-8 space-y-6">
        {files.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No hay archivos disponibles para unir. Regresa al inicio y
            selecciona tus documentos PDF.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-ink">
                  Orden de los documentos
                </h2>

                <span className="text-xs text-ink-soft">
                  {files.length}{" "}
                  {files.length === 1 ? "archivo" : "archivos"}
                </span>
              </div>

              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 py-4"
                  >
                    <span className="w-6 shrink-0 text-sm text-ink-soft">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-ink-soft">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFile(index, "up")}
                        disabled={index === 0 || isMerging}
                        aria-label={`Mover ${file.name} hacia arriba`}
                        className="rounded-md border border-line px-2 py-1 text-sm text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFile(index, "down")}
                        disabled={
                          index === files.length - 1 || isMerging
                        }
                        aria-label={`Mover ${file.name} hacia abajo`}
                        className="rounded-md border border-line px-2 py-1 text-sm text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isMerging}
                        aria-label={`Eliminar ${file.name}`}
                        className="rounded-md border border-line px-2 py-1 text-sm text-ink-soft transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleMerge}
              disabled={isMerging || files.length === 0}
              className="w-full rounded-md bg-stamp px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMerging ? "Uniendo PDF..." : "Unir PDF"}
            </button>
          </>
        )}
      </section>
    </ToolPageShell>
  );
}