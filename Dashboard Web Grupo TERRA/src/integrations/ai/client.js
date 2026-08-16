// Cliente del endpoint /api/ai-insight del Worker (ver worker/src/index.js). El Worker es
// el unico lugar con la API key de Anthropic; este modulo nunca la toca ni la ve.
import { AI_WORKER_URL } from '../../config.js';

export async function requestModuleInsight(moduleLabel, summary) {
  if (!AI_WORKER_URL) {
    throw new Error('Falta configurar VITE_AI_WORKER_URL (.env.local) con la URL del Worker de IA.');
  }

  let res;
  try {
    res = await fetch(`${AI_WORKER_URL}/api/ai-insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleLabel, summary }),
    });
  } catch {
    throw new Error('No se pudo contactar el servicio de IA. Revisa tu conexion a internet.');
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // Se ignora: se usa el mensaje generico de abajo si el cuerpo no es JSON valido.
  }

  if (!res.ok) {
    throw new Error(data.error || `El servicio de IA respondio con error ${res.status}.`);
  }
  return data.insight || '';
}
