
"use client";

import { useEffect, useState, type ChangeEvent } from "react";import JSZip from "jszip";
import { ToolPageShell } from "@/components/tool-page-shell";
import { usePdfWorkspace } from "@/lib/pdf-workspace";
import {
  extractPdfPages,
  getPdfPageCount,
  parsePageSelection,
  splitPdfByPageCount,
} from "@/lib/pdf/split";

type SplitMode = "extract" | "divide";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Crea un ArrayBuffer independiente, compatible con Blob y JSZip.
  return new Uint8Array(bytes).buffer as ArrayBuffer;
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Evita revocar la URL antes de que el navegador inicie la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SepararPage() {
  const { files, setFiles } = usePdfWorkspace();

  const file = files[0] ?? null;

  const [mode, setMode] = useState<SplitMode>("extract");
  const [pageSelection, setPageSelection] = useState("1-3");
  const [pagesPerFile, setPagesPerFile] = useState("5");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    setPageCount(null);
    setError("");
    setMessage("");

    if (!file) {
      setLoadingPages(false);
      return;
    }

    async function loadPageCount() {
      setLoadingPages(true);

      try {
        const count = await getPdfPageCount(file!);

        if (!cancelled) {
          setPageCount(count);
        }
      } catch {
        if (!cancelled) {
          setError(
            "No se pudo leer el PDF. Comprueba que el archivo sea válido y que no esté protegido.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
        }
      }
    }

    void loadPageCount();

    return () => {
      cancelled = true;
    };
  }, [file]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0];

    // Permite volver a seleccionar el mismo archivo.
    event.target.value = "";

    if (!selectedFile) return;

    if (
      !selectedFile.name.toLowerCase().endsWith(".pdf") &&
      selectedFile.type !== "application/pdf"
    ) {
      setError("Selecciona un archivo PDF válido.");
      return;
    }

    setFiles([selectedFile]);
  }

  async function handleProcess() {
    if (!file) {
      setError("Primero selecciona un archivo PDF.");
      return;
    }

    if (pageCount === null) {
      setError("Espera a que termine la lectura del PDF.");
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      if (mode === "extract") {
        const selectedPages = parsePageSelection(
          pageSelection,
          pageCount,
        );

        const bytes = await extractPdfPages(file, selectedPages);
        const filename = `${file.name.replace(/\.pdf$/i, "")}-extraido.pdf`;

        const blob = new Blob([toArrayBuffer(bytes)], {
          type: "application/pdf",
        });

        downloadFile(blob, filename);
        setMessage(
          `PDF generado correctamente con ${selectedPages.length} página(s).`,
        );
      } else {
        const amount = Number(pagesPerFile);

        if (
          !Number.isInteger(amount) ||
          amount < 1 ||
          amount > pageCount
        ) {
          throw new Error(
            `Indica una cantidad entre 1 y ${pageCount} páginas por archivo.`,
          );
        }

        const results = await splitPdfByPageCount(file, amount);

        if (results.length === 1) {
          const result = results[0];
          const blob = new Blob([toArrayBuffer(result.bytes)], {
            type: "application/pdf",
          });

          downloadFile(blob, result.filename);
        } else {
          const zip = new JSZip();

          for (const result of results) {
            zip.file(result.filename, toArrayBuffer(result.bytes));
          }

          const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "STORE",
          });

          const zipFilename = `${file.name.replace(/\.pdf$/i, "")}-dividido.zip`;

          downloadFile(zipBlob, zipFilename);
        }

        setMessage(
          `Se generaron ${results.length} archivo(s) PDF correctamente.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar el PDF.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolPageShell
      title="Separar PDF"
      description="Extrae páginas específicas o divide un PDF en varios archivos."
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="text-lg font-semibold text-ink">
            1. Documento de origen
          </h2>

          <div className="mt-4 space-y-3">
            {file ? (
              <div className="flex flex-col gap-3 rounded-lg border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all font-medium text-ink">
                    {file.name}
                  </p>

                  <p className="mt-1 text-sm text-ink-soft">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                    {" · "}
                    {loadingPages
                      ? "Leyendo páginas..."
                      : pageCount !== null
                        ? `${pageCount} página(s)`
                        : "No se pudo leer el documento"}
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-stamp">
                  Cambiar PDF
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line p-8 text-center hover:bg-stamp">
                <span className="font-medium text-ink">
                  Selecciona un archivo PDF
                </span>
                <span className="mt-1 text-sm text-ink-soft">
                  Haz clic aquí para buscarlo en tu equipo.
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="text-lg font-semibold text-ink">
            2. ¿Cómo quieres separar el PDF?
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setMode("extract");
                setError("");
                setMessage("");
              }}
              aria-pressed={mode === "extract"}
              className={`rounded-lg border p-4 text-left transition ${
                mode === "extract"
                  ? "border-ink bg-stamp"
                  : "border-line hover:bg-stamp"
              }`}
            >
              <span className="block font-semibold text-ink">
                Extraer páginas
              </span>
              <span className="mt-1 block text-sm text-ink-soft">
                Elegir páginas concretas para crear un PDF.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("divide");
                setError("");
                setMessage("");
              }}
              aria-pressed={mode === "divide"}
              className={`rounded-lg border p-4 text-left transition ${
                mode === "divide"
                  ? "border-ink bg-stamp"
                  : "border-line hover:bg-stamp"
              }`}
            >
              <span className="block font-semibold text-ink">
                Dividir por cantidad
              </span>
              <span className="mt-1 block text-sm text-ink-soft">
                Crear varios PDF con el mismo número de páginas por bloque.
              </span>
            </button>
          </div>

          {mode === "extract" ? (
            <div className="mt-5 space-y-3">
              <label
                htmlFor="page-selection"
                className="block text-sm font-medium text-ink"
              >
                Páginas que quieres extraer
              </label>

              <input
                id="page-selection"
                type="text"
                value={pageSelection}
                onChange={(event) => setPageSelection(event.target.value)}
                placeholder="Ejemplo: 1-3, 7, 10-12"
                className="w-full rounded-lg border border-line bg-paper px-3 py-3 text-ink outline-none focus:ring-2 focus:ring-ink"
              />

              <p className="text-sm text-ink-soft">
                Separa las páginas con comas y utiliza guiones para los
                rangos. Por ejemplo: 1-3, 7, 10-12.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <label
                htmlFor="pages-per-file"
                className="block text-sm font-medium text-ink"
              >
                Páginas por archivo
              </label>

              <input
                id="pages-per-file"
                type="number"
                min={1}
                max={pageCount ?? undefined}
                step={1}
                value={pagesPerFile}
                onChange={(event) => setPagesPerFile(event.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-3 text-ink outline-none focus:ring-2 focus:ring-ink"
              />

              <p className="text-sm text-ink-soft">
                {pageCount !== null &&
                Number.isInteger(Number(pagesPerFile)) &&
                Number(pagesPerFile) > 0
                  ? `Se generarán ${Math.ceil(
                      pageCount / Number(pagesPerFile),
                    )} archivo(s) PDF.`
                  : "Indica cuántas páginas tendrá cada archivo."}
                {" "}El último archivo puede contener menos páginas.
              </p>

              <p className="text-sm text-ink-soft">
                Si se generan varios PDF, se descargarán juntos en un archivo
                ZIP.
              </p>
            </div>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-lg border border-line bg-stamp p-4 text-sm text-ink"
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleProcess}
          disabled={
            !file ||
            loadingPages ||
            pageCount === null ||
            processing
          }
          className="w-full rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing
            ? "Procesando PDF..."
            : mode === "extract"
              ? "Extraer páginas y descargar"
              : "Dividir PDF y descargar"}
        </button>

        <p className="text-sm text-ink-soft">
          El procesamiento se realiza en tu navegador. Los archivos no se
          envían a un servidor mediante esta funcionalidad.
        </p>
      </div>
    </ToolPageShell>
  );
}
