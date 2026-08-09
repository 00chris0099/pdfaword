"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth";
import { convert, batch, type Conversion, type BatchDetail } from "@/lib/api";
import { formatFileSize, getStatusColor, getStatusLabel } from "@/lib/utils";
import { FileText, Upload, X, Download, Loader2, CheckCircle, XCircle, Globe, Zap, LogOut, Layers, Package, Clock, Languages } from "lucide-react";

const LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" },
];

export default function ConvertPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [translateTo, setTranslateTo] = useState("");
  const [forceOcr, setForceOcr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Poll single conversion
  useEffect(() => {
    if (!conversion || !token) return;
    if (["completed", "failed"].includes(conversion.status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await convert.status(token, conversion.id);
        setConversion(updated);
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [conversion, token]);

  // Poll batch
  useEffect(() => {
    if (!batchDetail || !token) return;
    if (["completed", "failed"].includes(batchDetail.status)) return;

    const interval = setInterval(async () => {
      try {
        const updated = await batch.status(token, batchDetail.id);
        setBatchDetail(updated);
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [batchDetail, token]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (f.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF");
        return false;
      }
      if (f.size > 100 * 1024 * 1024) {
        setError(`${f.name} excede 100MB`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid]);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !token) return;
    setUploading(true);
    setError("");

    try {
      if (files.length === 1) {
        // Single upload
        const res = await convert.upload(token, files[0], translateTo || undefined, forceOcr);
        const status = await convert.status(token, res.id);
        setConversion(status);
      } else {
        // Batch upload
        const res = await batch.upload(token, files, translateTo || undefined);
        const detail = await batch.status(token, res.id);
        setBatchDetail(detail);
      }
    } catch (err: any) {
      setError(err.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setConversion(null);
    setBatchDetail(null);
    setTranslateTo("");
    setForceOcr(false);
    setError("");
  };

  if (!user) return null;

  const isBatch = files.length > 1;
  const isEnterprise = user.plan === "enterprise";
  const creditsText = user.credits_remaining === -1 ? "∞" : user.credits_remaining;

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PDFForge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
              Dashboard
            </Link>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-1">Convertir PDF a Word</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Créditos: <span className="font-semibold text-foreground">{creditsText}</span>
          {!isEnterprise && files.length > 0 && (
            <span className="text-muted-foreground"> · Necesitas {files.length} para este upload</span>
          )}
        </p>

        {/* ── Single Conversion View ───────────────────── */}
        {conversion && !batchDetail ? (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-muted-foreground shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{conversion.original_filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(conversion.original_size)}
                    {conversion.pages_count && ` · ${conversion.pages_count} páginas`}
                  </p>
                </div>
              </div>

              {/* Stage Progress */}
              <div className="mt-6">
                <ConversionProgress status={conversion.status} />
              </div>

              {conversion.status_message && (
                <p className="text-xs text-muted-foreground mt-2">{conversion.status_message}</p>
              )}

              {conversion.conversion_time_seconds && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completado en {conversion.conversion_time_seconds.toFixed(1)}s
                </p>
              )}

              {/* Actions */}
              {conversion.status === "completed" && (
                <div className="mt-4 flex gap-3">
                  <a
                    href={convert.downloadUrl(conversion.id)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar DOCX
                  </a>
                  <button
                    onClick={reset}
                    className="px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                  >
                    Otro PDF
                  </button>
                </div>
              )}

              {conversion.status === "failed" && (
                <button
                  onClick={reset}
                  className="mt-4 w-full py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                >
                  Intentar de nuevo
                </button>
              )}
            </div>
          </div>
        ) : batchDetail ? (
          /* ── Batch View ──────────────────────────────── */
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Batch #{batchDetail.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {batchDetail.completed_files}/{batchDetail.total_files} completados
                    {batchDetail.failed_files > 0 && (
                      <span className="text-red-400"> · {batchDetail.failed_files} fallidos</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Overall progress */}
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${(batchDetail.completed_files / Math.max(batchDetail.total_files, 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Item list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batchDetail.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{item.filename}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      {item.status === "completed" && item.conversion_id && (
                        <a
                          href={convert.downloadUrl(item.conversion_id)}
                          className="text-primary hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch actions */}
              {batchDetail.status === "completed" && (
                <div className="mt-4 flex gap-3">
                  <a
                    href={batch.downloadUrl(batchDetail.id)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-center hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar ZIP ({batchDetail.completed_files} archivos)
                  </a>
                  <button
                    onClick={reset}
                    className="px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                  >
                    Nuevo batch
                  </button>
                </div>
              )}

              {batchDetail.status === "failed" && (
                <button
                  onClick={reset}
                  className="mt-4 w-full py-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                >
                  Intentar de nuevo
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Upload View ─────────────────────────────── */
          <div className="space-y-6">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : files.length > 0
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                }}
              />

              {files.length > 0 ? (
                <div className="space-y-4">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <p className="font-medium">{files.length} archivo{files.length > 1 ? "s" : ""} seleccionado{files.length > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(files.reduce((a, f) => a + f.size, 0))} total
                    </p>
                  </div>

                  {/* File list */}
                  <div className="space-y-2 text-left max-h-48 overflow-y-auto">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(f.size)}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpiar todo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">Arrastra tus PDFs aquí</p>
                    <p className="text-sm text-muted-foreground">O haz clic para seleccionar · Multi-archivo soportado</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Máximo 100MB por archivo · Hasta 20 archivos en batch</p>
                </div>
              )}
            </div>

            {/* Options */}
            {files.length > 0 && (
              <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Traducir a (opcional)
                  </label>
                  <select
                    value={translateTo}
                    onChange={(e) => setTranslateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Sin traducción</option>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceOcr}
                    onChange={(e) => setForceOcr(e.target.checked)}
                    disabled={isBatch}
                    className="w-4 h-4 rounded bg-secondary border-border"
                  />
                  <span className="text-sm">
                    <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                    Forzar OCR (para PDFs escaneados)
                    {isBatch && <span className="text-muted-foreground ml-1">(no disponible en batch)</span>}
                  </span>
                </label>

                {isBatch && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
                    <Layers className="w-4 h-4" />
                    Modo batch: {files.length} archivos se procesarán en paralelo
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo{isBatch ? ` ${files.length} archivos` : ""}...
                </>
              ) : (
                <>
                  {isBatch ? <Layers className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  {isBatch ? `Convertir ${files.length} PDFs a Word` : "Convertir a Word"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stage Progress Component ─────────────────────────

const STAGES = [
  { key: "pending", label: "En cola", icon: Clock },
  { key: "analyzing", label: "Analizando", icon: FileText },
  { key: "ocr_processing", label: "OCR", icon: Zap },
  { key: "converting", label: "Convirtiendo", icon: Loader2 },
  { key: "translating", label: "Traduciendo", icon: Languages },
  { key: "completed", label: "Listo", icon: CheckCircle },
];

const STAGE_ORDER = ["pending", "analyzing", "ocr_processing", "converting", "translating", "completed"];

function ConversionProgress({ status }: { status: string }) {
  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <XCircle className="w-4 h-4" />
        Error en la conversión
      </div>
    );
  }

  const currentIdx = STAGE_ORDER.indexOf(status);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((currentIdx + 1) / STAGE_ORDER.length) * 100}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isCurrent
                    ? "bg-primary/20 text-primary animate-pulse"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? "animate-spin" : ""}`} />
                )}
              </div>
              <span
                className={`text-[10px] hidden sm:block ${
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
