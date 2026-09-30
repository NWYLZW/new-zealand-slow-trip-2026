import { setCameraHardwarePreference, useCameraHardwareStore } from "./cameraHardware";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { PanelDivider } from "./pencil/PanelDivider";
import "./CameraHardwareControls.css";

function FocusIcon() {
  return <PencilIcon kind="manual-focus">
    <path d="M10 5H5v5M22 5h5v5M5 22v5h5M27 22v5h-5M16 10.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6z" />
  </PencilIcon>;
}

export function CameraAdvancedSettings({ en = false }) {
  const { capabilities, preferences } = useCameraHardwareStore();
  if (!capabilities) return <section className="trip-camera-hardware-settings" aria-label={en ? "Advanced camera settings" : "相机高级设置"}>
    <p className="trip-camera-hardware-settings-note"><PencilText>
      {en ? "Open the camera preview once to check manual-focus support."
        : "请先打开一次相机取景，以检查手动对焦支持。"}
    </PencilText></p>
  </section>;
  if (!capabilities.manualFocus) return null;
  const range = capabilities.focusDistance;
  const distance = clampPreference(preferences.focusDistance ?? capabilities.settings.focusDistance, range);
  const stale = !capabilities.authoritative;
  return <section className="trip-camera-hardware-settings" aria-label={en ? "Advanced camera settings" : "相机高级设置"}>
    <div className="trip-camera-hardware-settings-heading">
      <span className="trip-camera-form-label-icon"><FocusIcon /></span>
      <h2><PencilText>{en ? "Manual focus" : "手动对焦"}</PencilText></h2>
    </div>
    <PencilSurface className="trip-camera-hardware-settings-field trip-camera-hardware-settings-select">
      <select value={capabilities.autoMode ? preferences.focusMode : "manual"} aria-label={en ? "Focus mode" : "对焦模式"}
        onChange={event => setCameraHardwarePreference("focusMode", event.target.value === "manual" ? "manual" : "auto")}>
        {capabilities.autoMode && <option value="auto">{en ? "Automatic" : "自动"}</option>}
        <option value="manual">{en ? "Manual" : "手动"}</option>
      </select>
      <PencilIcon kind="chevron"><path d="m9 12 7 7 7-7" /></PencilIcon>
    </PencilSurface>
    {(preferences.focusMode === "manual" || !capabilities.autoMode) && <PencilSurface className="trip-camera-hardware-settings-field trip-camera-hardware-focus-distance">
      <input type="range" min={range.min} max={range.max} step={range.step} value={distance}
        aria-label={en ? "Manual focus distance" : "手动对焦距离"}
        onChange={event => setCameraHardwarePreference("focusDistance", Number(event.target.value))} />
      <output><PencilText>{distance.toFixed(2)}</PencilText></output>
    </PencilSurface>}
    <p className="trip-camera-hardware-settings-note" role="status"><PencilText>
      {stale
        ? en ? "Values are from the last camera. They will be checked again when preview opens."
          : "这些能力来自上次使用的相机，返回取景后会重新校验。"
        : en ? "The current camera advertised manual focus support."
          : "当前相机已声明支持手动对焦。"}
    </PencilText></p>
    <PanelDivider />
  </section>;
}

function clampPreference(value, range) {
  const numeric = Number(value);
  return Math.min(range.max, Math.max(range.min, Number.isFinite(numeric) ? numeric : range.min));
}
