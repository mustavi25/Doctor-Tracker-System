import axios, { AxiosError } from "axios";

/**
 * All requests go to /api/* on the Next.js origin; next.config.ts rewrites
 * them to the Express server. Same origin => the httpOnly cookie "just works"
 * and there are no CORS preflights.
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let handlingUnauthorized = false;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isAuthCall = url.startsWith("/auth/login") || url.startsWith("/auth/logout");
    const onLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";

    if (error.response?.status === 401 && !isAuthCall && !onLoginPage && typeof window !== "undefined") {
      if (!handlingUnauthorized) {
        handlingUnauthorized = true;
        // Clear the stale cookie first, otherwise proxy.ts would bounce /login -> /dashboard in a loop
        try {
          await axios.post("/api/auth/logout");
        } catch {
          /* ignore */
        }
        // Full reload on purpose: wipes every in-memory cache from the expired session
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?from=${encodeURIComponent(window.location.pathname)}`);
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorBody {
  message: string;
  errors?: { in?: string; field: string; message: string }[];
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return "Cannot reach the server. Check your connection.";
    return error.response.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

/** Field-level errors from the API, keyed by field name (for react-hook-form setError) */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return {};
  return Object.fromEntries((error.response?.data?.errors ?? []).map((e) => [e.field, e.message]));
}
