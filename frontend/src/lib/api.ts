const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  username: string;
  plan: string;
  credits_remaining: number;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const auth = {
  register: (data: { email: string; username: string; password: string }) =>
    request<TokenResponse>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  me: (token: string) => request<User>("/api/auth/me", { token }),
};

// ── Conversion ────────────────────────────────────────

export interface Conversion {
  id: number;
  original_filename: string;
  original_size: number;
  output_size: number | null;
  status: string;
  status_message: string | null;
  pages_count: number | null;
  has_images: boolean;
  has_tables: boolean;
  is_scanned: boolean;
  ocr_used: boolean;
  translation_lang: string | null;
  conversion_time_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface ConversionListResponse {
  conversions: Conversion[];
  total: number;
  page: number;
  per_page: number;
}

export const convert = {
  upload: async (token: string, file: File, translateTo?: string, forceOcr?: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    if (translateTo) formData.append("translate_to", translateTo);
    if (forceOcr) formData.append("force_ocr", "true");

    const res = await fetch(`${API_BASE}/api/convert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Error" }));
      throw new Error(error.detail);
    }
    return res.json();
  },

  status: (token: string, id: number) =>
    request<Conversion>(`/api/convert/${id}/status`, { token }),

  downloadUrl: (id: number) => `${API_BASE}/api/convert/${id}/download`,

  delete: (token: string, id: number) =>
    request<void>(`/api/convert/${id}`, { method: "DELETE", token }),

  credits: (token: string) =>
    request<{ credits_remaining: number; plan: string; unlimited: boolean }>(
      "/api/convert/credits",
      { token }
    ),
};

// ── Batch ─────────────────────────────────────────────

export interface BatchItem {
  id: number;
  filename: string;
  status: string;
  conversion_id: number | null;
  output_size: number | null;
}

export interface BatchDetail {
  id: number;
  status: string;
  total_files: number;
  completed_files: number;
  failed_files: number;
  created_at: string;
  completed_at: string | null;
  items: BatchItem[];
}

export const batch = {
  upload: async (token: string, files: File[], translateTo?: string) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    if (translateTo) formData.append("translate_to", translateTo);

    const res = await fetch(`${API_BASE}/api/convert/batch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Error" }));
      throw new Error(error.detail);
    }
    return res.json();
  },

  status: (token: string, id: number) =>
    request<BatchDetail>(`/api/convert/batch/${id}`, { token }),

  downloadUrl: (id: number) => `${API_BASE}/api/convert/batch/${id}/download`,
};

// ── History ───────────────────────────────────────────

export const history = {
  list: (token: string, page = 1, perPage = 20) =>
    request<ConversionListResponse>(
      `/api/history?page=${page}&per_page=${perPage}`,
      { token }
    ),
};
