import { useEffect, useLayoutEffect, useRef } from "react";
import { drawablyButton } from "drawably";

// Drawably intentionally changes its random seed on pointer entry/press.
// Reapply our seed through its public API in the same event, before painting.
export function StableSketchButton({
  seed = 23, roughness = 0.8, boil = 0.08, variant = "outline",
  state = "idle", className, children, ...props
}) {
  const element = useRef(null), sketch = useRef(null);
  useLayoutEffect(() => {
    const button = element.current;
    const handle = drawablyButton(button, { seed, roughness, boil, variant });
    sketch.current = handle;
    const keepSeed = () => handle.resketch(seed);
    button.addEventListener("pointerenter", keepSeed);
    button.addEventListener("pointerdown", keepSeed);
    return () => {
      button.removeEventListener("pointerenter", keepSeed);
      button.removeEventListener("pointerdown", keepSeed);
      handle.destroy();
      button.classList.remove("drawably-button", `drawably-button--${variant}`);
      sketch.current = null;
    };
  }, [seed, roughness, boil, variant, className]);
  useEffect(() => { sketch.current?.setState(state); }, [state, seed, roughness, boil, variant, className]);
  return <button type="button" {...props} className={className} ref={element}>{children}</button>;
}
