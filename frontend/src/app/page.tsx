"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth";
import {
  FileText, Zap, Shield, Languages, Layers, ArrowRight,
  Check, Star, Clock, Download, Sparkles, Code, ChevronRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Layout complejo",
    desc: "Multi-columna, márgenes, secciones — todo preservado exactamente como el original",
  },
  {
    icon: FileText,
    title: "Tablas y bordes",
    desc: "Celdas combinadas, bordes, colores de fondo — cada tabla queda perfecta",
  },
  {
    icon: Zap,
    title: "OCR avanzado",
    desc: "Lee PDFs escaneados con precisión del 96%+ usando PaddleOCR PP-StructureV3",
  },
  {
    icon: Languages,
    title: "Traducción automática",
    desc: "Traduce el documento a 100+ idiomas mientras lo convierte, sin perder formato",
  },
  {
    icon: Shield,
    title: "Imágenes preservadas",
    desc: "Posición inline y flotante, sin perder ningún gráfico o imagen",
  },
  {
    icon: Sparkles,
    title: "Colores y fuentes",
    desc: "Texto coloreado, fondos, bold, italic, tamaños — todo se mantiene",
  },
];

const STEPS = [
  { num: "01", title: "Sube tu PDF", desc: "Arrastra o selecciona tu archivo. Soporta PDFs de cualquier complejidad." },
  { num: "02", title: "Procesamiento inteligente", desc: "Nuestro motor analiza el layout, ejecuta OCR si es necesario, y preserva cada detalle." },
  { num: "03", title: "Descarga el Word", desc: "Obtén tu archivo .docx listo para editar en Microsoft Word o Google Docs." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "para siempre",
    description: "Perfecto para probar",
    credits: 5,
    features: [
      "5 conversiones",
      "Hasta 20 páginas por PDF",
      "OCR incluido",
      "Traducción incluida",
      "1 idioma de traducción",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mes",
    description: "Para uso regular",
    credits: 100,
    features: [
      "100 conversiones/mes",
      "Hasta 500 páginas por PDF",
      "OCR avanzado",
      "Traducción a 100+ idiomas",
      "Batch upload (hasta 10)",
      "Historial completo",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$29.99",
    period: "/mes",
    description: "Uso ilimitado",
    credits: -1,
    features: [
      "Conversiones ilimitadas",
      "Sin límite de páginas",
      "OCR más potente",
      "Traducción ilimitada",
      "Batch upload (hasta 20)",
      "API REST completa",
      "Soporte dedicado",
      "Webhook callbacks",
    ],
    cta: "Elegir Enterprise",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    name: "María González",
    role: "Abogada",
    text: "Convierto contratos de 50+ páginas en segundos. El OCR lee perfectamente los documentos escaneados. Imprescindible.",
    rating: 5,
  },
  {
    name: "Carlos Ruiz",
    role: "Diseñador Gráfico",
    text: "Lo que más me impresiona es que preserva los colores y el layout exacto. Otros conversores me destruían los diseños.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Investigadora",
    text: "Uso el batch upload para convertir papers enteros. La traducción automática me ahorra horas de trabajo.",
    rating: 5,
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PDFForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/docs" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition hidden sm:block">
              API Docs
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-sm text-muted-foreground mb-6">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              OCR con precisión del 96%+
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Convierte cualquier{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">PDF</span>
              <br />
              a Word <span className="text-muted-foreground">sin perder nada</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tablas complejas, imágenes, colores, cabeceras, formas y layout multi-columna.
              OCR potente que lee PDFs escaneados como si fueran digitales.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user ? "/convert" : "/register"}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium text-lg shadow-lg shadow-primary/25"
              >
                Empezar gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
              >
                Ver planes
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Sin tarjeta de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> 5 conversiones gratis</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> OCR incluido</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Cómo funciona</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Tres pasos simples para obtener tu documento Word perfecto
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} className="relative p-6 rounded-xl border border-border bg-card">
              <span className="text-5xl font-bold text-primary/10 absolute top-4 right-4">{num}</span>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Todo lo que preserva</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Nuestro motor analiza cada elemento de tu PDF y lo reconstruye fielmente en Word
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Planes simples, resultados potentes</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-xl border bg-card flex flex-col ${
                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Más popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? "/convert" : "/register"}
                className={`block text-center py-2.5 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:border-primary/50 text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Lo que dicen nuestros usuarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, rating }) => (
            <div key={name} className="p-5 rounded-xl border border-border bg-card">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
              <div>
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative p-8 sm:p-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent text-center overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">¿Listo para convertir?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Empieza gratis hoy. Sin tarjeta de crédito, sin compromiso.
            </p>
            <Link
              href={user ? "/convert" : "/register"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium text-lg shadow-lg shadow-primary/25"
            >
              Empezar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">PDFForge</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conversor PDF a Word con OCR avanzado. Preserva cada detalle de tus documentos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/convert" className="hover:text-foreground transition">Convertir PDF</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition">Planes</Link></li>
                <li><Link href="/docs" className="hover:text-foreground transition">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:soporte@pdfforge.app" className="hover:text-foreground transition">Contacto</a></li>
                <li><span className="hover:text-foreground transition cursor-pointer">Documentación</span></li>
                <li><span className="hover:text-foreground transition cursor-pointer">Estado del servicio</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition cursor-pointer">Privacidad</span></li>
                <li><span className="hover:text-foreground transition cursor-pointer">Términos</span></li>
                <li><span className="hover:text-foreground transition cursor-pointer">Cookies</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PDFForge. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
