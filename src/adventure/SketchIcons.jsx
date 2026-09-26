import React from "react";
import { PencilIcon } from "./pencil/PencilIcon";

// Keep the local symbols and pen lifts; all icons now use the same pencil brush.
function SketchIcon(props) {
  return <PencilIcon {...props} />;
}

export function BackIcon(props) {
  return <PencilIcon {...props}>
    <path d="M14.4 6.9 5.8 15.7l8.6 8.5M6.2 15.9c7.5-.8 13-.1 16.5 3.1 1.6 1.5 2.5 3.1 2.9 5.2" />
    <path className="sketch-scuff" d="M7.3 17.2 11 17M16.8 17.4l2.1.7M13.6 8.4l-2.3 2.3" />
  </PencilIcon>;
}

export function TasksIcon(props) {
  return <SketchIcon kind="tasks" {...props}>
    <path className="sketch-wash" d="M8.4 12.3c5.3.4 10.7.2 15.3-.5l-.5 13.1-14.9.4z" stroke="none" />
    <path d="M9.4 7.5 7.2 8.2l-.3 8.5M6.8 18.9 6.7 27c5.4.8 12.6.7 18.3-.2l.3-8.9M25.5 15.7l.1-7.3-2.8-.5" />
    <path d="M12 5.6c.4-2.4 7.1-2.5 7.6-.1l2.1.3-.1 4.1c-3 .4-8.1.4-11.1 0l.1-4zM10.9 15l1.6 1.7 2.1-2.4M17.5 15.7l4.3-.2M11 21.3l1.5 1.5 2.1-2.4M17.5 21.9l4.1-.4" />
    <path className="sketch-scuff" d="M7.4 25.8c4.7.8 10.9.8 16 .1M8 11.2l-.1 2.3m16.7-1.9-.1 2.1" />
    <path className="sketch-hatch" d="m9.4 24.1 1.3-1.1m5.7 1.3 1.3-1.2m3.9.5 1-1" />
  </SketchIcon>;
}

export function BagIcon(props) {
  return <SketchIcon kind="bag" {...props}>
    <path className="sketch-wash" d="M8.1 14.3c4.5.4 11.2.1 15.8-.7l1 12c-5.7 1.1-12.2 1.1-18 .2z" stroke="none" />
    <path d="M10.8 9.2c.1-3 2-5 5.1-5 3.3 0 5.1 2 5.2 5M8 10c4.6-1 11.4-1 16 .2l.6 6.3M25 18.5l.5 7.9c-5.8 1.2-13.4 1.1-19 .1l.7-8M7.4 16.4 8 10" />
    <path d="M11.4 13c3-.5 6.9-.5 9.8.1l-.1 2.3m0 1.8v2.1c-2.7.6-7 .6-9.8.1l.1-6.4M12.9 16.4l6.7-.1M10.5 23.4c3.4.6 7.9.6 11.1-.1" />
    <path className="sketch-scuff" d="M7.8 12.4 7.4 15m-.4 9.8c4.6 1.2 10.5 1.3 15.2.5m1.1-15.9 1.2.3" />
    <path className="sketch-hatch" d="m9.3 24 1.1-1m8.7 1.6 1.3-1.2m2.1.5 1-1" />
  </SketchIcon>;
}

export function PhotosIcon(props) {
  return <SketchIcon kind="photos" {...props}>
    <path className="sketch-wash" d="m9.5 14.6 5.7-1.3 3.1 3.2 2.4-2.7 4 4.4.1 5.5-14.9.6z" stroke="none" />
    <path d="M8.8 5.8 25.6 5l.3 7.4m.1 2.2.2 9.9-17.2.7-.2-8.8M8.8 14.5V5.8M5.7 9.1l-.6 18 10.3.1m2.2.1 4.9-.1" />
    <path d="m10.7 21.2 4.6-5.2 3.2 3 2.1-2.4 3.3 3.7M13.6 11.4c.1 1.2.9 2 2 2s1.8-.9 1.8-2-.7-1.9-1.8-1.9-2 .7-2 1.9z" />
    <path className="sketch-scuff" d="M9.6 6.5 15 6.2m2.6-.1 7.1-.4M6 26.4c4.8.7 10.9.8 15.9.2" />
    <path className="sketch-hatch" d="m12 22.8 1.4-1.1m6.3 1.5 1.5-1.2m1.8.4.9-.8" />
  </SketchIcon>;
}

