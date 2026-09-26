import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { adventureStops } from "./adventureData";
import { AdventurePencilTabs } from "./AdventureCalendar";
import { downloadMediaBlob } from "./cameraMediaDownload";
import { createCameraNicknameAutosave } from "./cameraNicknameAutosave";
import { deleteMediaItem, getMediaBlob, getMediaSnapshot, initializeMediaLibrary, listMediaForPlace,
  saveUploadedMedia, subscribeMediaLibrary, updateMediaMetadata } from "./media/library";
import { PanelDivider } from "./pencil/PanelDivider";
import { PencilIcon } from "./pencil/PencilIcon";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import { pencilStroke } from "./pencil/stroke";
import "./AdventureMediaAlbum.css";
import "./cameraForms.css";

const placeByTag = new Map(adventureStops.map(stop => [stop.tag, stop]));

function placeName(tag, language) {
  const place = placeByTag.get(tag);
  return place ? language === "en" ? place.nameEn ?? place.name : place.name : tag;
}

function capturedTime(item, language) {
  if (!item.capturedAt && item.captureLocalTime) return `${item.captureLocalTime.replace("T", " ").slice(0, 16)} · ${language === "en" ? "time zone unknown" : "时区未知"}`;
  if (!item.capturedAt) return language === "en" ? "Unknown" : "未知";
  const timestamp = Date.parse(item.capturedAt);
  if (!Number.isFinite(timestamp)) return language === "en" ? "Unknown" : "未知";
  const offset = item.captureOffsetMinutes;
  if (!Number.isFinite(offset)) return new Date(timestamp).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const local = new Date(timestamp + offset * 60_000).toISOString().replace("T", " ").slice(0, 16);
  const sign = offset < 0 ? "−" : "+";
  const absolute = Math.abs(offset);
  return `${local} UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function shortSize(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function useMediaSnapshot() {
  const [snapshot, setSnapshot] = useState(getMediaSnapshot);
  useEffect(() => {
    const unsubscribe = subscribeMediaLibrary(setSnapshot);
    initializeMediaLibrary().catch(() => { /* The library publishes its durable error state. */ });
    return unsubscribe;
  }, []);
  return snapshot;
}

function MediaAsset({ item, controls = false }) {
  const [url, setUrl] = useState("");
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let current = true;
    let objectUrl = "";
    setUrl("");
    setMissing(false);
    getMediaBlob(item.id).then(blob => {
      if (!current) return;
      if (!blob) { setMissing(true); return; }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (current) setMissing(true); });
    return () => { current = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id]);
  if (missing) return <span className="trip-media-asset-placeholder" role="status">{item.originalName || "—"}</span>;
  if (!url) return <span className="trip-media-asset-placeholder" aria-hidden="true">…</span>;
  return item.kind === "video"
    ? <video src={url} controls={controls} muted={!controls} preload="metadata" playsInline aria-label={item.originalName || "Video"} />
    : <img src={url} alt={item.originalName || "Captured photo"} loading={controls ? "eager" : "lazy"} />;
}

function MediaFormIcon({ kind, active = false }) {
  const paths = {
    person: "M16 5.5c3 0 5 2.2 5 5s-2 5-5 5-5-2.2-5-5 2-5 5-5zM7.5 27c.6-5.3 3.6-8.2 8.5-8.2s7.9 2.9 8.5 8.2",
    camera: "M5.5 10.2c2.1-.4 4.2-.5 6.1-.5l1.8-3.2c2.4-.3 4.7-.3 7.1.1l1.5 3.2c1.8 0 3.1.1 4.4.4l.3 15.4c-6.8.8-14.2.8-21.3-.1zM16.1 13c-3.4 0-5.9 2.5-5.9 5.8s2.5 5.9 5.9 5.9 5.8-2.6 5.8-5.9S19.5 13 16.1 13z",
    upload: "M6.8 21.2v5.2c5.4.6 12.7.7 18.2 0v-5.1M15.9 22.7l.1-17.1m-5.3 5.5 5.3-5.5 5.2 5.4",
    place: "M16 28c-1.6-2.5-7.4-9.4-7.4-15.3 0-4.3 3-7.4 7.4-7.4s7.4 3.1 7.4 7.4C23.4 18.6 17.6 25.5 16 28zM16 9.2c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5S18 9.2 16 9.2z",
    delete: "M7 9h18M12 9V5h8v4M9 10l1 17h12l1-17M13 13v10M19 13v10",
    favorite: "M16 5.5l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1z",
    download: "M7 23.5v3c5.7.7 12.3.7 18 0v-3M16 5.5v15.2m-5.2-5.1 5.2 5.2 5.2-5.2",
    more: "M6.3 16c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zM13.7 16c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zM21.1 16c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3z",
    chevron: "M9 12l7 7 7-7",
  };
  return <PencilIcon kind={kind} active={active}><path d={paths[kind]} /></PencilIcon>;
}

function MetadataRow({ label, children }) {
  return <div><dt><PencilText>{label}</PencilText></dt><dd><PencilText>{children}</PencilText></dd></div>;
}

function EmptyActionDivider() {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const paint = () => {
      const height = canvas.clientHeight;
      if (height < 4) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(8 * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const ink = getComputedStyle(canvas).getPropertyValue("--trip-ink-muted").trim() || "#627b67";
      pencilStroke(context, [[4, 1], [3.7, height * .34], [4.3, height * .68], [4, height - 1]],
        ink, 1, 1789, .35, 2, false,
        { variation: .82, breaks: .22, grain: .7, gain: 2.3, step: .7 });
    };
    const resize = new ResizeObserver(paint);
    resize.observe(canvas);
    paint();
    return () => resize.disconnect();
  }, []);
  return <canvas ref={canvasRef} className="trip-media-empty-divider" aria-hidden="true" />;
}

export const AdventureMediaAlbum = forwardRef(function AdventureMediaAlbum({
  placeTag = null, selectedId: controlledSelectedId, onSelect, detailTab: controlledDetailTab, onTabChange,
  onRequestCapture,
}, forwardedRef) {
  const { language } = useLanguage();
  const en = language === "en";
  const snapshot = useMediaSnapshot();
  const items = useMemo(() => placeTag ? listMediaForPlace(placeTag, snapshot.items) : snapshot.items,
    [placeTag, snapshot.items]);
  const selectionControlled = controlledSelectedId !== undefined;
  const tabControlled = controlledDetailTab !== undefined;
  const [localSelectedId, setLocalSelectedId] = useState(null);
  const [localDetailTab, setLocalDetailTab] = useState("info");
  const selectedId = selectionControlled ? controlledSelectedId : localSelectedId;
  const detailTab = (tabControlled ? controlledDetailTab : localDetailTab) === "edit" ? "edit" : "info";
  const selected = items.find(item => item.id === selectedId) ?? null;
  const [photographerName, setPhotographerName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const uploadRef = useRef(null);
  const pressRef = useRef(null);
  const suppressClickRef = useRef(false);
  const actionMenuRef = useRef(null);
  const actionTriggerRef = useRef(null);
  const composingRef = useRef(false);
  const mountedRef = useRef(false);
  const selectedIdRef = useRef(selectedId);
  const previousSelectedRef = useRef(selectedId);
  const previousDetailTabRef = useRef(detailTab);
  const photographerAutosavesRef = useRef(new Map());
  selectedIdRef.current = selectedId;

  const photographerAutosave = useCallback(id => {
    if (!id) return null;
    if (!photographerAutosavesRef.current.has(id)) {
      photographerAutosavesRef.current.set(id, createCameraNicknameAutosave({
        allowEmpty: true,
        save: value => updateMediaMetadata(id, { photographerName: value }),
        onStatus: status => {
          if (!mountedRef.current || selectedIdRef.current !== id) return;
          setMessage(status === "error" ? en ? "Could not save attribution." : "无法保存署名。" : "");
        },
      }));
    }
    return photographerAutosavesRef.current.get(id);
  }, [en]);

  const selectItem = useCallback(id => {
    if (!selectionControlled) setLocalSelectedId(id);
    onSelect?.(id);
    setActionId(null);
    setMenuId(null);
    setMessage("");
  }, [onSelect, selectionControlled]);

  const changeTab = useCallback(tab => {
    const next = tab === "edit" ? "edit" : "info";
    if (!tabControlled) setLocalDetailTab(next);
    onTabChange?.(next);
    if (detailTab === "edit" && next !== "edit") photographerAutosave(selectedId)?.flush();
    setMessage("");
  }, [detailTab, onTabChange, photographerAutosave, selectedId, tabControlled]);

  const requestDelete = useCallback(async (id = selectedId) => {
    if (!id) return false;
    const item = snapshot.items.find(candidate => candidate.id === id);
    if (!item) {
      selectItem(null);
      return false;
    }
    const label = item.originalName || (item.kind === "video" ? en ? "this video" : "这段视频" : en ? "this photo" : "这张照片");
    if (!window.confirm(en ? `Delete ${label} from the local album?` : `从本地相册删除${label}？`)) return false;
    setSaving(true);
    setMessage("");
    try {
      const removed = await deleteMediaItem(id);
      setActionId(null);
      setMenuId(null);
      if (removed && id === selectedId) selectItem(null);
      return removed;
    } catch {
      setMessage(en ? "Could not delete this media." : "无法删除这项媒体。");
      return false;
    } finally {
      setSaving(false);
    }
  }, [en, selectItem, selectedId, snapshot.items]);

  useImperativeHandle(forwardedRef, () => ({ requestDelete }), [requestDelete]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const autosave of photographerAutosavesRef.current.values()) autosave.dispose();
    };
  }, []);
  useEffect(() => {
    const value = selected?.photographer?.nickname ?? "";
    const synced = selected ? photographerAutosave(selected.id).sync(value) : null;
    if (!synced || synced.adopt) setPhotographerName(synced?.value ?? value);
  }, [photographerAutosave, selected?.id, selected?.photographer?.nickname]);
  useEffect(() => {
    const previous = previousSelectedRef.current;
    if (previous && previous !== selectedId) photographerAutosavesRef.current.get(previous)?.flush();
    previousSelectedRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    if (previousDetailTabRef.current === "edit" && detailTab !== "edit") photographerAutosave(selectedId)?.flush();
    previousDetailTabRef.current = detailTab;
  }, [detailTab, photographerAutosave, selectedId]);
  useEffect(() => {
    if (snapshot.status === "ready" && selectedId && !items.some(item => item.id === selectedId)) selectItem(null);
  }, [items, selectItem, selectedId, snapshot.status]);
  useEffect(() => () => clearTimeout(pressRef.current?.timer), []);
  useEffect(() => {
    if (!actionId && !menuId) return undefined;
    if (menuId) actionMenuRef.current?.querySelector("button")?.focus();
    else document.querySelector(`[data-media-card-id="${CSS.escape(actionId)}"] .trip-media-item-quick-actions button`)?.focus();
    const closeOutside = event => {
      const card = event.target instanceof Element ? event.target.closest("[data-media-card-id]") : null;
      if (!card || card.dataset.mediaCardId !== (menuId ?? actionId)) {
        suppressClickRef.current = false;
        setActionId(null);
        setMenuId(null);
      }
    };
    const closeOnEscape = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      const focusTarget = actionTriggerRef.current;
      suppressClickRef.current = false;
      setMenuId(null);
      setActionId(null);
      requestAnimationFrame(() => focusTarget?.focus());
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [actionId, menuId]);

  const beginPress = (event, id) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const trigger = event.currentTarget;
    suppressClickRef.current = false;
    clearTimeout(pressRef.current?.timer);
    const press = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer: 0 };
    press.timer = window.setTimeout(() => {
      if (pressRef.current !== press) return;
      suppressClickRef.current = true;
      actionTriggerRef.current = trigger;
      setActionId(id);
      setMenuId(null);
      pressRef.current = null;
    }, 500);
    pressRef.current = press;
  };

  const movePress = event => {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
      clearTimeout(press.timer);
      pressRef.current = null;
    }
  };

  const endPress = event => {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;
    clearTimeout(press.timer);
    pressRef.current = null;
  };

  const openActions = (event, id) => {
    event.preventDefault();
    clearTimeout(pressRef.current?.timer);
    pressRef.current = null;
    suppressClickRef.current = true;
    actionTriggerRef.current = event.currentTarget;
    setActionId(id);
    setMenuId(id);
  };

  const openDetail = (id, tab) => {
    suppressClickRef.current = false;
    if (!selectionControlled) {
      setLocalSelectedId(id);
      setLocalDetailTab(tab);
    }
    onSelect?.(id);
    setActionId(null);
    setMenuId(null);
    setMessage("");
    if (tab === "edit") requestAnimationFrame(() => onTabChange?.("edit"));
  };

  const toggleFavorite = async item => {
    setSaving(true);
    setMessage("");
    try {
      await updateMediaMetadata(item.id, { favorite: !Boolean(item.favorite) });
    } catch {
      setMessage(en ? "Could not update favorite." : "无法更新收藏。");
    } finally { setSaving(false); }
  };

  const saveToDevice = async item => {
    setSaving(true);
    setMessage("");
    try {
      await downloadMediaBlob(item, getMediaBlob);
    } catch {
      setMessage(en ? "Could not save this media to your device." : "无法将这项媒体保存到本地。");
    } finally { setSaving(false); }
  };

  const uploadPlaceMedia = async event => {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = "";
    if (!files.length || saving) return;
    setSaving(true);
    setMessage("");
    let failures = 0;
    try {
      for (const file of files) {
        try {
          const result = await saveUploadedMedia(file);
          if (placeTag && result.item?.manualPlaceTag !== placeTag)
            await updateMediaMetadata(result.item.id, { manualPlaceTag: placeTag });
        } catch { failures += 1; }
      }
      if (failures) setMessage(en ? `${failures} file(s) could not be added.` : `${failures} 个文件无法加入。`);
    } finally {
      setSaving(false);
    }
  };

  const changePlace = async event => {
    const manualPlaceTag = event.target.value || null;
    setMessage("");
    try {
      await updateMediaMetadata(selected.id, { manualPlaceTag });
    } catch {
      setMessage(en ? "Could not save the place." : "无法保存地点归属。");
    }
  };

  const sourceLabel = { camera: en ? "Camera" : "相机", exif: "EXIF", unknown: en ? "Unknown" : "未知" };
  const provenanceLabel = { capture: en ? "Captured here" : "本机拍摄", upload: en ? "Uploaded file" : "上传文件",
    archive: en ? "Imported archive" : "导入归档" };

  return <section className="trip-media-album" aria-label={placeTag ? en ? `${placeName(placeTag, language)} photos` : `${placeName(placeTag, language)}相册` : en ? "Local album" : "本地相册"}>
    <div className="trip-media-album-scroll" onScroll={() => {
      clearTimeout(pressRef.current?.timer);
      pressRef.current = null;
      setActionId(null);
      setMenuId(null);
    }}>
      {snapshot.status === "loading" && <p role="status"><PencilText>{en ? "Opening local album…" : "正在打开本地相册…"}</PencilText></p>}
      {snapshot.status === "error" && <p className="trip-media-error" role="alert"><PencilText>{snapshot.error || (en ? "Could not open local album." : "无法打开本地相册。")}</PencilText></p>}
      {snapshot.status === "ready" && !items.length && (placeTag ? <div className="trip-media-empty-place">
        <div className="trip-media-empty-actions">
          <button type="button" onClick={onRequestCapture}><MediaFormIcon kind="camera" /><PencilText>{en ? "Capture" : "拍摄"}</PencilText></button>
          <EmptyActionDivider />
          <button type="button" onClick={() => uploadRef.current?.click()} disabled={saving}><MediaFormIcon kind="upload" /><PencilText>{en ? "Upload" : "上传"}</PencilText></button>
        </div>
        <input ref={uploadRef} className="trip-media-empty-input" type="file" accept="image/*,video/*" multiple
          aria-label={en ? "Choose local photos or videos" : "选择本地照片或视频"} onChange={uploadPlaceMedia} />
        <p role="status"><PencilText>{en
          ? "No matching local photos or videos for this place. Capture or upload one."
          : "此地点暂无匹配的本地照片或视频，可拍摄或上传。"}</PencilText></p>
      </div> : <p role="status"><PencilText>{en ? "No local photos or videos yet." : "本地相册还没有照片或视频。"}</PencilText></p>)}
      {selected ? <div className="trip-media-detail">
        <div className="trip-media-detail-asset"><MediaAsset item={selected} controls /></div>
        <h3><PencilText>{selected.originalName || (selected.kind === "video" ? en ? "Video" : "视频" : en ? "Photo" : "照片")}</PencilText></h3>
        <div className="trip-media-detail-tab-frame">
          <AdventurePencilTabs items={[["info", en ? "Capture information" : "拍摄信息"],
            ["edit", en ? "Additional information" : "补充信息"]]} value={detailTab} onChange={changeTab}
            ariaLabel={en ? "Media details" : "媒体详情"} idPrefix="trip-media-detail" controlsId="trip-media-detail-panel" withInk />
          <PanelDivider />
        </div>
        {detailTab === "info" ? <dl className="trip-media-metadata" role="tabpanel" id="trip-media-detail-panel" aria-labelledby="trip-media-detail-tab-info">
          <MetadataRow label={en ? "Photographer" : "摄影者"}>{selected.photographer?.nickname || (en ? "Unknown" : "未知")}</MetadataRow>
          <MetadataRow label={en ? "Captured" : "拍摄时间"}>{capturedTime(selected, language)}</MetadataRow>
          <MetadataRow label={en ? "Time source" : "时间来源"}>{sourceLabel[selected.captureTimeSource] ?? sourceLabel.unknown}</MetadataRow>
          <MetadataRow label={en ? "Original GPS" : "原始 GPS"}>{selected.gps
            ? `${selected.gps.lat.toFixed(5)}, ${selected.gps.lng.toFixed(5)}${Number.isFinite(selected.gps.accuracyMeters) ? ` · ±${Math.round(selected.gps.accuracyMeters)}m` : ""}`
            : en ? "Unknown" : "未知"}</MetadataRow>
          <MetadataRow label={en ? "GPS source" : "位置来源"}>{sourceLabel[selected.gpsSource] ?? sourceLabel.unknown}</MetadataRow>
          <MetadataRow label={en ? "Place" : "地点归属"}>{selected.manualPlaceTag === "unassigned"
            ? en ? "Unassigned · manual" : "未指定 · 手动"
            : selected.manualPlaceTag
            ? `${placeName(selected.manualPlaceTag, language)} · ${en ? "manual" : "手动"}`
            : selected.autoPlaceTag ? `${placeName(selected.autoPlaceTag, language)} · ${en ? "nearby GPS" : "GPS 附近"}`
              : en ? "Unassigned" : "未指定"}</MetadataRow>
          <MetadataRow label={en ? "File" : "文件"}>{`${selected.kind === "video" ? en ? "Video" : "视频" : en ? "Image" : "图片"} · ${shortSize(selected.size)}`}</MetadataRow>
          <MetadataRow label={en ? "Added via" : "加入方式"}>{provenanceLabel[selected.provenance] ?? "—"}</MetadataRow>
        </dl> : <div className="trip-media-edit" role="tabpanel" id="trip-media-detail-panel" aria-labelledby="trip-media-detail-tab-edit">
          <div className="trip-media-detail-form">
            <label className="trip-camera-form-label" htmlFor="trip-media-photographer"><span className="trip-camera-form-label-icon"><MediaFormIcon kind="person" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Correct attribution" : "修正摄影者署名"}</PencilText></span></label>
            <PencilSurface className="trip-media-field"><input id="trip-media-photographer" value={photographerName} maxLength={60}
              onCompositionStart={() => {
                composingRef.current = true;
                photographerAutosave(selected.id).cancelPending();
              }}
              onCompositionEnd={event => {
                composingRef.current = false;
                photographerAutosave(selected.id).edit(event.currentTarget.value);
              }}
              onChange={event => {
                setPhotographerName(event.currentTarget.value);
                setMessage("");
                photographerAutosave(selected.id).edit(event.currentTarget.value);
                if (composingRef.current) photographerAutosave(selected.id).cancelPending();
              }}
              onBlur={event => {
                composingRef.current = false;
                photographerAutosave(selected.id).edit(event.currentTarget.value, { immediate: true });
              }} /></PencilSurface>
          </div>
          <div className="trip-media-detail-form">
            <label className="trip-camera-form-label" htmlFor="trip-media-place"><span className="trip-camera-form-label-icon"><MediaFormIcon kind="place" /></span><span className="trip-camera-form-label-text"><PencilText>{en ? "Assign place" : "手动指定地点"}</PencilText></span></label>
            <PencilSurface className="trip-media-field trip-media-select-field"><select id="trip-media-place" value={selected.manualPlaceTag ?? ""} onChange={changePlace}>
              <option value="">{en ? "Use GPS match / unassigned" : "使用 GPS 匹配或保持未指定"}</option>
              <option value="unassigned">{en ? "Keep unassigned" : "手动保持未指定"}</option>
              {adventureStops.map(place => <option key={place.tag} value={place.tag}>{placeName(place.tag, language)}</option>)}
            </select><MediaFormIcon kind="chevron" /></PencilSurface>
          </div>
        </div>}
      </div> : <div className="trip-media-grid">
        {items.map(item => <PencilSurface as="article" variant="paper" clipContent className="trip-media-item" key={item.id}
          data-media-card-id={item.id} data-actions-open={actionId === item.id || menuId === item.id} data-menu-open={menuId === item.id}>
          <button type="button" className="trip-media-item-hit"
            data-media-id={item.id}
            onPointerDown={event => beginPress(event, item.id)} onPointerMove={movePress}
            onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress} onLostPointerCapture={endPress}
            onContextMenu={event => openActions(event, item.id)}
            onKeyDown={event => {
              if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) openActions(event, item.id);
            }}
            onClick={() => {
              if (suppressClickRef.current) { suppressClickRef.current = false; return; }
              selectItem(item.id);
            }}
            aria-haspopup="menu" aria-expanded={actionId === item.id}
            aria-label={`${item.kind === "video" ? en ? "Video" : "视频" : en ? "Photo" : "照片"} · ${capturedTime(item, language)} · ${item.photographer?.nickname || (en ? "unknown photographer" : "摄影者未知")}`}>
            <span className="trip-media-item-asset"><MediaAsset item={item} /></span>
            {item.kind === "video" && <span className="trip-media-item-kind"><PencilText>{en ? "Video" : "视频"}</PencilText></span>}
          </button>
          <div className="trip-media-item-quick-actions" aria-label={en ? "Media actions" : "媒体操作"}>
            <button type="button" disabled={saving} aria-pressed={Boolean(item.favorite)}
              aria-label={item.favorite ? en ? "Remove from favorites" : "取消收藏" : en ? "Add to favorites" : "收藏"}
              title={item.favorite ? en ? "Remove from favorites" : "取消收藏" : en ? "Add to favorites" : "收藏"}
              onClick={() => toggleFavorite(item)}><MediaFormIcon kind="favorite" active={Boolean(item.favorite)} /></button>
            <button type="button" disabled={saving} aria-label={en ? "Save to device" : "保存到本地"}
              title={en ? "Save to device" : "保存到本地"} onClick={() => saveToDevice(item)}>
              <MediaFormIcon kind="download" />
            </button>
            <button type="button" disabled={saving} aria-label={en ? "Delete" : "删除"} title={en ? "Delete" : "删除"}
              onClick={() => requestDelete(item.id)}><MediaFormIcon kind="delete" /></button>
            <button type="button" data-media-more-for={item.id} aria-haspopup="menu" aria-expanded={menuId === item.id}
              aria-label={en ? "More media actions" : "更多媒体操作"} title={en ? "More media actions" : "更多媒体操作"}
              onClick={event => {
                actionTriggerRef.current = event.currentTarget;
                const closing = menuId === item.id;
                setActionId(closing ? null : item.id);
                setMenuId(closing ? null : item.id);
              }}>
              <MediaFormIcon kind="more" />
            </button>
          </div>
          {menuId === item.id && <div ref={actionMenuRef} className="trip-media-item-actions" role="menu">
            <button type="button" role="menuitem" onClick={() => openDetail(item.id, "info")}>
              <PencilText>{en ? "View capture information" : "查看拍摄信息"}</PencilText>
            </button>
            <button type="button" role="menuitem" onClick={() => openDetail(item.id, "edit")}>
              <PencilText>{en ? "Edit additional information" : "编辑补充信息"}</PencilText>
            </button>
          </div>}
        </PencilSurface>)}
      </div>}
      {message && <p className="trip-media-message" role="alert"><PencilText>{message}</PencilText></p>}
    </div>
  </section>;
});
