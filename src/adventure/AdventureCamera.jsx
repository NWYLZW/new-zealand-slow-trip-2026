import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { initializeMediaLibrary, saveCapturedMedia, saveUploadedMedia } from "./media/library";
import { useAdventurePreferences } from "./AdventurePreferences";
import { cameraPermissionPromptGate, observeBrowserPermission } from "./cameraPermissionLifecycle";
import { useCameraIconOrientation } from "./cameraIconOrientation";
import { useCameraGridPreference, useCameraLocationPreference } from "./cameraPreferences";
import { CameraPencilLabel } from "./CameraPencilLabel";
import { CameraLevel, useCameraLevel } from "./CameraLevel.jsx";
import { captureCameraPhoto, requestCameraPreview } from "./cameraCapture";
import { CameraShutterIcon } from "./CameraShutterIcon";
import { useCameraHardware } from "./cameraHardware";
import { CameraHardwareControls } from "./CameraHardwareControls";
import { CameraIcon, PhotoAlbumIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import "./AdventureCamera.css";

const HOLD_TO_RECORD_MS = 1000;
const SYNTHETIC_CLICK_WINDOW_MS = 650;
const RESULT_MESSAGE_DURATION_MS = 4000;

function stopTracks(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

function cameraError(error, en) {
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError")
    return en ? "Camera permission was denied." : "相机权限被拒绝。";
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError")
    return en ? "No camera is available." : "没有可用相机。";
  if (error?.name === "NotReadableError")
    return en ? "Camera is busy in another app." : "相机正被其他应用占用。";
  return en ? "Could not start the camera." : "无法启动相机。";
}

function recordingMimeType() {
  const supported = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return supported.find(type => MediaRecorder.isTypeSupported?.(type)) ?? "";
}

function formatElapsed(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function useBrowserPermission(name) {
  const [state, setState] = useState("checking");
  useEffect(() => {
    return observeBrowserPermission(name, next => {
      cameraPermissionPromptGate.noteChange(name, next);
      setState(next);
    });
  }, [name]);
  return state;
}

export function AdventureCamera({ active, onOpenAlbum }) {
  const { language } = useLanguage();
  const en = language === "en";
  const { cameraFacing, setCameraFacing, cameraAudio } = useAdventurePreferences();
  const { captureLocation } = useCameraLocationPreference();
  const { cameraGrid } = useCameraGridPreference();
  const cameraPermission = useBrowserPermission("camera");
  const locationPermission = useBrowserPermission("geolocation");
  const [previewState, setPreviewState] = useState("idle");
  const [previewFacing, setPreviewFacing] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordPending, setRecordPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState("");
  const messageTimerRef = useRef(0);
  const [systemCameraBusy, setSystemCameraBusy] = useState(false);
  const [facingSwitchBusy, setFacingSwitchBusy] = useState(false);
  const [cameraCount, setCameraCount] = useState(null);
  const [videoTrack, setVideoTrack] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoAttemptRef = useRef(null);
  const cameraRef = useRef(null), videoRef = useRef(null), systemCameraRef = useRef(null);
  const previewStreamRef = useRef(null), micStreamRef = useRef(null), recorderRef = useRef(null);
  const sessionRef = useRef(0), recordAttemptRef = useRef(0), holdTimerRef = useRef(0), elapsedTimerRef = useRef(0);
  const clickSuppressionTimerRef = useRef(0);
  const heldPointerRef = useRef(null), longHoldRef = useRef(false), suppressClickRef = useRef(false);
  const recordIntentRef = useRef(false);
  const locationFixRef = useRef(null), locationWatchRef = useRef(null), locationAttemptRef = useRef(0);
  const locationRefreshTimerRef = useRef(0);
  const locationAutoAttemptedRef = useRef(false), locationDeniedRef = useRef(false);
  const automaticStartTimerRef = useRef(0);
  const automaticStartAttemptedRef = useRef(false);
  const activeRef = useRef(active), mountedRef = useRef(false);
  activeRef.current = active;
  useCameraIconOrientation(active, cameraRef);
  const level = useCameraLevel(active && previewState === "ready" && cameraGrid);

  const clearMessage = useCallback(() => {
    clearTimeout(messageTimerRef.current);
    messageTimerRef.current = 0;
    if (mountedRef.current) setMessage("");
  }, []);
  const showMessage = useCallback((text, duration = 0) => {
    if (!mountedRef.current || !activeRef.current || document.hidden) return;
    clearTimeout(messageTimerRef.current);
    messageTimerRef.current = 0;
    setMessage(text);
    if (text && duration > 0) {
      const timer = window.setTimeout(() => {
        if (messageTimerRef.current !== timer) return;
        messageTimerRef.current = 0;
        if (mountedRef.current) setMessage("");
      }, duration);
      messageTimerRef.current = timer;
    }
  }, []);
  const onHardwareError = useCallback(error => showMessage(typeof error === "string" ? error
    : en ? "Could not apply the camera setting." : "无法应用相机设置。"), [en, showMessage]);
  const hardware = useCameraHardware({ track: videoTrack, active: active && previewState === "ready",
    recording, disabled: photoBusy || facingSwitchBusy || systemCameraBusy || recordPending, onError: onHardwareError });

  const stopRecording = useCallback(() => {
    recordAttemptRef.current += 1;
    recordIntentRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    let awaitingStop = false;
    if (recorder?.state === "recording" || recorder?.state === "paused") {
      try { recorder.stop(); awaitingStop = true; } catch { /* A recorder may stop as its tracks end. */ }
    }
    // Keep audio alive until MediaRecorder emits its final data and onstop.
    if (!awaitingStop) {
      stopTracks(micStreamRef.current);
      micStreamRef.current = null;
    }
    clearInterval(elapsedTimerRef.current);
    if (mountedRef.current) {
      setRecording(false);
      setRecordPending(false);
    }
  }, []);

  const stopAll = useCallback(() => {
    sessionRef.current += 1;
    clearMessage();
    clearTimeout(automaticStartTimerRef.current);
    clearTimeout(holdTimerRef.current);
    clearTimeout(clickSuppressionTimerRef.current);
    heldPointerRef.current = null;
    longHoldRef.current = false;
    suppressClickRef.current = false;
    stopRecording();
    stopTracks(previewStreamRef.current);
    previewStreamRef.current = null;
    photoAttemptRef.current = null;
    if (mountedRef.current) { setVideoTrack(null); setPhotoBusy(false); }
    stopTracks(micStreamRef.current);
    micStreamRef.current = null;
    locationAttemptRef.current += 1;
    clearInterval(locationRefreshTimerRef.current);
    if (locationWatchRef.current !== null) navigator.geolocation?.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    locationFixRef.current = null;
    if (!locationDeniedRef.current) locationAutoAttemptedRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) setPreviewState("idle");
  }, [clearMessage, stopRecording]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stopAll(); };
  }, [stopAll]);

  useLayoutEffect(() => {
    if (!active) {
      locationAutoAttemptedRef.current = false;
      stopAll();
    }
    else initializeMediaLibrary().catch(() => showMessage(en ? "Local media storage is unavailable." : "本地媒体存储不可用。"));
  }, [active, en, showMessage, stopAll]);

  const startPreview = useCallback(async (userInitiated = false, requestedFacing = cameraFacing, requireFacingMatch = false) => {
    if (!activeRef.current) return false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setPreviewState("unsupported");
      showMessage(en ? "This browser does not support camera access." : "此浏览器不支持相机访问。");
      return false;
    }
    if (!userInitiated && !cameraPermissionPromptGate.canAutoRequest("camera", cameraPermission)) {
      if (cameraPermission === "denied") {
        setPreviewState("error");
        showMessage(en ? "Camera permission was denied." : "相机权限被拒绝。");
      }
      return false;
    }
    cameraPermissionPromptGate.noteRequest("camera", cameraPermission, { userInitiated });
    stopAll();
    const session = ++sessionRef.current;
    setPreviewState("requesting");
    showMessage("");
    try {
      const stream = await requestCameraPreview({ mediaDevices: navigator.mediaDevices, facingMode: requestedFacing,
        isCurrent: () => session === sessionRef.current && activeRef.current && !document.hidden });
      const reportedFacing = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
      if (requireFacingMatch && ["user", "environment"].includes(reportedFacing) && reportedFacing !== requestedFacing) {
        stopTracks(stream);
        const mismatch = new Error(`Requested ${requestedFacing} camera, received ${reportedFacing}.`);
        mismatch.name = "CameraFacingMismatchError";
        throw mismatch;
      }
      if (session !== sessionRef.current || !activeRef.current || document.hidden) {
        stopTracks(stream);
        return false;
      }
      previewStreamRef.current = stream;
      setPreviewFacing(reportedFacing || requestedFacing);
      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          if (previewStreamRef.current !== stream) return;
          stopAll();
          showMessage(en ? "Camera connection ended." : "相机连接已结束。");
        };
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* Muted inline preview can wait for a user tap. */ }
      }
      if (session !== sessionRef.current || !activeRef.current || document.hidden) {
        stopTracks(stream);
        if (previewStreamRef.current === stream) previewStreamRef.current = null;
        return false;
      }
      setPreviewState("ready");
      setVideoTrack(stream.getVideoTracks()[0] ?? null);
      if (navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            if (session === sessionRef.current && activeRef.current)
              setCameraCount(devices.filter(device => device.kind === "videoinput").length);
          })
          .catch(() => setCameraCount(null));
      }
      return true;
    } catch (error) {
      if (session !== sessionRef.current || !activeRef.current) return false;
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError")
        cameraPermissionPromptGate.blockAutomatic("camera");
      setPreviewState("error");
      showMessage(cameraError(error, en));
      return false;
    }
  }, [cameraFacing, cameraPermission, en, showMessage, stopAll]);

  useEffect(() => {
    if (cameraPermission === "granted" && active && !previewStreamRef.current)
      automaticStartAttemptedRef.current = false;
  }, [active, cameraPermission]);

  useEffect(() => {
    clearTimeout(automaticStartTimerRef.current);
    if (!active) {
      automaticStartAttemptedRef.current = false;
      return undefined;
    }
    if (cameraPermission === "checking" || automaticStartAttemptedRef.current || document.hidden) return undefined;
    automaticStartTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current || document.hidden || previewStreamRef.current) return;
      automaticStartAttemptedRef.current = true;
      startPreview(false);
    }, 0);
    return () => clearTimeout(automaticStartTimerRef.current);
  }, [active, startPreview]);

  useEffect(() => {
    const visibilityChanged = () => {
      clearTimeout(automaticStartTimerRef.current);
      if (document.hidden) {
        automaticStartAttemptedRef.current = false;
        if (!locationDeniedRef.current) locationAutoAttemptedRef.current = false;
        stopAll();
        return;
      }
      if (!activeRef.current || automaticStartAttemptedRef.current) return;
      automaticStartTimerRef.current = window.setTimeout(() => {
        if (!activeRef.current || document.hidden || previewStreamRef.current) return;
        automaticStartAttemptedRef.current = true;
        startPreview(false);
      }, 0);
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("pagehide", stopAll);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", stopAll);
    };
  }, [startPreview, stopAll]);

  const freshGps = () => {
    const fix = locationFixRef.current;
    return fix && Date.now() - fix.timestamp <= 60_000
      ? { lat: fix.lat, lng: fix.lng, accuracyMeters: fix.accuracyMeters } : null;
  };

  const stopLocation = useCallback(() => {
    locationAttemptRef.current += 1;
    clearInterval(locationRefreshTimerRef.current);
    if (locationWatchRef.current !== null) navigator.geolocation?.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    locationFixRef.current = null;
  }, []);

  const requestLocation = useCallback((userInitiated = false) => {
    if (!activeRef.current || !navigator.geolocation) {
      return;
    }
    if (locationWatchRef.current !== null) return;
    if (!userInitiated && !cameraPermissionPromptGate.canAutoRequest("geolocation", locationPermission)) return;
    cameraPermissionPromptGate.noteRequest("geolocation", locationPermission, { userInitiated });
    const session = sessionRef.current;
    const attempt = ++locationAttemptRef.current;
    const updateFix = position => {
      if (attempt !== locationAttemptRef.current || !activeRef.current
        || session !== sessionRef.current) return;
      locationFixRef.current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        timestamp: position.timestamp,
      };
    };
    const locationError = error => {
      if (attempt !== locationAttemptRef.current) return;
      if (error?.code === 3) {
        return;
      }
      if (error?.code === 1) {
        locationDeniedRef.current = true;
        cameraPermissionPromptGate.blockAutomatic("geolocation");
      }
      if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
      locationAttemptRef.current += 1;
      clearInterval(locationRefreshTimerRef.current);
      locationFixRef.current = null;
    };
    try { locationWatchRef.current = navigator.geolocation.watchPosition(updateFix, locationError,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }); }
    catch { locationError(); }
    if (locationWatchRef.current !== null) {
      // A stationary watch may not emit another fix; refresh it while opted in.
      locationRefreshTimerRef.current = window.setInterval(() => {
        if (attempt !== locationAttemptRef.current) return;
        try {
          navigator.geolocation.getCurrentPosition(updateFix, error => {
            if (error?.code === 1) locationError(error);
          }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 });
        } catch { locationError(); }
      }, 45_000);
    }
  }, [locationPermission]);

  const previousLocationPermissionRef = useRef("checking");
  useEffect(() => {
    const previous = previousLocationPermissionRef.current;
    previousLocationPermissionRef.current = locationPermission;
    if (locationPermission === "granted") {
      locationDeniedRef.current = false;
      locationAutoAttemptedRef.current = false;
      return;
    }
    if (locationPermission === "denied" || previous === "granted") {
      locationDeniedRef.current = true;
      stopLocation();
    }
  }, [locationPermission, stopLocation]);

  useEffect(() => {
    if (!captureLocation) {
      locationAutoAttemptedRef.current = false;
      locationDeniedRef.current = false;
      stopLocation();
      return;
    }
    if (!active || previewState !== "ready" || document.hidden || locationPermission === "checking"
      || locationDeniedRef.current || locationAutoAttemptedRef.current) return;
    if (!cameraPermissionPromptGate.canAutoRequest("geolocation", locationPermission)) return;
    locationAutoAttemptedRef.current = true;
    requestLocation(false);
  }, [active, captureLocation, locationPermission, previewState, requestLocation, stopLocation]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const track = previewStreamRef.current?.getVideoTracks()[0];
    if (!activeRef.current || !track || !video?.videoWidth || photoAttemptRef.current || hardware.busy || !hardware.ready
      || recorderRef.current || recordIntentRef.current) return;
    const session = sessionRef.current;
    const attempt = {};
    photoAttemptRef.current = attempt;
    setPhotoBusy(true);
    clearMessage();
    const isCurrent = () => session === sessionRef.current && activeRef.current && !document.hidden
      && previewStreamRef.current?.getVideoTracks()[0] === track && photoAttemptRef.current === attempt;
    const report = (text, duration = 0) => { if (session === sessionRef.current) showMessage(text, duration); };
    const captured = new Date();
    const gps = freshGps();
    let capturedBlob = false;
    try {
      const photoSettings = hardware.photoSettings;
      const { blob, source } = await captureCameraPhoto({ track, video, isCurrent, photoSettings });
      if (!isCurrent()) return;
      capturedBlob = true;
      const saved = await saveCapturedMedia({ blob, capturedAt: captured.toISOString(),
        captureOffsetMinutes: -captured.getTimezoneOffset(), gps });
      report(saved.status === "duplicate"
        ? en ? "This photo is already in the album." : "这张照片已在相册中。"
        : source === "video-frame"
          ? photoSettings.fillLightMode && photoSettings.fillLightMode !== "off"
            ? en ? "Saved a preview frame; still capture and flash were unavailable." : "已保存预览帧，原片拍摄及闪光灯未能生效。"
            : en ? "Saved a preview frame; full-resolution capture was unavailable." : "已保存预览帧，当前无法获取高分辨率照片。"
          : en ? "Photo saved to the local album." : "照片已保存到本地相册。", RESULT_MESSAGE_DURATION_MS);
    } catch (error) {
      if (error?.name !== "AbortError") report(capturedBlob
        ? en ? "Could not save photo; local storage may be full." : "无法保存照片，本地存储空间可能已满。"
        : en ? "Could not capture a photo." : "无法拍摄照片。");
    } finally {
      if (photoAttemptRef.current === attempt) {
        photoAttemptRef.current = null;
        if (mountedRef.current) setPhotoBusy(false);
      }
    }
  };

  const startRecording = async () => {
    if (!activeRef.current || !previewStreamRef.current || photoAttemptRef.current || hardware.busy || !hardware.ready
      || recorderRef.current || recordIntentRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      showMessage(en ? "Video recording is not supported here." : "此浏览器不支持视频录制。");
      return;
    }
    recordIntentRef.current = true;
    const attempt = ++recordAttemptRef.current;
    setRecordPending(true);
    clearMessage();
    const session = sessionRef.current;
    const report = (text, duration = 0) => { if (session === sessionRef.current) showMessage(text, duration); };
    let mic = null;
    let silent = false;
    if (cameraAudio) {
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        silent = true;
      }
    }
    if (!recordIntentRef.current || attempt !== recordAttemptRef.current || session !== sessionRef.current || !activeRef.current
      || document.hidden) {
      stopTracks(mic);
      if (attempt === recordAttemptRef.current && mountedRef.current) setRecordPending(false);
      return;
    }
    try {
      const stream = new MediaStream([...previewStreamRef.current.getVideoTracks(), ...(mic?.getAudioTracks() ?? [])]);
      const mimeType = recordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const captured = new Date();
      const gps = freshGps();
      const chunks = [];
      let failed = false;
      micStreamRef.current = mic;
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => {
        failed = true;
        if (recorderRef.current === recorder) stopRecording();
        report(en ? "Video recording failed." : "视频录制失败。");
      };
      recorder.onstop = async () => {
        stopTracks(mic);
        if (micStreamRef.current === mic) micStreamRef.current = null;
        if (recorderRef.current === recorder) {
          recorderRef.current = null;
          recordIntentRef.current = false;
          clearInterval(elapsedTimerRef.current);
          if (mountedRef.current) { setRecording(false); setRecordPending(false); }
        }
        if (failed) return;
        if (!chunks.length) { report(en ? "No video was recorded." : "没有录到视频。"); return; }
        const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0].type || "video/webm" });
        try {
          const saved = await saveCapturedMedia({ blob, capturedAt: captured.toISOString(),
            captureOffsetMinutes: -captured.getTimezoneOffset(), gps });
          report(saved.status === "duplicate"
            ? en ? "This video is already in the album." : "这段视频已在相册中。"
            : en ? "Video saved to the local album." : "视频已保存到本地相册。", RESULT_MESSAGE_DURATION_MS);
        } catch {
          report(en ? "Could not save video; local storage may be full." : "无法保存视频，本地存储空间可能已满。");
        }
      };
      recorder.start(250);
      const startedAt = Date.now();
      setElapsed(0);
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
      setRecording(true);
      setRecordPending(false);
      if (silent) report(en ? "Microphone unavailable; recording silent video." : "麦克风不可用，将录制无声视频。");
    } catch {
      stopTracks(mic);
      micStreamRef.current = null;
      recorderRef.current = null;
      recordIntentRef.current = false;
      setRecordPending(false);
      report(en ? "Could not start video recording." : "无法开始录制视频。");
    }
  };

  const suppressSyntheticClick = () => {
    suppressClickRef.current = true;
    clearTimeout(clickSuppressionTimerRef.current);
    clickSuppressionTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, SYNTHETIC_CLICK_WINDOW_MS);
  };

  const beginHold = event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (previewState !== "ready" || photoAttemptRef.current || heldPointerRef.current !== null
      || recorderRef.current || recordIntentRef.current) return;
    suppressClickRef.current = false;
    clearTimeout(clickSuppressionTimerRef.current);
    heldPointerRef.current = event.pointerId;
    longHoldRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      if (heldPointerRef.current !== event.pointerId) return;
      longHoldRef.current = true;
      startRecording();
    }, HOLD_TO_RECORD_MS);
  };

  const endHold = event => {
    if (heldPointerRef.current !== event.pointerId) return;
    heldPointerRef.current = null;
    clearTimeout(holdTimerRef.current);
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* Capture may already be released. */ }
    if (event.type === "pointerup" && !longHoldRef.current) capturePhoto();
    suppressSyntheticClick();
    longHoldRef.current = false;
  };

  const beginKeyboardHold = event => {
    if (![" ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || previewState !== "ready" || photoAttemptRef.current || heldPointerRef.current !== null) return;
    if (recorderRef.current || recordIntentRef.current) {
      heldPointerRef.current = `stop:${event.key}`;
      return;
    }
    const key = `key:${event.key}`;
    heldPointerRef.current = key;
    longHoldRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      if (heldPointerRef.current !== key) return;
      longHoldRef.current = true;
      startRecording();
    }, HOLD_TO_RECORD_MS);
  };

  const endKeyboardHold = event => {
    if (![" ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (heldPointerRef.current === `stop:${event.key}`) {
      heldPointerRef.current = null;
      stopRecording();
      suppressSyntheticClick();
      return;
    }
    if (heldPointerRef.current !== `key:${event.key}`) return;
    heldPointerRef.current = null;
    clearTimeout(holdTimerRef.current);
    if (!longHoldRef.current) capturePhoto();
    suppressSyntheticClick();
    longHoldRef.current = false;
  };

  const importSystemCameraMedia = async event => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || !activeRef.current) return;
    setSystemCameraBusy(true);
    clearMessage();
    try {
      const result = await saveUploadedMedia(file);
      showMessage(result.status === "duplicate"
        ? en ? "This capture is already in the album." : "这次拍摄已在相册中。"
        : en ? "System camera capture added to the local album." : "系统相机拍摄内容已加入本地相册。", RESULT_MESSAGE_DURATION_MS);
    } catch {
      showMessage(en ? "Could not import the system camera capture." : "无法导入系统相机拍摄内容。");
    }
    if (mountedRef.current) setSystemCameraBusy(false);
  };

  const openAlbum = () => {
    stopAll();
    onOpenAlbum?.();
  };

  const switchCameraFacing = async () => {
    if (!activeRef.current || previewState !== "ready" || photoAttemptRef.current || facingSwitchBusy || recording || recordPending
      || recorderRef.current || recordIntentRef.current) return;
    if (cameraCount === 1) {
      showMessage(en ? "Only one camera is available on this device." : "此设备只检测到一个相机。");
      return;
    }
    const previousFacing = cameraFacing;
    const nextFacing = previousFacing === "environment" ? "user" : "environment";
    setFacingSwitchBusy(true);
    const switched = await startPreview(true, nextFacing, true);
    if (switched) {
      setCameraFacing(nextFacing);
    } else if (activeRef.current) {
      const restored = await startPreview(true, previousFacing);
      showMessage(restored
        ? en ? "Could not switch cameras; the previous camera was restored." : "无法切换镜头，已恢复原镜头。"
        : en ? "Could not switch cameras or restore the previous camera." : "无法切换镜头，也无法恢复原镜头。");
    }
    if (mountedRef.current) setFacingSwitchBusy(false);
  };

  return <section ref={cameraRef} className="trip-camera" aria-label={en ? "Camera" : "相机"} data-recording={recording || recordPending}>
      <div className="trip-camera-preview">
        <video ref={videoRef} data-facing={previewFacing} autoPlay muted playsInline
          aria-label={en ? "Live camera preview" : "相机实时取景"} />
        {active && previewState === "ready" && cameraGrid && <CameraLevel reading={level.reading} en={en} />}
        {previewState !== "ready" && <div className="trip-camera-preview-state">
          <PencilText>{previewState === "requesting" ? en ? "Waiting for camera permission…" : "等待相机权限…"
            : previewState === "unsupported" ? en ? "Camera unavailable" : "相机不可用"
              : en ? "Camera is off" : "相机未开启"}</PencilText>
          <PencilSurface as="button" variant="action" onClick={() => startPreview(true)} disabled={!active || previewState === "requesting"}>
            <CameraIcon /><PencilText>{en ? "Start camera" : "开启相机"}</PencilText>
          </PencilSurface>
        </div>}
        {(recording || recordPending) && <CameraPencilLabel className="trip-camera-recording" textureKey="recording-timer" role="timer"
          aria-label={en ? "Recording time" : "录像时长"}>
          <PencilText>{recordPending ? en ? "Starting video…" : "正在准备录制…"
            : `${en ? "Recording" : "录制中"} ${formatElapsed(elapsed)}`}</PencilText>
        </CameraPencilLabel>}
      </div>
      <div className="trip-camera-status" aria-live="polite">
        {message && <CameraPencilLabel textureKey="camera-status" role="status"><PencilText>{message}</PencilText></CameraPencilLabel>}
      </div>
      {previewState === "ready" && <CameraHardwareControls controller={hardware} en={en} />}
      <div className="trip-camera-controls">
        <button type="button" className="trip-camera-control" data-icon-feedback="keyboard-only" onClick={openAlbum}
          aria-label={en ? "Album" : "相册"}>
          <PhotoAlbumIcon themeBackdrop />
        </button>
        <button type="button" className="trip-camera-control trip-camera-facing-toggle" data-icon-feedback="keyboard-only"
          onClick={switchCameraFacing}
          aria-label={cameraFacing === "environment"
            ? en ? "Switch to front camera" : "切换到前置相机"
            : en ? "Switch to rear camera" : "切换到后置相机"}
          disabled={!active || previewState !== "ready" || photoBusy || facingSwitchBusy || recording || recordPending}>
          <PencilIcon kind="camera-facing" themeBackdrop>
            <path d="M7 12c2.7-4.1 7.3-6.2 12.1-5.2 2.1.4 4 1.4 5.5 2.9M22.3 5.9l2.6 3.9-4.6 1" />
            <path d="M25 20c-2.7 4.1-7.3 6.2-12.1 5.2-2.1-.4-4-1.4-5.5-2.9M9.7 26.1l-2.6-3.9 4.6-1" />
            <path d="M12 12.5h8v7h-8zM14 12.5l1-2h2l1 2M16 14.4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z" />
          </PencilIcon>
        </button>
          <button type="button" className="trip-camera-shutter" data-icon-feedback="keyboard-only"
            disabled={previewState !== "ready" || !active || photoBusy || facingSwitchBusy || systemCameraBusy
              || (!recording && !recordPending && (!hardware.ready || hardware.busy))}
            onPointerDown={beginHold} onPointerUp={endHold} onPointerCancel={endHold} onLostPointerCapture={endHold}
            onKeyDown={beginKeyboardHold} onKeyUp={endKeyboardHold}
            onBlur={() => {
              if (typeof heldPointerRef.current !== "string") return;
              heldPointerRef.current = null;
              clearTimeout(holdTimerRef.current);
              if (longHoldRef.current) suppressSyntheticClick();
              longHoldRef.current = false;
            }}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                clearTimeout(clickSuppressionTimerRef.current);
                return;
              }
              if (recorderRef.current || recordIntentRef.current) stopRecording();
              else capturePhoto();
            }}
            aria-label={recording || recordPending ? en ? "Stop video recording" : "停止录制视频"
              : en ? "Take photo; hold to record video" : "拍照；长按录制视频"}
          >
            <CameraShutterIcon recording={recording || recordPending} />
          </button>
        <input ref={systemCameraRef} type="file" accept="image/*,video/*" hidden
          capture={cameraFacing === "user" ? "user" : "environment"} className="trip-camera-upload-input"
          onChange={importSystemCameraMedia} />
        <button type="button" className="trip-camera-control trip-camera-system-capture" data-icon-feedback="keyboard-only"
          onClick={() => systemCameraRef.current?.click()}
          aria-label={systemCameraBusy ? en ? "Importing system camera capture…" : "正在导入系统相机拍摄内容…"
            : en ? "Use system camera" : "使用系统相机"}
          disabled={systemCameraBusy || !active}><PencilIcon kind="system-camera" themeBackdrop>
            <path d="M9 3.8h14v24.4H9zM13 7h6M16 20.5c-2 0-3.5 1.5-3.5 3.4h7c0-1.9-1.5-3.4-3.5-3.4zM25.5 8.5h5M28 6v5" />
          </PencilIcon></button>
      </div>
  </section>;
}
