"use client";

import Link from "next/link";
import { usePdfWorkspace } from "@/lib/pdf-workspace";
import { formatFileSize } from "@/lib/pdf/utils";

export function ToolPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const { files } = usePdfWorkspace();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:px-10 sm:py-16">
      <Link
        href="/"
        className="mb-10 w-fit text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-stamp"
      >
        ← Volver al inicio
      </Link>

      <h1 className="font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-base text-ink-soft">{description}</p>

      <section className="mt-10 border-t border-line pt-6">
        {files.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No hay ningún PDF cargado todavía.{" "}
            <Link href="/" className="text-stamp underline decoration-line underline-offset-4">
              Vuelve al inicio
            </Link>{" "}
            para soltar uno.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-4 py-3">
                <p className="truncate text-sm text-ink">{file.name}</p>
                <p className="shrink-0 text-xs text-ink-soft">{formatFileSize(file.size)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {children ?? (
        <p className="mt-10 text-sm text-ink-soft">Esta herramienta está en construcción.</p>
      )}
    </main>
  );
}
