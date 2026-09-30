import { useEffect, useRef, useState } from "react";
import { useAdventurePreferences } from "./AdventurePreferences";
import { createCameraNicknameAutosave } from "./cameraNicknameAutosave";
import { cameraPermissionPromptGate } from "./cameraPermissionLifecycle";
import { useCameraGridPreference, useCameraLocationPreference } from "./cameraPreferences";
import { getMediaSnapshot, initializeMediaLibrary, setLocalNickname, subscribeMediaLibrary } from "./media/library";
import { PanelDivider } from "./pencil/PanelDivider";
import { CameraAdvancedSettings } from "./CameraAdvancedSettings";
import { CameraLevelPermission } from "./CameraLevel.jsx";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureCameraSettings.css";
import "./cameraForms.css";

function SettingsIcon({ kind }) {
  const paths = {
    person: "M16 5.5c3 0 5 2.2 5 5s-2 5-5 5-5-2.2-5-5 2-5 5-5zM7.5 27c.6-5.3 3.6-8.2 8.5-8.2s7.9 2.9 8.5 8.2",
    camera: "M5.5 10.2c2.1-.4 4.2-.5 6.1-.5l1.8-3.2c2.4-.3 4.7-.3 7.1.1l1.5 3.2c1.8 0 3.1.1 4.4.4l.3 15.4c-6.8.8-14.2.8-21.3-.1zM16.1 13c-3.4 0-5.9 2.5-5.9 5.8s2.5 5.9 5.9 5.9 5.8-2.6 5.8-5.9S19.5 13 16.1 13z",
    audio: "M7 13h5l5-5v16l-5-5H7zM21 12c1.4 2.2 1.4 5.8 0 8M24 9.5c2.8 3.7 2.8 9.3 0 13",
    location: "M16 28c-1.6-2.5-7.4-9.4-7.4-15.3 0-4.3 3-7.4 7.4-7.4s7.4 3.1 7.4 7.4C23.4 18.6 17.6 25.5 16 28zM16 9.2c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5S18 9.2 16 9.2z",
    grid: "M6 6v20M16 6v20M26 6v20M6 6h20M6 16h20M6 26h20",
    device: "M8 5.5h16v21H8zM12 9h8M13 23h6",
    storage: "M6 9c0-2 4.5-3.5 10-3.5S26 7 26 9s-4.5 3.5-10 3.5S6 11 6 9zM6 9v7c0 2 4.5 3.5 10 3.5S26 18 26 16V9M6 16v7c0 2 4.5 3.5 10 3.5S26 25 26 23v-7",
    permission: "M16 5.5c5.5 0 9.5 3.5 9.5 8.2 0 7-6 11.5-9.5 13.2-3.5-1.7-9.5-6.2-9.5-13.2C6.5 9 10.5 5.5 16 5.5zM11.5 15l3 3 6-6",
    check: "M8 16.5l5 5L24 9",
    chevron: "M9 12l7 7 7-7",
  };
  return <PencilIcon kind={kind}><path d={paths[kind]} /></PencilIcon>;
}

function permissionLabel(value, en) {
  return { granted: en ? "Granted" : "已允许", denied: en ? "Denied" : "已拒绝",
    prompt: en ? "Ask when used" : "使用时询问", unsupported: en ? "Unknown" : "未知" }[value] ?? (en ? "Unknown" : "未知");
}

function capabilityLabel(value, en) {
  if (value === true) return en ? "Available" : "可用";
  if (value === false) return en ? "Unavailable" : "不可用";
  return en ? "Unknown" : "未知";
}

