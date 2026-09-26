import { cloneElement, useState } from "react";

export function GameIconButton({ label, children, className = "", onClick, ...props }) {
  const [pulse, setPulse] = useState(0);
  return <button type="button" className={`trip-tool ${className}`.trim()} aria-label={label}
    onClick={(event) => { setPulse((value) => value + 1); onClick?.(event); }} {...props}>
    <span key={pulse} className={`trip-tool-symbol${pulse ? " trip-tool-symbol--pulse" : ""}`} aria-hidden="true">
      {cloneElement(children, { active: props["aria-pressed"] === true })}
    </span>
  </button>;
}
