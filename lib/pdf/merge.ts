
import { PDFDocument } from "pdf-lib";

/**
 * Une varios archivos PDF en un único documento.
 *
 * Las páginas se copian en el mismo orden en que
 * aparecen los archivos recibidos.
 *
 * @param files Archivos PDF que se van a unir.
 * @returns Los bytes del PDF generado.
 */
export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("Debes seleccionar al menos un archivo PDF.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    let sourcePdf: PDFDocument;

    try {
      const fileBytes = await file.arrayBuffer();

      sourcePdf = await PDFDocument.load(fileBytes);
    } catch {
      throw new Error(
        `No se pudo leer el archivo "${file.name}". Verifica que sea un PDF válido.`
      );
    }

    const pages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );

    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new Error("Los archivos seleccionados no contienen páginas.");
  }

  return mergedPdf.save();
}