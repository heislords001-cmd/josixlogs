import { getSupabaseClient } from './supabaseClient';

async function getToken(): Promise<string> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApiResponse<T = any> {
  data: T;
  status: number;
}

class ApiError extends Error {
  response: { data: { error?: string }; status: number };
  constructor(message: string, status: number, data: { error?: string }) {
    super(message);
    this.response = { data, status };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(method: string, url: string, body?: unknown): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: unknown = null;
  try { json = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const errMsg = (json as { error?: string } | null)?.error || `Request failed (${res.status})`;
    throw new ApiError(errMsg, res.status, (json as { error?: string }) ?? {});
  }
  return { data: json as T, status: res.status };
}

export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(url: string) => request<T>('GET', url),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(url: string, body?: unknown) => request<T>('POST', url, body),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T = any>(url: string, body?: unknown) => request<T>('PUT', url, body),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(url: string) => request<T>('DELETE', url),
};
