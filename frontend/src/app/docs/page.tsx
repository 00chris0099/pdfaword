"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Copy, Check, ChevronRight, ArrowLeft } from "lucide-react";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/auth/register",
    title: "Registrar usuario",
    body: '{\n  "email": "user@email.com",\n  "username": "usuario",\n  "password": "123456"\n}',
    response: '{\n  "access_token": "eyJ...",\n  "token_type": "bearer",\n  "user": { "id": 1, "email": "..." }\n}',
  },
  {
    method: "POST",
    path: "/api/auth/login",
    title: "Iniciar sesión",
    body: '{\n  "email": "user@email.com",\n  "password": "123456"\n}',
    response: '{\n  "access_token": "eyJ...",\n  "user": { "id": 1, "..." : "..." }\n}',
  },
  {
    method: "GET",
    path: "/api/auth/me",
    title: "Obtener perfil",
    auth: true,
    response: '{\n  "id": 1,\n  "email": "user@email.com",\n  "plan": "enterprise",\n  "credits_remaining": -1\n}',
  },
  {
    method: "POST",
    path: "/api/convert",
    title: "Convertir PDF",
    auth: true,
    content_type: "multipart/form-data",
    params: [
      { name: "file", type: "File", required: true, desc: "Archivo PDF" },
      { name: "translate_to", type: "string", required: false, desc: "Código de idioma (es, en, fr...)" },
      { name: "force_ocr", type: "boolean", required: false, desc: "Forzar OCR" },
    ],
    response: '{\n  "id": 42,\n  "message": "PDF recibido",\n  "status": "pending",\n  "original_filename": "doc.pdf"\n}',
  },
  {
    method: "GET",
    path: "/api/convert/{id}/status",
    title: "Estado de conversión",
    auth: true,
    response: '{\n  "id": 42,\n  "status": "completed",\n  "pages_count": 12,\n  "ocr_used": false,\n  "conversion_time_seconds": 3.2\n}',
  },
  {
    method: "GET",
    path: "/api/convert/{id}/download",
    title: "Descargar DOCX",
    auth: true,
    response_type: "binary",
  },
  {
    method: "POST",
    path: "/api/convert/batch",
    title: "Batch upload",
    auth: true,
    content_type: "multipart/form-data",
    params: [
      { name: "files", type: "File[]", required: true, desc: "2-20 archivos PDF" },
      { name: "translate_to", type: "string", required: false, desc: "Código de idioma" },
    ],
    response: '{\n  "id": 5,\n  "message": "Batch de 3 archivos recibido",\n  "total_files": 3,\n  "status": "pending"\n}',
  },
  {
    method: "GET",
    path: "/api/convert/batch/{id}",
    title: "Estado del batch",
    auth: true,
    response: '{\n  "id": 5,\n  "status": "completed",\n  "total_files": 3,\n  "completed_files": 3,\n  "items": [...]\n}',
  },
  {
    method: "GET",
    path: "/api/convert/batch/{id}/download",
    title: "Descargar batch ZIP",
    auth: true,
    response_type: "zip",
  },
  {
    method: "GET",
    path: "/api/convert/credits",
    title: "Estado de créditos",
    auth: true,
    response: '{\n  "credits_remaining": -1,\n  "plan": "enterprise",\n  "unlimited": true\n}',
  },
  {
    method: "GET",
    path: "/api/history",
    title: "Historial",
    auth: true,
    params: [
      { name: "page", type: "integer", required: false, desc: "Página (default: 1)" },
      { name: "per_page", type: "integer", required: false, desc: "Por página (default: 20)" },
    ],
    response: '{\n  "conversions": [...],\n  "total": 45,\n  "page": 1,\n  "per_page": 20\n}',
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400",
  POST: "bg-blue-500/15 text-blue-400",
  PUT: "bg-amber-500/15 text-amber-400",
  DELETE: "bg-red-500/15 text-red-400",
};

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      {label && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-secondary text-xs text-muted-foreground">
          <span>{label}</span>
          <button onClick={copy} className="hover:text-foreground transition">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <pre className="p-3 bg-secondary/50 text-sm overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PDFForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
              Inicio
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium text-sm"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Base URL: <code className="px-1.5 py-0.5 bg-secondary rounded text-sm">http://localhost:8000</code>
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Swagger UI disponible en <a href="http://localhost:8000/docs" className="text-primary hover:underline" target="_blank">localhost:8000/docs</a>
          </p>
        </div>

        {/* Quick start */}
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <h2 className="font-semibold mb-3">Quick Start</h2>
          <CodeBlock
            label="Ejemplo con curl"
            code={`# 1. Registrarse
curl -X POST http://localhost:8000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@email.com","username":"test","password":"123456"}'

# 2. Convertir un PDF
curl -X POST http://localhost:8000/api/convert \\
  -H "Authorization: Bearer TU_TOKEN" \\
  -F "file=@documento.pdf"

# 3. Descargar el resultado
curl -o resultado.docx http://localhost:8000/api/convert/1/download \\
  -H "Authorization: Bearer TU_TOKEN"`}
          />
        </div>

        {/* Auth info */}
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <h2 className="font-semibold mb-3">Autenticación</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Todos los endpoints protegidos requieren un header <code className="px-1 py-0.5 bg-secondary rounded text-xs">Authorization: Bearer {"<token>"}</code>.
            Obtén el token en <code className="px-1 py-0.5 bg-secondary rounded text-xs">/api/auth/login</code> o <code className="px-1 py-0.5 bg-secondary rounded text-xs">/api/auth/register</code>.
          </p>
          <p className="text-sm text-muted-foreground">
            El token expira en 24 horas.
          </p>
        </div>

        {/* Endpoints */}
        <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
        <div className="space-y-3">
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition text-left"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-sm flex-1 font-mono">{ep.path}</code>
                <span className="text-sm text-muted-foreground hidden sm:block">{ep.title}</span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === i ? "rotate-90" : ""}`} />
              </button>

              {expanded === i && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{ep.title}</p>

                  {ep.auth && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <span className="px-1.5 py-0.5 bg-amber-500/10 rounded">Requiere autenticación</span>
                    </div>
                  )}

                  {ep.content_type && (
                    <p className="text-xs text-muted-foreground">
                      Content-Type: <code className="px-1 py-0.5 bg-secondary rounded">{ep.content_type}</code>
                    </p>
                  )}

                  {ep.params && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Parámetros</h4>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-secondary/50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tipo</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Requerido</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {ep.params.map((p) => (
                              <tr key={p.name}>
                                <td className="px-3 py-2 font-mono text-xs">{p.name}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{p.type}</td>
                                <td className="px-3 py-2 text-xs">{p.required ? "✓" : "—"}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{p.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {ep.body && <CodeBlock code={ep.body} label="Request Body" />}
                  {ep.response && <CodeBlock code={ep.response} label="Response" />}
                  {ep.response_type === "binary" && (
                    <p className="text-xs text-muted-foreground">Returns: <code className="px-1 py-0.5 bg-secondary rounded">application/vnd.openxmlformats-officedocument.wordprocessingml.document</code></p>
                  )}
                  {ep.response_type === "zip" && (
                    <p className="text-xs text-muted-foreground">Returns: <code className="px-1 py-0.5 bg-secondary rounded">application/zip</code></p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back to home */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
