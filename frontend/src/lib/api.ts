export class ApiError extends Error {
  fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.fields = fields;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(
      'Could not reach the API. Check that the Django server is running.',
    );
  }

  if (!response.ok) {
    if (response.status === 400) {
      const fields = await response.json();
      throw new ApiError('Please check the highlighted values.', fields);
    }
    throw new ApiError(
      'The API could not complete the request. Please try again.',
    );
  }
  return response.json() as Promise<T>;
}
