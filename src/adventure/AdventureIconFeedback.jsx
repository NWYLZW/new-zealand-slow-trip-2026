import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureIconFeedback.css";

const controls = "button, a, summary, [role=button], [role=tab]";
const tooltipId = "trip-icon-tooltip";

function iconControl(target) {
  const control = target instanceof Element ? target.closest(controls) : null;
  return control?.closest("#trip-board-structure") && control.querySelector(".trip-pencil-icon") ? control : null;
}

function clipped(style) {
  const clip = style.clip.replaceAll(" ", "");
  return (clip !== "auto" && clip !== "rect(auto,auto,auto,auto)")
    || /inset\((?:50|100)%/.test(style.clipPath.replaceAll(" ", ""));
}

function visiblyRendered(element, control, withinControl = true) {
  for (let node = element; node instanceof Element; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node.hidden || style.display === "none" || style.visibility === "hidden"
      || style.visibility === "collapse" || style.contentVisibility === "hidden"
      || Number(style.opacity) === 0 || clipped(style)) return false;
    if (node === control) break;
  }
  const controlRect = control.getBoundingClientRect();
  return [...element.getClientRects()].some(rect => rect.width > 1 && rect.height > 1
    && (!withinControl || (Math.min(rect.right, controlRect.right) - Math.max(rect.left, controlRect.left) > 1
      && Math.min(rect.bottom, controlRect.bottom) - Math.max(rect.top, controlRect.top) > 1)));
}

function referencedVisibleText(control, attribute) {
  return (control.getAttribute(attribute) || "").split(/\s+/).filter(Boolean).some(id => {
    if (id === tooltipId) return false;
    const element = id && document.getElementById(id);
    return element?.textContent.trim() && visiblyRendered(element, control, false);
  });
}

function hasVisibleLabel(control) {
  if (referencedVisibleText(control, "aria-labelledby") || referencedVisibleText(control, "aria-describedby")) return true;
  if ([...control.querySelectorAll(".trip-pencil-text")]
    .some(element => element.textContent.trim() && visiblyRendered(element, control))) return true;
  const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!node.textContent.trim() || !parent || parent.closest(".trip-pencil-icon,.trip-pencil-text")) continue;
    const color = getComputedStyle(parent).color.replaceAll(" ", "");
    if (color !== "transparent" && !color.endsWith(",0)") && !color.endsWith(",0.0)")
      && visiblyRendered(parent, control)) return true;
  }
  return false;
}

function tooltipControl(target) {
  const control = iconControl(target);
  return control && !hasVisibleLabel(control) ? control : null;
}

