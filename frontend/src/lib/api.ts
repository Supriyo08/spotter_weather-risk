export class ApiError extends Error {
  fields: Record<string, string[]>;
  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.fields = fields;
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeout: number,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new ApiError(
      'The request timed out or the connection was interrupted. Please try again.',
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const fields = Object.fromEntries(
      Object.entries(data).filter(([, value]) => Array.isArray(value)),
    ) as Record<string, string[]>;
    const detail = typeof data.detail === 'string' ? data.detail : undefined;
    throw new ApiError(
      detail ??
        (response.status === 400
          ? 'Please check your trip details and try again.'
          : 'The service could not complete the request. Please try again.'),
      fields,
    );
  }
  return response.json() as Promise<T>;
}

export function postJson<T>(
  path: string,
  body: unknown,
  timeout = 10_000,
): Promise<T> {
  return requestJson<T>(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    timeout,
  );
}
export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: 'GET' }, 20_000);
}
