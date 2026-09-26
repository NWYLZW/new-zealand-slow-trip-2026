import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../LanguageContext";
import { exportMediaArchive, importMediaArchive } from "./media/library";
import { ExportIcon, ImportIcon } from "./SketchIcons";
import { PencilSurface } from "./pencil/PencilSurface";
import { PencilText } from "./pencil/PencilText";
import "./AdventureMediaArchiveActions.css";

export function AdventureMediaArchiveActions() {
  const { language } = useLanguage();
  const en = language === "en";
  const inputRef = useRef(null);
  const urlsRef = useRef(new Set());
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => () => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
  }, []);

  const importFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    setOperation("import");
    setResult(null);
    try {
      const outcome = await importMediaArchive(file);
      const conflicts = Array.isArray(outcome.metadataConflicts)
        ? outcome.metadataConflicts.length : Number(outcome.metadataConflicts) || 0;
      setResult({ error: false, text: en
        ? `Imported ${outcome.imported}; ${outcome.duplicates} duplicate files; ${conflicts} metadata conflicts.`
        : `导入 ${outcome.imported} 项；重复文件 ${outcome.duplicates} 项；元数据冲突 ${conflicts} 项。` });
    } catch {
      setResult({ error: true, text: en ? "Archive rejected or could not be imported." : "归档校验未通过或导入失败。" });
    } finally { setBusy(false); setOperation(""); }
  };

  const exportArchive = async () => {
    if (busy) return;
    setBusy(true);
    setOperation("export");
    setResult(null);
    try {
      const blob = await exportMediaArchive();
      const url = URL.createObjectURL(blob);
      urlsRef.current.add(url);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `new-zealand-local-media-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => { URL.revokeObjectURL(url); urlsRef.current.delete(url); }, 60_000);
      setResult({ error: false, text: en ? "Archive download started." : "归档下载已开始。" });
    } catch {
      setResult({ error: true, text: en ? "Could not export the archive." : "无法导出归档。" });
    } finally { setBusy(false); setOperation(""); }
  };

  const visibleResult = busy ? { error: false, text: operation === "import"
    ? en ? "Importing archive…" : "正在导入归档…"
    : en ? "Preparing archive…" : "正在准备归档…" } : result;

  return <div className="trip-media-archive-actions" aria-busy={busy}>
    <input ref={inputRef} type="file" accept=".zip,application/zip" tabIndex={-1} className="trip-media-archive-input"
      aria-label={en ? "Choose media archive ZIP" : "选择媒体归档 ZIP"} onChange={importFile} />
    <button type="button" className="trip-route-header-action trip-media-archive-button"
      onClick={() => inputRef.current?.click()} disabled={busy}
      aria-label={en ? "Import media archive" : "导入媒体归档"} title={en ? "Import ZIP" : "导入 ZIP"}><ImportIcon /></button>
    <button type="button" className="trip-route-header-action trip-media-archive-button"
      onClick={exportArchive} disabled={busy}
      aria-label={en ? "Export media archive" : "导出媒体归档"} title={en ? "Export ZIP" : "导出 ZIP"}><ExportIcon /></button>
    {visibleResult && <PencilSurface as="span" variant="paper" className="trip-media-archive-result"
      role={visibleResult.error ? "alert" : "status"}><PencilText>{visibleResult.text}</PencilText></PencilSurface>}
  </div>;
}