export function AdventureIconFeedback() {
  const [active, setActive] = useState(null);
  const [position, setPosition] = useState(null);
  const tooltip = useRef(null), activeRef = useRef(null), hideTimer = useRef(null);
  activeRef.current = active;

  useEffect(() => {
    const board = document.getElementById("trip-board-structure");
    if (!board) return undefined;
    const nativeTitles = new Map();
    const suppressTitle = control => {
      if (!control?.matches?.(controls) || !control.querySelector(".trip-pencil-icon")) return;
      const title = control.getAttribute("title");
      if (!title) return;
      const previous = nativeTitles.get(control);
      const ownsLabel = previous?.addedLabel && control.getAttribute("aria-label") === previous.ariaLabel;
      const addedLabel = ownsLabel || (!control.hasAttribute("aria-label") && !control.textContent.trim());
      if (addedLabel) control.setAttribute("aria-label", title);
      nativeTitles.set(control, { title, addedLabel, ariaLabel: addedLabel ? title : null });
      control.removeAttribute("title");
    };
    const suppressTitlesWithin = node => {
      if (!(node instanceof Element)) return;
      suppressTitle(node);
      node.querySelectorAll(controls).forEach(suppressTitle);
    };
    suppressTitlesWithin(board);
    const hide = () => { clearTimeout(hideTimer.current); setActive(null); };
    const overTooltip = event => {
      const rect = tooltip.current?.getBoundingClientRect();
      return rect && event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
    };
    const show = control => {
      if (!control || control.closest("[inert],[aria-hidden=true]")) return;
      clearTimeout(hideTimer.current);
      const label = control.getAttribute("aria-label") || nativeTitles.get(control)?.title || control.textContent.trim();
      if (!label) return;
      if (activeRef.current?.control === control) {
        if (activeRef.current.label !== label) setActive(previous => ({ ...previous, label }));
        return;
      }
      setPosition(null);
      setActive({ control, label, host: control.closest("dialog[open]") || document.getElementById("trip-board-structure") });
    };
    const over = event => {
      if (event.pointerType === "touch") return;
      const control = tooltipControl(event.target);
      if (control) {
        show(control);
        return;
      }
      if (overTooltip(event)) {
        clearTimeout(hideTimer.current);
      } else if (iconControl(event.target)) {
        hide();
      }
    };
    const out = event => {
      const control = iconControl(event.target);
      if (overTooltip(event) || (!control && !tooltip.current?.contains(event.target))
        || activeRef.current?.control.contains(event.relatedTarget)
        || tooltip.current?.contains(event.relatedTarget)) return;
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, 120);
    };
    const move = event => {
      if (!activeRef.current || event.pointerType === "touch") return;
      const control = tooltipControl(event.target);
      if (control) show(control);
      else if (overTooltip(event)) {
        clearTimeout(hideTimer.current);
      } else if (iconControl(event.target)) {
        hide();
      } else {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(hide, 120);
      }
    };
    const focus = event => {
      const control = tooltipControl(event.target);
      if (control?.matches(":focus-visible")) show(control);
      else if (iconControl(event.target)) hide();
    };
    const key = event => { if (event.key === "Escape") hide(); };
    const observe = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "title") suppressTitle(mutation.target);
        mutation.addedNodes?.forEach(suppressTitlesWithin);
      }
      const control = activeRef.current?.control;
      if (control && (!control.isConnected || control.closest("[inert],[aria-hidden=true]") || hasVisibleLabel(control))) hide();
      else if (control) show(control);
    });
    observe.observe(board, { subtree: true, childList: true,
      attributes: true, attributeFilter: ["inert", "aria-hidden", "title"] });
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointermove", move);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      observe.disconnect();
      clearTimeout(hideTimer.current);
      nativeTitles.forEach(({ title, addedLabel, ariaLabel }, control) => {
        if (!control.isConnected) return;
        if (!control.hasAttribute("title")) control.setAttribute("title", title);
        if (addedLabel && control.getAttribute("aria-label") === ariaLabel) control.removeAttribute("aria-label");
      });
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  useLayoutEffect(() => {
    if (!active) return;
    const { control } = active;
    const title = control.getAttribute("title"), description = control.getAttribute("aria-describedby");
    control.removeAttribute("title");
    control.setAttribute("aria-describedby", [description, tooltipId].filter(Boolean).join(" "));
    const header = control.closest(".trip-panel-header,.trip-adventure-calendar-header,.trip-adventure-menu-header");
    const verticalRail = control.closest('[role="tablist"][aria-orientation="vertical"],.trip-bag-tabs');
    let frame = 0;
    const place = () => {
      if (!tooltip.current) return;
      const rect = control.getBoundingClientRect(), box = tooltip.current.getBoundingClientRect();
      const maxX = Math.max(8, innerWidth - box.width - 8);
      const maxY = Math.max(8, innerHeight - box.height - 8);
      let x, y;
      if (verticalRail) {
        const right = rect.right + 8, left = rect.left - box.width - 8;
        x = right + box.width <= innerWidth - 8 ? right : left >= 8 ? left : Math.max(8, Math.min(maxX, right));
        y = Math.max(8, Math.min(maxY, rect.top + (rect.height - box.height) / 2));
      } else {
        const anchor = header?.getBoundingClientRect() || rect;
        x = Math.max(8, Math.min(maxX, rect.left + (rect.width - box.width) / 2));
        y = anchor.bottom + box.height + 16 <= innerHeight ? anchor.bottom + 8 : Math.max(8, anchor.top - box.height - 8);
      }
      setPosition(previous => previous?.left === x && previous?.top === y ? previous : { left: x, top: y });
      // Track the drawer's transform as it enters without repainting stationary tooltips.
      frame = requestAnimationFrame(place);
    };
    place();
    return () => {
      cancelAnimationFrame(frame);
      if (title !== null) control.setAttribute("title", title);
      if (description === null) control.removeAttribute("aria-describedby");
      else control.setAttribute("aria-describedby", description);
    };
  }, [active]);

  return active && createPortal(<PencilSurface variant="paper" ref={tooltip} id={tooltipId}
    role="tooltip" className="trip-icon-tooltip" style={{ ...position, visibility: position ? "visible" : "hidden" }}>
    <PencilText>{active.label}</PencilText>
  </PencilSurface>, active.host);
}
