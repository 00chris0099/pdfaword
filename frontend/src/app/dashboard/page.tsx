"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth";
import { convert, history, type Conversion } from "@/lib/api";
import { formatFileSize, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { FileText, Upload, History, CreditCard, Clock, CheckCircle, XCircle, ArrowRight, LogOut, Layers } from "lucide-react";

export default function DashboardPage() {
  const { user, token, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!isLoading && !token) router.push("/login");
  }, [isLoading, token, router]);

  useEffect(() => {
    if (token) {
      history
        .list(token, 1, 5)
        .then((res) => setRecentConversions(res.conversions))
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [token]);

  if (isLoading || !user) return <DashboardSkeleton />;

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
            <span className="text-sm text-muted-foreground hidden sm:block">{user.username}</span>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenido de vuelta, {user.username}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos</p>
                <p className="text-xl font-bold">{user.credits_remaining === -1 ? "∞" : user.credits_remaining}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-xl font-bold capitalize">{user.plan}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="text-xl font-bold">{formatDate(user.created_at).split(",")[0]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/convert"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Convertir PDF</h3>
                <p className="text-sm text-muted-foreground mt-1">Sube un PDF y conviértelo a Word</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                <Upload className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Link>
          <Link
            href="/convert"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Batch Upload</h3>
                <p className="text-sm text-muted-foreground mt-1">Convierte múltiples PDFs a la vez</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Link>
          <Link
            href="/history"
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Historial</h3>
                <p className="text-sm text-muted-foreground mt-1">Todas tus conversiones anteriores</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                <History className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Conversiones recientes</h3>
            <Link href="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loadingHistory ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
            ) : recentConversions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay conversiones aún.{" "}
                <Link href="/convert" className="text-primary hover:underline">
                  Sube tu primer PDF
                </Link>
              </div>
            ) : (
              recentConversions.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.original_filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(c.original_size)} · {formatDate(c.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                    {c.status === "completed" && (
                      <a
                        href={convert.downloadUrl(c.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        DOCX
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Cargando...</div>
    </div>
  );
}
