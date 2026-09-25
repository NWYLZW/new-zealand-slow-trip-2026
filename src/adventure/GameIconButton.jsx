import { useState } from "react";

export function GameIconButton({ label, caption = label, children, className = "", onClick, ...props }) {
  const [pulse, setPulse] = useState(0);
  return <button type="button" className={`trip-tool ${className}`.trim()} aria-label={label}
    onClick={(event) => { setPulse((value) => value + 1); onClick?.(event); }} {...props}>
    <span key={pulse} className={`trip-tool-symbol${pulse ? " trip-tool-symbol--pulse" : ""}`} aria-hidden="true">{children}</span>
    <span className="trip-tool-label" aria-hidden="true">{caption}</span>
  </button>;
}
