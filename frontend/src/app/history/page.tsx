"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth";
import { convert, history, type Conversion } from "@/lib/api";
import { formatFileSize, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { FileText, Trash2, Download, ChevronLeft, ChevronRight, LogOut, History, Filter, Package } from "lucide-react";

export default function HistoryPage() {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const perPage = 15;

  useEffect(() => {
    if (!isLoading && !token) router.push("/login");
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    history
      .list(token, page, perPage)
      .then((res) => {
        setConversions(res.conversions);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page]);

  const filteredConversions = filter === "all"
    ? conversions
    : conversions.filter((c) => {
        if (filter === "completed") return c.status === "completed";
        if (filter === "failed") return c.status === "failed";
        if (filter === "ocr") return c.ocr_used;
        if (filter === "translated") return !!c.translation_lang;
        return true;
      });

  const handleDelete = async (id: number) => {
    if (!token || !confirm("¿Eliminar esta conversión?")) return;
    try {
      await convert.delete(token, id);
      setConversions((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  const totalPages = Math.ceil(total / perPage);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              Historial
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{total} conversiones en total</p>
          </div>
          <Link
            href="/convert"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Nuevo PDF
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {[
            { value: "all", label: "Todos" },
            { value: "completed", label: "Completados" },
            { value: "failed", label: "Fallidos" },
            { value: "ocr", label: "Con OCR" },
            { value: "translated", label: "Traducidos" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : filteredConversions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === "all" ? "No hay conversiones aún" : "No hay resultados para este filtro"}
            </p>
            <Link href="/convert" className="text-primary hover:underline text-sm mt-2 inline-block">
              Sube tu primer PDF
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {filteredConversions.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.original_filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(c.original_size)}</span>
                        <span>·</span>
                        <span>{formatDate(c.created_at)}</span>
                        {c.pages_count && (
                          <>
                            <span>·</span>
                            <span>{c.pages_count} págs</span>
                          </>
                        )}
                        {c.ocr_used && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400">OCR</span>
                          </>
                        )}
                        {c.translation_lang && (
                          <>
                            <span>·</span>
                            <span className="text-blue-400">→{c.translation_lang}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                    {c.status === "completed" && (
                      <a
                        href={convert.downloadUrl(c.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition text-primary"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