function DeviceInformation({ en, snapshot }) {
  const [info, setInfo] = useState({ camera: null, microphone: null, devices: [], permissions: {}, storage: null });
  useEffect(() => {
    let current = true;
    const read = async () => {
      let devices = [];
      try { devices = await navigator.mediaDevices?.enumerateDevices?.() ?? []; } catch { /* Unknown remains unknown. */ }
      const permissions = {};
      if (navigator.permissions?.query) {
        for (const name of ["camera", "microphone", "geolocation"]) {
          try { permissions[name] = (await navigator.permissions.query({ name })).state; }
          catch { permissions[name] = "unsupported"; }
        }
      }
      let storage = null;
      try { storage = await navigator.storage?.estimate?.() ?? null; } catch { /* Unknown remains unknown. */ }
      if (!current) return;
      setInfo({
        camera: devices.some(device => device.kind === "videoinput") ? true : null,
        microphone: devices.some(device => device.kind === "audioinput") ? true : null,
        devices: devices.filter(device => ["videoinput", "audioinput"].includes(device.kind)),
        permissions,
        storage,
      });
    };
    read();
    return () => { current = false; };
  }, []);
  const storageText = Number.isFinite(info.storage?.quota)
    ? `${Math.round((info.storage.usage ?? 0) / 1024 / 1024)} MB / ${Math.round(info.storage.quota / 1024 / 1024)} MB`
    : en ? "Unknown" : "未知";
  const rows = [
    [en ? "Local photographer ID" : "本机摄影者 ID", snapshot.identity?.id || (en ? "Unknown" : "未知")],
    [en ? "Camera capability" : "摄像头能力", capabilityLabel(info.camera, en)],
    [en ? "Microphone capability" : "麦克风能力", capabilityLabel(info.microphone, en)],
    [en ? "Camera permission" : "相机权限", permissionLabel(info.permissions.camera, en)],
    [en ? "Microphone permission" : "麦克风权限", permissionLabel(info.permissions.microphone, en)],
    [en ? "Location permission" : "位置权限", permissionLabel(info.permissions.geolocation, en)],
    [en ? "Local storage use" : "本地存储占用", storageText],
  ];
  return <div className="trip-camera-device-list">
    {rows.map(([label, value], index) => <div className="trip-camera-device-row" key={label}>
      <SettingsIcon kind={index === 0 ? "person" : index === rows.length - 1 ? "storage" : "permission"} />
      <dl><dt><PencilText>{label}</PencilText></dt><dd><PencilText>{value}</PencilText></dd></dl>
      {index < rows.length - 1 && <PanelDivider />}
    </div>)}
    {info.devices.map((device, index) => <div className="trip-camera-device-row" key={`${device.kind}:${device.deviceId || index}`}>
      <SettingsIcon kind={device.kind === "videoinput" ? "camera" : "audio"} />
      <dl><dt><PencilText>{device.kind === "videoinput" ? en ? "Camera device" : "摄像头设备" : en ? "Microphone device" : "麦克风设备"}</PencilText></dt>
        <dd><PencilText>{device.label || device.deviceId || (en ? "Identity hidden until permission is granted" : "授权前设备标识不可见")}</PencilText></dd></dl>
    </div>)}
  </div>;
}

