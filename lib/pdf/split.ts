
import { PDFDocument } from "pdf-lib";

export interface SplitPdfResult {
  filename: string;
  bytes: Uint8Array;
}

/**
 * Obtiene la cantidad de páginas de un archivo PDF.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  return pdf.getPageCount();
}

/**
 * Extrae páginas específicas.
 *
 * Los números recibidos comienzan en 1, tal como los ve el usuario.
 * Ejemplo: [1, 3, 5] extrae las páginas 1, 3 y 5.
 */
export async function extractPdfPages(
  file: File,
  pageNumbers: number[],
): Promise<Uint8Array> {
  if (pageNumbers.length === 0) {
    throw new Error("Selecciona al menos una página.");
  }

  const source = await PDFDocument.load(await file.arrayBuffer());
  const totalPages = source.getPageCount();

  for (const pageNumber of pageNumbers) {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > totalPages
    ) {
      throw new Error(
        `La página ${pageNumber} no es válida. El PDF tiene ${totalPages} páginas.`,
      );
    }
  }

  if (new Set(pageNumbers).size !== pageNumbers.length) {
    throw new Error("No puedes seleccionar una misma página más de una vez.");
  }

  const result = await PDFDocument.create();

  // pdf-lib utiliza índices que comienzan en cero.
  const pages = await result.copyPages(
    source,
    pageNumbers.map((pageNumber) => pageNumber - 1),
  );

  for (const page of pages) {
    result.addPage(page);
  }

  return result.save();
}

/**
 * Divide un PDF en archivos con una cantidad máxima de páginas.
 *
 * Ejemplo:
 * 10 páginas divididas en bloques de 3 generan 4 archivos:
 * 3, 3, 3 y 1 página.
 */
export async function splitPdfByPageCount(
  file: File,
  pagesPerFile: number,
): Promise<SplitPdfResult[]> {
  if (!Number.isInteger(pagesPerFile) || pagesPerFile < 1) {
    throw new Error("La cantidad de páginas por archivo debe ser mayor que cero.");
  }

  const source = await PDFDocument.load(await file.arrayBuffer());
  const totalPages = source.getPageCount();
  const results: SplitPdfResult[] = [];
  const baseName = file.name.replace(/\.pdf$/i, "") || "documento";

  for (let start = 0; start < totalPages; start += pagesPerFile) {
    const end = Math.min(start + pagesPerFile, totalPages);
    const pageIndices = Array.from(
      { length: end - start },
      (_, index) => start + index,
    );

    const part = await PDFDocument.create();
    const pages = await part.copyPages(source, pageIndices);

    for (const page of pages) {
      part.addPage(page);
    }

    results.push({
      filename: `${baseName}-parte-${results.length + 1}.pdf`,
      bytes: await part.save(),
    });
  }

  return results;
}

/**
 * Interpreta expresiones como:
 * "1-3, 7, 10-12"
 *
 * Devuelve números de página comenzando en 1.
 */
export function parsePageSelection(
  input: string,
  totalPages: number,
): number[] {
  const value = input.trim();

  if (!value) {
    throw new Error("Escribe las páginas que quieres extraer.");
  }

  const tokens = value.split(",");
  const pages: number[] = [];

  for (const rawToken of tokens) {
    const token = rawToken.trim();

    if (!token) {
      throw new Error("Hay una selección vacía. Revisa las comas.");
    }

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const singleMatch = token.match(/^\d+$/);

    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);

      if (start > end) {
        throw new Error(
          `El rango "${token}" es incorrecto: el inicio debe ser menor o igual que el final.`,
        );
      }

      if (start < 1 || end > totalPages) {
        throw new Error(
          `El rango "${token}" está fuera de los límites. El PDF tiene ${totalPages} páginas.`,
        );
      }

      for (let page = start; page <= end; page++) {
        pages.push(page);
      }
    } else if (singleMatch) {
      const page = Number(token);

      if (page < 1 || page > totalPages) {
        throw new Error(
          `La página ${page} no existe. El PDF tiene ${totalPages} páginas.`,
        );
      }

      pages.push(page);
    } else {
      throw new Error(
        `La selección "${token}" no es válida. Usa números y rangos como 1-3, 7.`,
      );
    }
  }

  if (new Set(pages).size !== pages.length) {
    throw new Error(
      "Hay páginas repetidas en la selección. Cada página debe aparecer una sola vez.",
    );
  }

  return pages;
}
