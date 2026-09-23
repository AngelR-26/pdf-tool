"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type PdfTool = "unir" | "separar" | "organizar";

export interface PdfWorkspaceValue {
  /** Files currently loaded into the workspace, in drop/selection order. */
  files: File[];
  /** Replace the file selection wholesale. */
  setFiles: (files: File[]) => void;
  /** Append files to the existing selection. */
  addFiles: (files: File[]) => void;
  /** Drop a single file by index. */
  removeFile: (index: number) => void;
  /** Empty the workspace. */
  clearFiles: () => void;
}

const PdfWorkspaceContext = createContext<PdfWorkspaceValue | null>(null);

export function PdfWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);

  const value = useMemo<PdfWorkspaceValue>(
    () => ({
      files,
      setFiles,
      addFiles: (incoming) => setFiles((prev) => [...prev, ...incoming]),
      removeFile: (index) => setFiles((prev) => prev.filter((_, i) => i !== index)),
      clearFiles: () => setFiles([]),
    }),
    [files]
  );

  return <PdfWorkspaceContext.Provider value={value}>{children}</PdfWorkspaceContext.Provider>;
}

export function usePdfWorkspace(): PdfWorkspaceValue {
  const ctx = useContext(PdfWorkspaceContext);
  if (!ctx) {
    throw new Error("usePdfWorkspace debe usarse dentro de <PdfWorkspaceProvider>");
  }
  return ctx;
}

export const PDF_TOOLS: Record<PdfTool, { label: string; description: string; multiple: boolean }> = {
  unir: {
    label: "Unir",
    description: "Combina varios PDF en un solo archivo, en el orden que elijas.",
    multiple: true,
  },
  separar: {
    label: "Separar",
    description: "Extrae páginas sueltas o divide un PDF en varios archivos.",
    multiple: false,
  },
  organizar: {
    label: "Organizar",
    description: "Reordena, rota o elimina páginas dentro de un mismo PDF.",
    multiple: false,
  },
};
