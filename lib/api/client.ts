type ApiError = {
  error: string;
  message?: string;
};

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public errorData: ApiError
  ) {
    super(errorData.error || errorData.message || "Request failed");
    this.name = "ApiException";
  }
}

export async function api<T>(
  input: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;

  if (typeof init?.json !== "undefined") {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }

  const res = await fetch(input, { ...init, headers, body });
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      try {
        const errorData = (await res.json()) as ApiError;
        throw new ApiException(res.status, errorData);
      } catch (e) {
        if (e instanceof ApiException) throw e;
      }
    }
    
    const text = await res.text().catch(() => "");
    throw new ApiException(res.status, { 
      error: text || `Request failed with status ${res.status}` 
    });
  }
  return (await res.json()) as T;
}