export function AdventureCameraSettings({ view = "settings", onOpenDevice }) {
  const { language, cameraFacing, setCameraFacing, cameraAudio, setCameraAudio } = useAdventurePreferences();
  const { captureLocation, setCaptureLocation } = useCameraLocationPreference();
  const { cameraGrid, setCameraGrid } = useCameraGridPreference();
  const en = language === "en";
  const [snapshot, setSnapshot] = useState(getMediaSnapshot);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const composingRef = useRef(false);
  const mountedRef = useRef(false);
  const previousViewRef = useRef(view);
  const languageRef = useRef(en);
  languageRef.current = en;
  const autosaveRef = useRef(null);
  if (!autosaveRef.current) autosaveRef.current = createCameraNicknameAutosave({
    save: setLocalNickname,
    onStatus: status => {
      if (!mountedRef.current) return;
      const english = languageRef.current;
      setMessage({ invalid: english ? "Photographer name cannot be empty." : "摄影者昵称不能为空。",
        saving: "", saved: "",
        error: english ? "Could not save the name." : "无法保存昵称。" }[status] ?? "");
    },
  });

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = subscribeMediaLibrary(setSnapshot);
    initializeMediaLibrary().catch(() => { /* The snapshot reports storage errors. */ });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const value = snapshot.identity?.nickname ?? "";
    const synced = autosaveRef.current.sync(value);
    if (synced.adopt) setNickname(synced.value);
  }, [snapshot.identity?.nickname]);

  useEffect(() => {
    if (previousViewRef.current === "settings" && view !== "settings") {
      autosaveRef.current.flush();
    }
    previousViewRef.current = view;
  }, [view]);

  useEffect(() => () => { autosaveRef.current.dispose(); }, []);

  if (view === "device") return <section className="trip-camera-settings" aria-label={en ? "Device information" : "设备信息"}>
    <DeviceInformation en={en} snapshot={snapshot} />
  </section>;

  return <section className="trip-camera-settings" aria-label={en ? "Camera settings" : "相机设置"}>
    <div className="trip-camera-settings-section">
      <label className="trip-camera-form-label" htmlFor="trip-camera-nickname"><span className="trip-camera-form-label-icon"><SettingsIcon kind="person" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Photographer name" : "摄影者昵称"}</PencilText></span></label>
      <PencilSurface className="trip-camera-settings-field"><input id="trip-camera-nickname" value={nickname} maxLength={60} autoComplete="nickname"
        disabled={snapshot.status !== "ready"}
        onCompositionStart={() => {
          composingRef.current = true;
          autosaveRef.current.cancelPending();
        }}
        onCompositionEnd={event => {
          composingRef.current = false;
          autosaveRef.current.edit(event.currentTarget.value);
        }}
        onChange={event => {
          setNickname(event.target.value);
          setMessage("");
          autosaveRef.current.edit(event.target.value);
          if (composingRef.current) autosaveRef.current.cancelPending();
        }}
        onBlur={event => {
          composingRef.current = false;
          autosaveRef.current.edit(event.currentTarget.value, { immediate: true });
        }} /></PencilSurface>
      {message && <p className="trip-camera-settings-status" role="status"><PencilText>{message}</PencilText></p>}
      <PanelDivider />
    </div>
    <div className="trip-camera-settings-section">
      <label className="trip-camera-form-label" htmlFor="trip-camera-facing"><span className="trip-camera-form-label-icon"><SettingsIcon kind="camera" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Default camera" : "默认摄像头"}</PencilText></span></label>
      <PencilSurface className="trip-camera-settings-field trip-camera-settings-select"><select id="trip-camera-facing" value={cameraFacing} onChange={event => setCameraFacing(event.target.value)}>
        <option value="environment">{en ? "Rear camera" : "后置摄像头"}</option>
        <option value="user">{en ? "Front camera" : "前置摄像头"}</option>
      </select><SettingsIcon kind="chevron" /></PencilSurface>
      <PanelDivider />
    </div>
    <div className="trip-camera-settings-section">
      <label className="trip-camera-settings-toggle trip-camera-form-label">
        <span className="trip-camera-form-label-icon"><SettingsIcon kind="audio" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Record audio with video" : "录像收音"}</PencilText></span>
        <PencilSurface as="span" variant="quiet" className="trip-camera-checkbox"><input type="checkbox" checked={cameraAudio}
          aria-label={en ? "Record audio with video" : "录像收音"} onChange={event => setCameraAudio(event.target.checked)} />
          {cameraAudio && <SettingsIcon kind="check" />}</PencilSurface>
      </label>
      <PanelDivider />
    </div>
    <div className="trip-camera-settings-section">
      <label className="trip-camera-settings-toggle trip-camera-form-label">
        <span className="trip-camera-form-label-icon"><SettingsIcon kind="location" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Capture location" : "拍摄定位"}</PencilText></span>
        <PencilSurface as="span" variant="quiet" className="trip-camera-checkbox"><input type="checkbox" checked={captureLocation}
          aria-label={en ? "Capture location" : "拍摄定位"} onChange={event => {
            if (event.target.checked) cameraPermissionPromptGate.allowNextRequest("geolocation");
            setCaptureLocation(event.target.checked);
          }} />
          {captureLocation && <SettingsIcon kind="check" />}</PencilSurface>
      </label>
      <PanelDivider />
    </div>
    <div className="trip-camera-settings-section">
      <label className="trip-camera-settings-toggle trip-camera-form-label">
        <span className="trip-camera-form-label-icon"><SettingsIcon kind="grid" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Composition grid" : "构图九宫格"}</PencilText></span>
        <PencilSurface as="span" variant="quiet" className="trip-camera-checkbox"><input type="checkbox" checked={cameraGrid}
          aria-label={en ? "Composition grid" : "构图九宫格"} onChange={event => setCameraGrid(event.target.checked)} />
          {cameraGrid && <SettingsIcon kind="check" />}</PencilSurface>
      </label>
      <CameraLevelPermission enabled={cameraGrid} en={en} />
      <PanelDivider />
    </div>
    <CameraAdvancedSettings en={en} />
    {snapshot.status === "error" && <p role="alert"><PencilText>{en ? "Local storage unavailable." : "本地存储不可用。"}</PencilText></p>}
  </section>;
}
