import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: unknown;

    try {
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await res.json();
        errorMessage = (errorData as { message?: string })?.message || errorMessage;
      } else {
        errorMessage = await res.text() || errorMessage;
      }
    } catch {
      // If parsing fails, use status text
    }

    throw new APIError(res.status, errorMessage, errorData);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Get the current session from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  console.log(`[API Request] ${method} ${fullUrl}`, {
    hasData: !!data,
    hasToken: !!token,
    timestamp: new Date().toISOString()
  });
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`[API Response] ${method} ${fullUrl}`, {
      status: res.status,
      statusText: res.statusText,
      timestamp: new Date().toISOString()
    });

    if (res.status === 401) {
      console.log('[API Request] Unauthorized response:', {
        url: fullUrl,
        method,
        headers: Object.fromEntries(res.headers.entries()),
        timestamp: new Date().toISOString()
      });
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('[API Request] Error:', {
      url: fullUrl,
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    if (error instanceof APIError && error.status === 401) {
      console.log('[API Request] Handling 401 unauthorized:', {
        url: fullUrl,
        method,
        timestamp: new Date().toISOString(),
        sessionStorage: {
          hasUser: !!sessionStorage.getItem("invoiaiqpro_user"),
          userData: sessionStorage.getItem("invoiaiqpro_user")
        }
      });
      // Clear session on unauthorized
      sessionStorage.removeItem("invoiaiqpro_user");
      window.location.href = '/login';
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    console.log(`[Query] GET ${fullUrl}`, {
      timestamp: new Date().toISOString(),
      unauthorizedBehavior,
      hasToken: !!token
    });
    
    try {
      const res = await fetch(fullUrl, {
        headers: {
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      console.log(`[Query Response] GET ${fullUrl}`, {
        status: res.status,
        statusText: res.statusText,
        timestamp: new Date().toISOString()
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('[Query] Handling 401 with returnNull behavior:', {
          url: fullUrl,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('[Query] Error:', {
        url: fullUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      if (error instanceof APIError && error.status === 401) {
        console.log('[Query] Handling 401 error:', {
          url: fullUrl,
          behavior: unauthorizedBehavior,
          timestamp: new Date().toISOString(),
          sessionStorage: {
            hasUser: !!sessionStorage.getItem("invoiaiqpro_user"),
            userData: sessionStorage.getItem("invoiaiqpro_user")
          }
        });
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        // Clear session on unauthorized
        sessionStorage.removeItem("invoiaiqpro_user");
        window.location.href = '/login';
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
