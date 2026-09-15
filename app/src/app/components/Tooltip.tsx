"use client";

import { useEffect, useRef, useState } from "react";

/** Litet "?"-märke som visar en förklaringsruta vid klick/tap (inte hover —
 * fungerar likadant på mobil och desktop). Stänger vid klick utanför. */
export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <span className="tooltip-wrap" ref={ref}>
      <button
        type="button"
        className="tooltip-trigger"
        aria-label="Mer information"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      {open && <span className="tooltip-box">{text}</span>}
    </span>
  );
}
