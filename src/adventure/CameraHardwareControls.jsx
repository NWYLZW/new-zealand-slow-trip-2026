import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./CameraHardwareControls.css";

const flashLabels = {
  off: ["闪光灯关闭", "Still flash off"],
  auto: ["闪光灯自动", "Still flash auto"],
  flash: ["闪光灯开启", "Still flash on"],
};

function FlashIcon({ mode }) {
  return <PencilIcon kind={`still-flash-${mode}`} themeBackdrop>
    <path d="M18.7 3.8 8.9 17h6.7l-2.2 11.2L24 14.1h-6.7z" />
    {mode === "off" && <path d="m6.2 6.5 20 20" />}
    {mode === "auto" && <path d="M23.1 24.8l2.1-6.2 2.2 6.2m-3.6-2.1h2.8" />}
  </PencilIcon>;
}

function TorchIcon({ active }) {
  return <PencilIcon kind="torch" active={active} themeBackdrop>
    <path d="M11 5.2h10l-1.3 7.1H12.3zM13.1 12.4h5.8v14.1h-5.8zM11.7 26.6h8.6M11 5.2l-2.8-2M21 5.2l2.8-2M16 4.5V1.7" />
  </PencilIcon>;
}

function ZoomIcon() {
  return <PencilIcon kind="hardware-zoom" themeBackdrop>
    <path d="M13.8 5.5a8.3 8.3 0 1 0 0 16.6 8.3 8.3 0 0 0 0-16.6zM19.8 19.7l7 7M9.6 13.8h8.4M13.8 9.6V18" />
  </PencilIcon>;
}

export function CameraHardwareControls({ controller, en = false, children }) {
  if (!controller) return children ? <div className="trip-camera-hardware-controls">{children}</div> : null;
  const controls = [];
  if (controller.flash?.modes.length > 1) {
    const index = controller.flash.modes.indexOf(controller.flash.value);
    const next = controller.flash.modes[(index + 1) % controller.flash.modes.length];
    const label = flashLabels[controller.flash.value] ?? flashLabels.off;
    controls.push(<button key="flash" type="button" className="trip-camera-hardware-button"
      data-icon-feedback="keyboard-only" disabled={controller.flash.disabled}
      aria-label={en ? `${label[1]}; change to ${flashLabels[next]?.[1] ?? next}`
        : `${label[0]}；切换为${flashLabels[next]?.[0] ?? next}`}
      onClick={() => controller.flash.setValue(next)}><FlashIcon mode={controller.flash.value} /></button>);
  }
  if (controller.torch) {
    controls.push(<button key="torch" type="button" className="trip-camera-hardware-button"
      data-icon-feedback="keyboard-only" disabled={controller.torch.disabled}
      aria-pressed={controller.torch.value}
      aria-label={controller.torch.value ? en ? "Turn off preview torch" : "关闭取景常亮灯"
        : en ? "Turn on preview torch" : "开启取景常亮灯"}
      onClick={() => controller.torch.setValue(!controller.torch.value)}><TorchIcon active={controller.torch.value} /></button>);
  }
  if (controller.zoom) {
    const value = Number(controller.zoom.value);
    controls.push(<PencilSurface key="zoom" as="label" variant="quiet" className="trip-camera-hardware-zoom">
      <span className="trip-camera-hardware-zoom-icon"><ZoomIcon /></span>
      <input type="range" min={controller.zoom.min} max={controller.zoom.max} step={controller.zoom.step}
        value={value} disabled={controller.zoom.disabled}
        aria-label={en ? "Camera zoom" : "相机变焦"}
        onChange={event => controller.zoom.setValue(Number(event.target.value))} />
      <output><PencilText>{Number.isFinite(value) ? `${value.toFixed(value < 10 ? 1 : 0)}×` : "—"}</PencilText></output>
    </PencilSurface>);
  }
  if (!controls.length && !children) return null;
  return <div className="trip-camera-hardware-controls" aria-label={en ? "Camera hardware controls" : "相机硬件控制"}>
    {controls}
    {children}
  </div>;
}