function ZoomIcon({ plus, ...props }) {
  return <SketchIcon kind="zoom" {...props}>
    <path className="sketch-wash" d="M6.2 14.5c1.2 4.1 4.2 7.3 8.6 7.1 2.9-.1 4.9-1.5 6.2-3.4-4.1.7-8.8-1-11.4-5.4z" stroke="none" />
    <path className="sketch-lens" d="M21.9 9.5c2.3 4.5.3 10.3-4.1 12.6-4.5 2.3-10.3.3-12.5-4.1C3 13.6 5 7.9 9.6 5.6c4-2 8.7-.8 11.3 2.5" />
    <path d="M20.9 20.8 26.8 26.9" />
    <path d="M10.1 13.8 17.8 13.6" />
    {plus && <path d={plus} />}
    <path className="sketch-scuff" d="M6.4 11.1 7.2 9.7M16.9 22.2l1.1-.4M21.5 21.4l5.2 5.5" />
    <path className="sketch-hatch" d="m7.7 16.2 1.5-.9m1 3.2 1.3-.8m3.2 2.6 1.2-.7" />
  </SketchIcon>;
}
export function ZoomInIcon(props) { return <ZoomIcon plus="M13.8 10l.2 7.6" {...props} />; }
export function ZoomOutIcon(props) { return <ZoomIcon plus="" {...props} />; }

export function ResetIcon(props) {
  return <SketchIcon kind="reset" {...props}>
    <path className="sketch-wash" d="M7 17.3c1.1 5 4.6 8.4 9.4 8.4 4.1 0 7.2-2.5 8.5-5.7-4.9 1.4-9.7.8-13.5-2.7z" stroke="none" />
    <path className="sketch-lens" d="M6.7 12.2c1.5-4 5-6.8 9.4-6.8 5.6 0 9.9 4.5 9.9 10 0 5.5-4.2 9.8-9.7 9.9-4.3.1-7.9-2.5-9.4-6.5" />
    <path d="M6.6 7.2l.1 5.1 5-1" />
    <path className="sketch-scuff" d="M13.6 5.9 15 5.7M23.2 21.9l-.9 1M9 21.6l.8 1" />
    <path className="sketch-hatch" d="m10.1 22.8 1.1-1m4.1 2.2 1.2-1m4 .1 1-1" />
  </SketchIcon>;
}

export function CloseIcon(props) {
  return <SketchIcon kind="close" {...props}>
    <path d="m7.1 7.5 7.1 6.9m2.2 2.1 8.5 8.2M24.7 7.2l-7.3 7.5m-2 2.2-8 8" />
    <path className="sketch-scuff" d="m8.1 7 4.5 4.4m6.1 7.6 5.2 5.1M23.9 8.1l-2.7 2.8" />
  </SketchIcon>;
}

export function PreviousIcon(props) {
  return <SketchIcon kind="arrow" {...props}><path d="m17.2 7.5-8 8.3 8.1 8.4M9.7 16c3.7-.3 6.8-.3 9.3-.1m2 .2 2.1.1" /><path className="sketch-scuff" d="m10.8 15.1 2.2-2.1m-2.1 3.9 2 2.2" /></SketchIcon>;
}

export function NextIcon(props) {
  return <SketchIcon kind="arrow" {...props}><path d="m14.8 7.5 8 8.3-8.1 8.4M22.3 16c-3.7-.3-6.8-.3-9.3-.1m-2 .2-2.1.1" /><path className="sketch-scuff" d="m21.2 15.1-2.2-2.1m2.1 3.9-2 2.2" /></SketchIcon>;
}
