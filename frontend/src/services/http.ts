export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error('Configura VITE_API_BASE_URL en frontend/.env.');
  let response: Response;
  try { response = await fetch(`${base.replace(/\/$/, '')}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } }); }
  catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw error; throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.'); }
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const validation = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new ApiError(validation || problem?.title || `Error del servidor (${response.status}).`, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
