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

export function MenuIcon(props) {
  return <SketchIcon kind="menu" {...props}>
    <path d="M6.1 9.2c6.3-.5 13.1-.4 19.7.1M6.4 16.1c5.7.3 12.8.4 19.2-.2M6.1 23c6.2-.3 13.3-.3 19.7.2" />
    <path className="sketch-scuff" d="m8.4 10.1 3.4-.1m9.3 6.7 2.8-.3M9 23.8l3.6-.1" />
  </SketchIcon>;
}

export function SettingsIcon(props) {
  return <SketchIcon kind="settings" {...props}>
    <path d="M11.1 6.6 13 4.8l2.3 1.2 2.1-.1 2.3-1.1 1.8 1.9-.8 2.4 1.2 2 2.5.8.1 2.8-2.5.9-1.1 2 .8 2.5-1.9 1.8-2.4-1.1-2.1.1-2.4 1.1-1.8-1.9.9-2.5-1.2-2-2.5-.9-.1-2.7 2.5-.9 1.1-2z" />
    <path d="M16.3 10.9c-2.7 0-4.6 2-4.6 4.7s1.9 4.6 4.6 4.6 4.6-1.9 4.6-4.6-1.9-4.7-4.6-4.7z" />
    <path className="sketch-scuff" d="m11.4 25.6 9.8-.2m-7.8 2.3 5.7-.1" />
  </SketchIcon>;
}

export function InstallIcon(props) {
  return <SketchIcon kind="install" {...props}>
    <path d="M7.1 21.7v4.8c5.5.6 12 .7 17.6 0v-4.8M16 4.6l-.2 16.2m-5.2-5.1 5.2 5.2 5.3-5.2" />
    <path className="sketch-scuff" d="m9.1 25.7 4 .2m7.4-.1 2.2-.2M16.7 6.3l-.1 3.2" />
  </SketchIcon>;
}

export function LegacyIcon(props) {
  return <SketchIcon kind="legacy" {...props}>
    <path d="M6.3 8.2c6.1-.5 13.3-.5 19.5.1l-.2 16.3c-5.7.7-13.4.7-19.2 0zM6.8 12.4l18.4-.1M12.1 17.1l-3.5 3.4 3.5 3.2m-3.3-3.3 8.2-.1" />
    <path className="sketch-scuff" d="m9.4 9.8 1.3-.1m2.1 0 1.3-.1m2.2.1 1.3-.1" />
  </SketchIcon>;
}

