import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-emerald-400";
    case "failed":
      return "text-red-400";
    case "pending":
      return "text-amber-400";
    default:
      return "text-blue-400";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "En cola";
    case "analyzing":
      return "Analizando";
    case "ocr_processing":
      return "OCR procesando";
    case "converting":
      return "Convirtiendo";
    case "translating":
      return "Traduciendo";
    case "completed":
      return "Completado";
    case "failed":
      return "Fallido";
    default:
      return status;
  }
}
