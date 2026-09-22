"use client";

import { useId, useRef, useState } from "react";
import { filterPdfFiles } from "@/lib/pdf/utils";

interface DropZoneProps {
  /** Called with any valid PDF files the user dropped or picked. */
  onFiles: (files: File[]) => void;
  /** Allow selecting/dropping more than one file at once. */
  multiple?: boolean;
  /** Headline shown inside the zone. */
  label: string;
  /** Supporting line shown under the headline. */
  hint: string;
}

export function DropZone({ onFiles, multiple = false, label, hint }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const pdfs = filterPdfFiles(event.dataTransfer.files);
    if (pdfs.length > 0) {
      onFiles(multiple ? pdfs : [pdfs[0]]);
    }
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const pdfs = filterPdfFiles(event.target.files ?? []);
    if (pdfs.length > 0) onFiles(pdfs);
    event.target.value = "";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-labelledby={`${inputId}-label`}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "group relative flex cursor-pointer flex-col items-center justify-center gap-3",
        "rounded-sm border-2 border-dashed px-6 py-14 text-center transition-all duration-150 ease-out sm:py-16",
        isDragging
          ? "-rotate-[0.4deg] scale-[1.01] border-stamp bg-paper-raised shadow-[0_10px_30px_-15px_rgba(35,32,27,0.4)]"
          : "border-line bg-paper-raised/60 hover:border-ink-soft hover:bg-paper-raised",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
      />

      <PdfGlyph active={isDragging} />

      <p id={`${inputId}-label`} className="font-serif text-xl text-ink sm:text-2xl">
        {isDragging ? "Suéltalo aquí" : label}
      </p>
      <p className="max-w-xs text-sm text-ink-soft">{hint}</p>
    </div>
  );
}

function PdfGlyph({ active }: { active: boolean }) {
  return (
    <svg
      width="44"
      height="52"
      viewBox="0 0 44 52"
      fill="none"
      aria-hidden="true"
      className={[
        "transition-transform duration-150 ease-out",
        active ? "-translate-y-1 rotate-3" : "group-hover:-translate-y-0.5",
      ].join(" ")}
    >
      <path
        d="M4 2h24l12 12v34a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        stroke={active ? "var(--color-stamp)" : "var(--color-ink)"}
        strokeWidth="1.6"
        fill="var(--color-paper)"
      />
      <path
        d="M28 2v10a2 2 0 0 0 2 2h10"
        stroke={active ? "var(--color-stamp)" : "var(--color-ink)"}
        strokeWidth="1.6"
      />
      <line x1="10" y1="30" x2="30" y2="30" stroke={active ? "var(--color-stamp)" : "var(--color-line)"} strokeWidth="1.4" />
      <line x1="10" y1="36" x2="30" y2="36" stroke={active ? "var(--color-stamp)" : "var(--color-line)"} strokeWidth="1.4" />
      <line x1="10" y1="42" x2="22" y2="42" stroke={active ? "var(--color-stamp)" : "var(--color-line)"} strokeWidth="1.4" />
    </svg>
  );
}