export function MapSourcesIcon(props) {
  return <SketchIcon kind="map-sources" {...props}>
    <path d="m5.8 8.4 6.7-2.5 6.7 2.1 6.8-2.3-.2 18-6.7 2.5-6.7-2.2-6.6 2.4zM12.5 5.9l-.1 18M19.2 8l-.1 18" />
    <path d="m8.2 13.2 2.2-.8m-2.2 4.1 2.1-.7m-2.1 4 2.1-.7m4.5-6.3 2.1.6m-2.1 3.3 2.1.6m4.4-3.9 2.1-.7m-2.1 4.1 2.1-.7" />
    <path className="sketch-scuff" d="m6.5 9.4 2-.7m11.5 16.6 2.5-.9" />
  </SketchIcon>;
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

export function PhotoAlbumIcon(props) { return <PhotosIcon {...props} />; }

export function CameraIcon(props) {
  return <SketchIcon kind="camera" {...props}>
    <path className="sketch-wash" d="M6.5 12.4c6.2.7 12.9.6 19.2-.2l-.2 12.4c-6.1.8-12.6.8-18.8.1z" stroke="none" />
    <path d="M5.5 10.2c2.1-.4 4.2-.5 6.1-.5l1.8-3.2c2.4-.3 4.7-.3 7.1.1l1.5 3.2c1.8 0 3.1.1 4.4.4l.3 15.4c-6.8.8-14.2.8-21.3-.1z" />
    <path d="M16.1 12.8c-3.4 0-5.9 2.6-5.9 5.9s2.5 5.9 5.9 5.9 5.8-2.6 5.8-5.9-2.4-5.9-5.8-5.9zM16 16c-1.5 0-2.6 1.1-2.6 2.7s1.1 2.7 2.6 2.7 2.7-1.1 2.7-2.7S17.5 16 16 16zM23.1 13.1l1.4.1" />
    <path className="sketch-scuff" d="M7.3 11.5l2.5-.2m11.6 13.2 3.2-.2m-9.4-16.8 3.8.1" />
  </SketchIcon>;
}

export function ImportIcon(props) {
  return <SketchIcon kind="import" {...props}>
    <path d="M6.2 19.3v7.2c5.6.7 13.7.8 19.4 0v-7.1M16 5.1l-.1 16m-5.1-5.1 5.1 5.2 5.3-5.1" />
    <path className="sketch-scuff" d="m8.3 26.1 3.9.3m7.2.1 3.4-.2M16.7 6.8l-.1 3.2" />
  </SketchIcon>;
}

export function ExportIcon(props) {
  return <SketchIcon kind="export" {...props}>
    <path d="M6.2 19.3v7.2c5.6.7 13.7.8 19.4 0v-7.1M16 21.3l-.1-16m-5.1 5.3 5.1-5.3 5.3 5.2" />
    <path className="sketch-scuff" d="m8.3 26.1 3.9.3m7.2.1 3.4-.2M16.7 17.1l-.1 3" />
  </SketchIcon>;
}

export function UploadIcon(props) {
  return <SketchIcon kind="upload" {...props}>
    <path d="M6.8 21.2v5.2c5.4.6 12.7.7 18.2 0v-5.1M15.9 22.7l.1-17.1m-5.3 5.5 5.3-5.5 5.2 5.4" />
    <path className="sketch-scuff" d="m8.3 25.6 3.2.2m8.4.2 3.1-.2M16.6 18.7l-.1 2.9" />
  </SketchIcon>;
}

export function OrderIcon(props) {
  return <SketchIcon kind="order" {...props}>
    <path className="sketch-wash" d="M8.1 10.1c5.2.2 10.8.1 16.1-.4l-.3 16-15.6.4z" stroke="none" />
    <path d="M7.7 5.7c5.6-.5 11.6-.4 16.8.1l-.1 21.4-3-1.9-2.7 1.8-2.7-1.7-2.7 1.8-2.8-1.8-2.9 1.7zM10.7 10.4l10.2-.2M10.8 13.8l5.9-.1M10.9 19.1l2.1 2.1 5.7-5.5" />
    <path className="sketch-scuff" d="m9.6 6.6 3.2-.2m6.3.1 3.3.1M8.9 25.3l1.8-1" />
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

export function LockIcon(props) {
  return <SketchIcon kind="lock" {...props}>
    <path d="M9.2 14.1V10c0-3.8 2.5-6.1 6.8-6.1s6.8 2.3 6.8 6.1v4.1M12.1 14V9.9c0-2.1 1.4-3.2 3.9-3.2s3.9 1.1 3.9 3.2V14" />
    <path d="M7.5 14.2c5.2-.5 11.9-.5 17 .1l-.2 12.5c-5.5.7-11.6.7-16.7-.1zM16.1 18.2c-1.4 0-2.1 1-2.1 2.1 0 .8.4 1.4 1.1 1.8l-.4 2.1h2.8l-.4-2.1c.7-.4 1.1-1 1.1-1.8 0-1.1-.8-2.1-2.1-2.1z" />
    <path className="sketch-scuff" d="m9.3 25.1 3 .3m7.9-.1 2.1-.3" />
  </SketchIcon>;
}

export function UnlockIcon(props) {
  return <SketchIcon kind="unlock" {...props}>
    <path d="M10.1 14.1v-4c0-3.8 2.5-6.2 6.9-6.2 4.1 0 6.5 2.2 6.5 5.6M13 14v-4c0-2.2 1.4-3.3 4-3.3 2.4 0 3.8 1.1 3.8 2.9" />
    <path d="M7.5 14.2c5.2-.5 11.9-.5 17 .1l-.2 12.5c-5.5.7-11.6.7-16.7-.1zM16.1 18.2c-1.4 0-2.1 1-2.1 2.1 0 .8.4 1.4 1.1 1.8l-.4 2.1h2.8l-.4-2.1c.7-.4 1.1-1 1.1-1.8 0-1.1-.8-2.1-2.1-2.1z" />
  </SketchIcon>;
}

export function RoutePathIcon(props) {
  return <SketchIcon kind="route" {...props}>
    <path d="M8 24.6c4.9 1.2 7.8-.1 7.9-4 .1-3.7-3.1-4.6-2.2-8.1.6-2.4 3-3.6 8.4-4.7" />
    <path d="M5.4 24.4c0-1.6 1.2-2.9 2.7-2.9s2.6 1.3 2.6 2.9c0 1.5-1.1 2.7-2.6 2.7s-2.7-1.2-2.7-2.7zM19.5 7.9c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7c0 1.6-1.2 2.8-2.7 2.8s-2.7-1.2-2.7-2.8z" />
    <path className="sketch-scuff" d="m15.4 19.7 1.1-2.1m-2.7-5.1 1.5-1.3" />
  </SketchIcon>;
}

export function CalendarIcon(props) {
  return <SketchIcon kind="calendar" {...props}>
    <path d="M6.1 8.3c5.8-.6 14.4-.7 20-.1l.4 18.1c-6 .7-14.7.8-20.5.1zM6.3 13.4c6.1.4 14.4.4 19.9-.2M11.3 5.2l-.1 5.1m9.4-5.2.1 5.1" />
    <path className="sketch-scuff" d="m9.1 16.8 2.4-.1m3.5.1 2.3-.1m3.4 0 2.2-.1M9.2 21.2l2.3-.1m3.5 0 2.2-.1" />
  </SketchIcon>;
}

export function DirectionsIcon(props) {
  return <SketchIcon kind="directions" {...props}>
    <path d="m5.5 8.4 6.2-2.6 8.1 2.4 6.4-2.5-.3 18.1-6.2 2.5-8.1-2.4-6.4 2.6zM11.7 5.8l-.1 18.1m8.2-15.7-.1 18.1" />
    <path d="M7.9 18.9c2.1-2.3 3.5-3.1 5.7-2.2 1.9.8 2.7 1.8 4.3 1.2 1.4-.5 2.4-2.1 4.3-3.6m-3.2-.2 3.2.2-.5 3.1" />
    <path className="sketch-scuff" d="m7.4 9.7 2-.8m12 15.2 2-.8" />
  </SketchIcon>;
}

export function LocationMapIcon(props) {
  return <SketchIcon kind="location-map" {...props}>
    <path d="m5.8 10.3 5.8-2.1 8.3 2.1 6.2-2.2-.2 16.1-6.1 2.2-8.3-2.1-5.9 2.1zM11.6 8.2l-.1 16.1m8.4-14-.1 16.1" />
    <path d="M16.1 5.4c-2.4 0-4.2 1.8-4.2 4.1 0 2.6 4.2 7.2 4.2 7.2s4.2-4.6 4.2-7.2c0-2.3-1.8-4.1-4.2-4.1zM16.1 8.1c-1 0-1.7.7-1.7 1.7s.7 1.7 1.7 1.7 1.7-.7 1.7-1.7-.7-1.7-1.7-1.7z" />
    <path className="sketch-scuff" d="m7.6 23 2-.6m12.1 1.4 2.1-.8" />
  </SketchIcon>;
}

export function GoogleMapIcon(props) {
  return <SketchIcon kind="google-map" {...props}>
    <path d="m5.8 8.7 6.4-2.5 7.1 2.3 6.8-2.4-.2 18.1-6.7 2.4-7.1-2.3-6.5 2.4zM12.2 6.2l-.1 18.1m7.2-15.8-.1 18.1" />
    <path d="M16 8.6c-2.4 0-4.2 1.8-4.2 4.1 0 2.6 4.2 7.2 4.2 7.2s4.2-4.6 4.2-7.2c0-2.3-1.8-4.1-4.2-4.1zM16 11.3c-1 0-1.7.7-1.7 1.7s.7 1.7 1.7 1.7 1.7-.7 1.7-1.7-.7-1.7-1.7-1.7z" />
    <path className="sketch-scuff" d="m7.5 10.1 2-.8m11.7 14.9 2.2-.8" />
  </SketchIcon>;
}

export function HotelIcon(props) {
  return <SketchIcon kind="hotel" {...props}>
    <path d="M5.8 25.8V7.1c5.8-.7 14.3-.7 20.2 0v18.7M4.2 26.1h23.5M9.2 11.1h3.1m4.1 0h3.1m-10.3 5h3.1m4.1 0h3.1M12 26v-5.5h7.8V26" />
    <path className="sketch-scuff" d="m7.1 7.9 3.5-.3m10.1.2 3.2.3M5.6 24.9l3.1.1" />
  </SketchIcon>;
}

export function ExternalLinkIcon(props) {
  return <SketchIcon kind="external-link" {...props}>
    <path d="M18.7 6.7c2.8-.2 5.2-.1 8 .1l-.1 8.1M26.5 7.1l-11 11.1" />
    <path d="M22.3 18.1v7.1c-4.9.7-10.5.7-15.5.2l-.2-15.3c3.1-.3 6.2-.4 9.1-.2" />
    <path className="sketch-scuff" d="m7.1 22.8 2.4.3m14.1-14.5 1.5-1.3m-3.9 17.2-2.5.2" />
  </SketchIcon>;
}

export function RouteDistanceIcon(props) {
  return <SketchIcon kind="distance" {...props}>
    <path d="M7.2 24.4c3.1-2.2 4.1-5 4.6-8.5.5-3.6 2.9-5.8 6.4-5.8h5.4M18.7 6.8l4.9 3.3-4.7 3.4" />
    <path d="M5.4 26.3c-.3-1.1.5-2.2 1.6-2.3 1.2-.1 2 1 1.8 2-.2 1-1.3 1.6-2.3 1.2-.6-.2-.9-.5-1.1-.9z" />
    <path className="sketch-scuff" d="m13.1 14.8 1.3-.6m2.2-3 1.3-.2" />
  </SketchIcon>;
}

export function FlightIcon(props) {
  return <SketchIcon kind="flight" {...props}>
    <path d="M16 3.9c-.8 0-1.3.7-1.3 1.5l-.1 8.4-8.3 5.3.1 2.3 8.2-2.6-.1 5.3-2.4 1.8v1.7l3.9-1.2 3.9 1.2v-1.7l-2.4-1.8-.1-5.3 8.2 2.6.1-2.3-8.3-5.3-.1-8.4c0-.8-.5-1.5-1.3-1.5z" />
    <path className="sketch-scuff" d="m14.8 8.1.1 3.2m2.1 5.2 4.6 2.9m-9.9-.1-3.5 1.1" />
  </SketchIcon>;
}

// These contours follow the installed MUI icon geometry, repainted by PencilIcon.
function MaterialPencilIcon({ path, kind, ...props }) {
  return <PencilIcon kind={kind} sourceSize={24} {...props}><path d={path} /></PencilIcon>;
}

export function LanguageIcon(props) {
  return <MaterialPencilIcon kind="language" path="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2m6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56M12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96M4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56m2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8M12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96M14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2m.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56M16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2z" {...props} />;
}

export function FullscreenIcon(props) {
  return <MaterialPencilIcon kind="fullscreen" path="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z" {...props} />;
}

export function FullscreenExitIcon(props) {
  return <MaterialPencilIcon kind="fullscreen-exit" path="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" {...props} />;
}

export function PaletteIcon(props) {
  return <PencilIcon kind="palette" sourceSize={24} {...props}>
    <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67 0 1.38-1.12 2.5-2.5 2.5m0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5 0-.16-.08-.28-.14-.35-.41-.46-.63-1.05-.63-1.65 0-1.38 1.12-2.5 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7" />
    <path d="M8 11.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 1 0 3 0M11 7.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 1 0 3 0M16 7.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 1 0 3 0M19 11.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 1 0 3 0" />
  </PencilIcon>;
}

export function AppearanceIcon(props) {
  return <MaterialPencilIcon kind="appearance" path="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12zm-2 5.79V18h-3.52L12 20.48 9.52 18H6v-3.52L3.52 12 6 9.52V6h3.52L12 3.52 14.48 6H18v3.52L20.48 12zM12 6.5v11c3.03 0 5.5-2.47 5.5-5.5S15.03 6.5 12 6.5" {...props} />;
}

export function CityIcon(props) {
  return <MaterialPencilIcon kind="city" path="M15 11V5l-3-3-3 3v2H3v14h18V11zm-8 8H5v-2h2zm0-4H5v-2h2zm0-4H5V9h2zm6 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V9h2zm0-4h-2V5h2zm6 12h-2v-2h2zm0-4h-2v-2h2z" {...props} />;
}

export function CarIcon(props) {
  return <MaterialPencilIcon kind="car" path="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16m11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5M5 11l1.5-4.5h11L19 11z" {...props} />;
}

export function BoatIcon(props) {
  return <MaterialPencilIcon kind="boat" path="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78zM6 6h12v3.97L12 8 6 9.97z" {...props} />;
}

export function MountainIcon(props) {
  return <MaterialPencilIcon kind="mountain" path="m14 6-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22z" {...props} />;
}

export function StarsIcon(props) {
  return <MaterialPencilIcon kind="stars" path="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2m4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23z" {...props} />;
}

export function BusIcon(props) {
  return <MaterialPencilIcon kind="bus" path="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17m9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5m1.5-6H6V6h12z" {...props} />;
}

export function MovieIcon(props) {
  return <MaterialPencilIcon kind="movie" path="m18 4 2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z" {...props} />;
}

export function HelicopterIcon(props) {
  return <SketchIcon kind="helicopter" {...props}>
    <path d="M5.5 10.2c5.8-.6 15.3-.6 21 0M15.9 8.1l.1 3.8M7.3 14.1c2-1.1 7-1.7 10.6-1.1 3.2.5 5.6 2.6 5.5 5.4-.1 3.7-4 5.8-8.9 5.7-3.8-.1-6.5-1.4-7.8-3.8l-3.1-.2m18.8-2.2 3.6-1.2 1.7-3.3M10.1 24.7l-.3 2m9.4-2 .2 2M7.3 27.1c4.6.4 10.8.3 14.5-.1" />
    <path className="sketch-scuff" d="m9.4 16.2 3.1-.7m4.3-.1 2.7.7m5.5 3.7 2.4.2" />
  </SketchIcon>;
}

export function PreviousIcon(props) {
  return <SketchIcon kind="arrow" {...props}><path d="m17.2 7.5-8 8.3 8.1 8.4M9.7 16c3.7-.3 6.8-.3 9.3-.1m2 .2 2.1.1" /><path className="sketch-scuff" d="m10.8 15.1 2.2-2.1m-2.1 3.9 2 2.2" /></SketchIcon>;
}

export function NextIcon(props) {
  return <SketchIcon kind="arrow" {...props}><path d="m14.8 7.5 8 8.3-8.1 8.4M22.3 16c-3.7-.3-6.8-.3-9.3-.1m-2 .2-2.1.1" /><path className="sketch-scuff" d="m21.2 15.1-2.2-2.1m2.1 3.9-2 2.2" /></SketchIcon>;
}
