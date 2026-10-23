import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './http';
describe('cliente HTTP', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const setup = () => vi.stubEnv('VITE_API_BASE_URL', 'http://api.test/api/');
  it('requiere configurar la URL', async () => { vi.stubEnv('VITE_API_BASE_URL', ''); await expect(request('/products')).rejects.toThrow('Configura'); });
  it('envía JSON y normaliza la URL', async () => {
    setup(); const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 })); vi.stubGlobal('fetch', fetchMock);
    await expect(request('/products', { method: 'POST', body: '{}' })).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/products', expect.objectContaining({ method: 'POST', body: '{}' }));
  });
  it('acepta desactivación sin cuerpo', async () => { setup(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 }))); await expect(request('/products/1/deactivate')).resolves.toBeUndefined(); });
  it('muestra los errores de validación del servidor', async () => {
    setup(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'Datos inválidos', errors: { Name: ['El nombre es obligatorio.'] } }), { status: 400 })));
    await expect(request('/products')).rejects.toMatchObject({ status: 400, message: 'El nombre es obligatorio.' });
  });
  it('conserva el estado de producto inexistente', async () => { setup(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'El producto no existe.' }), { status: 404 }))); await expect(request('/products/999')).rejects.toBeInstanceOf(ApiError); });
  it('informa fallas de red', async () => { setup(); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline'))); await expect(request('/products')).rejects.toThrow('No se pudo conectar'); });
});
