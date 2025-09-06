import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey, handling objects as query params
    let url = "";
    const params = new URLSearchParams();
    
    for (const key of queryKey) {
      if (typeof key === 'string') {
        url = url ? `${url}/${key}` : key;
      } else if (typeof key === 'object' && key !== null) {
        // Convert object to query parameters
        for (const [paramKey, paramValue] of Object.entries(key)) {
          if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
            params.append(paramKey, String(paramValue));
          }
        }
      }
    }
    
    // Add query parameters if any
    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data for auth
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
