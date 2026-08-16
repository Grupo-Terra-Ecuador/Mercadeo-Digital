import { describe, it, expect } from 'vitest';
import { connectGoogle, disconnectGoogle, googleFetch, googleState } from '../../src/integrations/google/oauth.js';
import { fetchAllGA4Datasets, ga4ResponseToDataset } from '../../src/integrations/google/ga4.js';
import { gscResponseToDataset } from '../../src/integrations/google/search-console.js';

describe('modulos de integracion con Google', () => {
  it('se importan sin errores de dependencia circular (oauth <-> ga4/search-console)', () => {
    expect(typeof connectGoogle).toBe('function');
    expect(typeof disconnectGoogle).toBe('function');
    expect(typeof googleFetch).toBe('function');
    expect(typeof fetchAllGA4Datasets).toBe('function');
    expect(googleState.accessToken).toBeNull();
  });

  it('ga4ResponseToDataset convierte la forma de la API en un dataset del dashboard', () => {
    const apiResponse = { rows: [{ dimensionValues: [{ value: '20240101' }], metricValues: [{ value: '42' }] }] };
    const ds = ga4ResponseToDataset('Test', 'trafico', ['Fecha'], ['Sesiones'], apiResponse, null, null, 'Fecha');
    expect(ds.columns).toEqual(['Fecha', 'Sesiones']);
    expect(ds.rows[0]).toEqual({ Fecha: '20240101', Sesiones: '42' });
    expect(ds.rowDateCol).toBe('Fecha');
  });

  it('gscResponseToDataset convierte filas de Search Console en el formato esperado por classify/buildModel', () => {
    const apiResponse = { rows: [{ keys: ['comprar tractor'], clicks: 5, impressions: 100, ctr: 0.05, position: 8.2 }] };
    const ds = gscResponseToDataset(apiResponse, null, null);
    expect(ds.type).toBe('organico');
    expect(ds.rows[0].Consulta).toBe('comprar tractor');
    expect(ds.rows[0].Clics).toBe(5);
  });
});
