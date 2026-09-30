import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { cameraLevelPermission, observeCameraLevel } from "./cameraLevel.js";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./CameraLevel.css";

function useLevelPermission() {
  return useSyncExternalStore(cameraLevelPermission.subscribe, cameraLevelPermission.getSnapshot, () => "unavailable");
}

export function useCameraLevel(active) {
  const permission = useLevelPermission();
  const enabled = permission === "passive" || permission === "granted";
  const [status, setStatus] = useState("waiting");
  const [reading, setReading] = useState(null);
  useLayoutEffect(() => {
    if (!active || !enabled) {
      setReading(null);
      return undefined;
    }
    return observeCameraLevel(setReading, setStatus);
  }, [active, enabled]);
  return { status: enabled ? status : permission, reading: active && enabled ? reading : null };
}

export function CameraLevelPermission({ enabled, en }) {
  const permission = useLevelPermission();
  if (!enabled || permission === "passive") return null;
  if (permission === "unavailable" || permission === "granted") {
    return <p className="trip-camera-settings-status" role="status"><PencilText>
      {permission === "granted" ? en ? "Motion permission granted" : "方向权限已允许"
        : en ? "Level sensor unavailable" : "水平仪传感器不可用"}
    </PencilText></p>;
  }
  const label = permission === "requesting" ? en ? "Requesting motion permission" : "正在请求方向权限"
    : permission === "denied" ? en ? "Motion permission denied; retry" : "方向权限被拒绝；重试"
      : en ? "Allow motion for grid level" : "允许方向感应用于网格水平仪";
  return <PencilSurface as="button" variant="action" type="button" className="trip-camera-level-permission"
    disabled={permission === "requesting"} onClick={cameraLevelPermission.request}>
    <PencilIcon kind="level"><path d="M5 16h7m8 0h7M12 10h8v12h-8zM16 7v5m0 8v5" /></PencilIcon>
    <PencilText>{label}</PencilText>
  </PencilSurface>;
}

const edgeLabels = {
  top: ["上边", "top edge"], right: ["右边", "right edge"],
  bottom: ["下边", "bottom edge"], left: ["左边", "left edge"],
};

export function CameraLevel({ reading, en }) {
  const edge = reading && edgeLabels[reading.edge]?.[en ? 1 : 0];
  const label = reading ? `${edge}: ${reading.aligned ? en ? "Camera level" : "相机已水平"
    : `${en ? "Camera tilt" : "相机倾斜"} ${Math.round(reading.angle)}°`}` : undefined;
  return <div className="trip-camera-grid" role={reading ? "img" : undefined}
    aria-hidden={reading ? undefined : true} aria-label={label}>
    {Object.keys(edgeLabels).map(side => <div className="trip-camera-grid-line" data-edge={side} key={side}>
      <span className="trip-camera-grid-segment" />
      <span className="trip-camera-grid-segment" data-level-active={reading?.edge === side || undefined}
        data-aligned={reading?.edge === side ? reading.aligned : undefined}
        style={reading?.edge === side ? { transform: `rotate(${reading.angle}deg)` } : undefined} />
      <span className="trip-camera-grid-segment" />
    </div>)}
  </div>;
}
