/** Human readable file size, e.g. 245 KB, 1.8 MB. */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const decimals = exponent === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
}

/** True if the given File looks like a PDF, by MIME type or extension. */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** Filters a FileList/array down to valid PDF files only. */
export function filterPdfFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter(isPdfFile);
}
