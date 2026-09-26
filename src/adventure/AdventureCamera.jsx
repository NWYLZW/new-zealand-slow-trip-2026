import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { initializeMediaLibrary, saveCapturedMedia, saveUploadedMedia } from "./media/library";
import { useAdventurePreferences } from "./AdventurePreferences";
import { cameraPermissionPromptGate, observeBrowserPermission } from "./cameraPermissionLifecycle";
import { useCameraLocationPreference } from "./cameraPreferences";
import { CameraIcon, LocationMapIcon, PhotoAlbumIcon, UploadIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilText } from "./pencil/PencilText";
import "./AdventureCamera.css";

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
  const { cameraFacing, cameraAudio } = useAdventurePreferences();
  const { captureLocation, setCaptureLocation } = useCameraLocationPreference();
  const cameraPermission = useBrowserPermission("camera");
  const locationPermission = useBrowserPermission("geolocation");
  const [previewState, setPreviewState] = useState("idle");
  const [recording, setRecording] = useState(false);
  const [recordPending, setRecordPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [locationState, setLocationState] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null), uploadRef = useRef(null);
  const previewStreamRef = useRef(null), micStreamRef = useRef(null), recorderRef = useRef(null);
  const sessionRef = useRef(0), recordAttemptRef = useRef(0), holdTimerRef = useRef(0), elapsedTimerRef = useRef(0);
  const heldPointerRef = useRef(null), longHoldRef = useRef(false), suppressPointerClickRef = useRef(false);
  const recordIntentRef = useRef(false);
  const locationFixRef = useRef(null), locationWatchRef = useRef(null), locationAttemptRef = useRef(0);
  const locationRefreshTimerRef = useRef(0);
  const locationAutoAttemptedRef = useRef(false), locationDeniedRef = useRef(false);
  const automaticStartTimerRef = useRef(0);
  const automaticStartAttemptedRef = useRef(false);
  const activeRef = useRef(active), mountedRef = useRef(false);
  activeRef.current = active;

  const showMessage = useCallback(text => {
    if (mountedRef.current && activeRef.current) setMessage(text);
  }, []);

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
    clearTimeout(automaticStartTimerRef.current);
    clearTimeout(holdTimerRef.current);
    heldPointerRef.current = null;
    longHoldRef.current = false;
    suppressPointerClickRef.current = false;
    stopRecording();
    stopTracks(previewStreamRef.current);
    previewStreamRef.current = null;
    stopTracks(micStreamRef.current);
    micStreamRef.current = null;
    locationAttemptRef.current += 1;
    clearInterval(locationRefreshTimerRef.current);
    if (locationWatchRef.current !== null) navigator.geolocation?.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    locationFixRef.current = null;
    if (!locationDeniedRef.current) locationAutoAttemptedRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) {
      setPreviewState("idle");
      setLocationState("");
    }
  }, [stopRecording]);

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

  const startPreview = useCallback(async (userInitiated = false) => {
    if (!activeRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setPreviewState("unsupported");
      setMessage(en ? "This browser does not support camera access." : "此浏览器不支持相机访问。");
      return;
    }
    if (!userInitiated && !cameraPermissionPromptGate.canAutoRequest("camera", cameraPermission)) {
      if (cameraPermission === "denied") {
        setPreviewState("error");
        setMessage(en ? "Camera permission was denied." : "相机权限被拒绝。");
      }
      return;
    }
    cameraPermissionPromptGate.noteRequest("camera", cameraPermission, { userInitiated });
    stopAll();
    const session = ++sessionRef.current;
    setPreviewState("requesting");
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: cameraFacing } }, audio: false });
      if (session !== sessionRef.current || !activeRef.current || document.hidden) {
        stopTracks(stream);
        return;
      }
      previewStreamRef.current = stream;
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
        return;
      }
      setPreviewState("ready");
    } catch (error) {
      if (session !== sessionRef.current || !activeRef.current) return;
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError")
        cameraPermissionPromptGate.blockAutomatic("camera");
      setPreviewState("error");
      setMessage(cameraError(error, en));
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

  const stopLocation = useCallback((state = "") => {
    locationAttemptRef.current += 1;
    clearInterval(locationRefreshTimerRef.current);
    if (locationWatchRef.current !== null) navigator.geolocation?.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    locationFixRef.current = null;
    if (mountedRef.current) setLocationState(state);
  }, []);

  const requestLocation = useCallback((userInitiated = false) => {
    if (!activeRef.current || !navigator.geolocation) {
      setLocationState(en ? "Location unavailable" : "无法获取位置");
      return;
    }
    if (locationWatchRef.current !== null) return;
    if (!userInitiated && !cameraPermissionPromptGate.canAutoRequest("geolocation", locationPermission)) return;
    cameraPermissionPromptGate.noteRequest("geolocation", locationPermission, { userInitiated });
    const session = sessionRef.current;
    const attempt = ++locationAttemptRef.current;
    setLocationState(en ? "Finding location…" : "正在定位…");
    const updateFix = position => {
      if (attempt !== locationAttemptRef.current || !activeRef.current
        || session !== sessionRef.current) return;
      locationFixRef.current = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        timestamp: position.timestamp,
      };
      setLocationState(en ? "Location on for captures" : "拍摄定位已开启");
    };
    const locationError = error => {
      if (attempt !== locationAttemptRef.current) return;
      if (error?.code === 3) {
        setLocationState(en ? "Waiting for a fresh location…" : "正在等待新的位置…");
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
      if (activeRef.current && session === sessionRef.current)
        setLocationState(en ? "Location unavailable" : "无法获取位置");
    };
    try { locationWatchRef.current = navigator.geolocation.watchPosition(updateFix, locationError,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }); }
    catch { setLocationState(en ? "Location unavailable" : "无法获取位置"); }
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
  }, [en, locationPermission]);

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
      stopLocation(en ? "Location permission required" : "需要位置权限");
    }
  }, [en, locationPermission, stopLocation]);

  useEffect(() => {
    if (!captureLocation) {
      locationAutoAttemptedRef.current = false;
      locationDeniedRef.current = false;
      stopLocation(en ? "Location off" : "拍摄定位已关闭");
      return;
    }
    if (!active || previewState !== "ready" || document.hidden || locationPermission === "checking"
      || locationDeniedRef.current || locationAutoAttemptedRef.current) return;
    if (!cameraPermissionPromptGate.canAutoRequest("geolocation", locationPermission)) return;
    locationAutoAttemptedRef.current = true;
    requestLocation(false);
  }, [active, captureLocation, en, locationPermission, previewState, requestLocation, stopLocation]);

  const toggleCaptureLocation = () => {
    if (captureLocation) {
      setCaptureLocation(false);
      return;
    }
    cameraPermissionPromptGate.allowNextRequest("geolocation");
    locationDeniedRef.current = false;
    locationAutoAttemptedRef.current = true;
    setCaptureLocation(true);
    requestLocation(true);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!activeRef.current || !previewStreamRef.current || !video?.videoWidth || recorderRef.current || recordIntentRef.current) return;
    const session = sessionRef.current;
    const report = text => { if (session === sessionRef.current) showMessage(text); };
    const captured = new Date();
    const gps = freshGps();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) { report(en ? "Could not capture a photo." : "无法拍摄照片。"); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .95));
    if (!blob) { report(en ? "Could not capture a photo." : "无法拍摄照片。"); return; }
    try {
      const saved = await saveCapturedMedia({ blob, capturedAt: captured.toISOString(),
        captureOffsetMinutes: -captured.getTimezoneOffset(), gps });
      report(saved.status === "duplicate"
        ? en ? "This photo is already in the album." : "这张照片已在相册中。"
        : en ? "Photo saved to the local album." : "照片已保存到本地相册。");
    } catch {
      report(en ? "Could not save photo; local storage may be full." : "无法保存照片，本地存储空间可能已满。");
    }
  };

  const startRecording = async () => {
    if (!activeRef.current || !previewStreamRef.current || recorderRef.current || recordIntentRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      showMessage(en ? "Video recording is not supported here." : "此浏览器不支持视频录制。");
      return;
    }
    recordIntentRef.current = true;
    const attempt = ++recordAttemptRef.current;
    setRecordPending(true);
    setMessage("");
    const session = sessionRef.current;
    const report = text => { if (session === sessionRef.current) showMessage(text); };
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
            : en ? "Video saved to the local album." : "视频已保存到本地相册。");
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

  const beginHold = event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    suppressPointerClickRef.current = false;
    if (previewState !== "ready" || heldPointerRef.current !== null
      || recorderRef.current || recordIntentRef.current) return;
    heldPointerRef.current = event.pointerId;
    longHoldRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      if (heldPointerRef.current !== event.pointerId) return;
      longHoldRef.current = true;
      startRecording();
    }, 350);
  };

  const endHold = event => {
    if (heldPointerRef.current !== event.pointerId) return;
    heldPointerRef.current = null;
    clearTimeout(holdTimerRef.current);
    if (event.type !== "pointerup") suppressPointerClickRef.current = true;
    if (longHoldRef.current) {
      suppressPointerClickRef.current = true;
      stopRecording();
      longHoldRef.current = false;
    }
  };

  const beginKeyboardHold = event => {
    if (![" ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || previewState !== "ready" || heldPointerRef.current !== null
      || recorderRef.current || recordIntentRef.current) return;
    const key = `key:${event.key}`;
    heldPointerRef.current = key;
    longHoldRef.current = false;
    holdTimerRef.current = window.setTimeout(() => {
      if (heldPointerRef.current !== key) return;
      longHoldRef.current = true;
      startRecording();
    }, 350);
  };

  const endKeyboardHold = event => {
    if (![" ", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (heldPointerRef.current !== `key:${event.key}`) return;
    heldPointerRef.current = null;
    clearTimeout(holdTimerRef.current);
    if (longHoldRef.current) stopRecording();
    else capturePhoto();
    longHoldRef.current = false;
  };

  const uploadFiles = async event => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length || !activeRef.current) return;
    setUploading(true);
    let added = 0, duplicates = 0, failed = 0;
    for (const file of files) {
      try {
        const result = await saveUploadedMedia(file);
        if (result.status === "duplicate") duplicates += 1;
        else added += 1;
      } catch { failed += 1; }
    }
    if (mountedRef.current) setUploading(false);
    showMessage(en ? `Added ${added}; ${duplicates} duplicate; ${failed} failed.`
      : `已加入 ${added} 项；重复 ${duplicates} 项；失败 ${failed} 项。`);
  };

  const openAlbum = () => {
    stopAll();
    onOpenAlbum?.();
  };

  return <section className="trip-camera" aria-label={en ? "Camera" : "相机"} data-recording={recording || recordPending}>
      <div className="trip-camera-preview">
        <video ref={videoRef} autoPlay muted playsInline aria-label={en ? "Live camera preview" : "相机实时取景"} />
        {previewState !== "ready" && <div className="trip-camera-preview-state">
          <PencilText>{previewState === "requesting" ? en ? "Waiting for camera permission…" : "等待相机权限…"
            : previewState === "unsupported" ? en ? "Camera unavailable" : "相机不可用"
              : en ? "Camera is off" : "相机未开启"}</PencilText>
          <PencilSurface as="button" variant="action" onClick={() => startPreview(true)} disabled={!active || previewState === "requesting"}>
            <CameraIcon /><PencilText>{en ? "Start camera" : "开启相机"}</PencilText>
          </PencilSurface>
        </div>}
        {previewState === "ready" && <button type="button" className="trip-camera-location"
          onClick={toggleCaptureLocation} aria-pressed={captureLocation}
          aria-label={captureLocation
            ? en ? "Turn off capture location" : "关闭拍摄定位"
            : en ? "Enable location for captures" : "开启拍摄定位"}
          title={captureLocation
            ? en ? "Turn off capture location" : "关闭拍摄定位"
            : en ? "Enable location for captures" : "开启拍摄定位"}><LocationMapIcon /></button>}
        {(recording || recordPending) && <span className="trip-camera-recording" role="timer"
          aria-label={en ? "Recording time" : "录像时长"}>
          <PencilText>{recordPending ? en ? "Starting video…" : "正在准备录制…"
            : `${en ? "Recording" : "录制中"} ${formatElapsed(elapsed)}`}</PencilText>
        </span>}
      </div>
      <div className="trip-camera-status" aria-live="polite">
        {locationState && <span><PencilText>{locationState}</PencilText></span>}
        {message && <span role="status"><PencilText>{message}</PencilText></span>}
      </div>
      <div className="trip-camera-controls">
        <button type="button" className="trip-camera-control" onClick={openAlbum}
          aria-label={en ? "Album" : "相册"} title={en ? "Album" : "相册"}>
          <PhotoAlbumIcon />
        </button>
          <button type="button" className="trip-camera-shutter" disabled={previewState !== "ready" || !active}
            onPointerDown={beginHold} onPointerUp={endHold} onPointerCancel={endHold} onLostPointerCapture={endHold}
            onKeyDown={beginKeyboardHold} onKeyUp={endKeyboardHold}
            onBlur={() => {
              if (typeof heldPointerRef.current !== "string") return;
              heldPointerRef.current = null;
              clearTimeout(holdTimerRef.current);
              if (longHoldRef.current) stopRecording();
              longHoldRef.current = false;
            }}
            onClick={event => {
              if (event.detail > 0 && suppressPointerClickRef.current) {
                suppressPointerClickRef.current = false;
                return;
              }
              if (recorderRef.current || recordIntentRef.current) return;
              capturePhoto();
            }}
            aria-label={en ? "Take photo; hold to record video" : "拍照；长按录制视频"}
            title={en ? "Click photo, hold video" : "点击拍照，长按录像"}>
            <span className="trip-camera-shutter-ring" aria-hidden="true"><PencilIcon kind="shutter-ring">
              <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13c0-4.6-2.4-8.8-6.2-11.1" />
            </PencilIcon></span>
            <CameraIcon />
          </button>
        <input ref={uploadRef} type="file" accept="image/*,video/*" multiple tabIndex={-1} className="trip-camera-upload-input"
          aria-label={en ? "Choose local photos or videos" : "选择本地照片或视频"} onChange={uploadFiles} />
        <button type="button" className="trip-camera-control" onClick={() => uploadRef.current?.click()}
          aria-label={uploading ? en ? "Saving…" : "保存中…" : en ? "Upload" : "上传"}
          title={en ? "Upload" : "上传"} disabled={uploading || !active}><UploadIcon /></button>
      </div>
  </section>;
}
