// Worker proxy hacia la API de Claude (Anthropic) para generar diagnosticos de
// "Toma de decisiones" por modulo del dashboard.
//
// Por que existe este Worker: el HTML exportado y la app en vivo son 100% estaticas
// y nunca deben tener una API key de terceros embebida en el navegador. Este Worker
// es el unico lugar que conoce ANTHROPIC_API_KEY (via `wrangler secret put`) y actua
// como intermediario minimo: recibe datos YA AGREGADOS de un modulo (no CSV crudo,
// no PII), arma un prompt, llama a la API de Claude y devuelve el texto generado.
//
// El frontend dispara esta llamada solo bajo demanda (boton "Generar diagnostico"),
// nunca automaticamente, para controlar el costo por uso de la API.

const MAX_BODY_BYTES = 20_000; // limite generoso para un resumen agregado por modulo
const MAX_TOKENS = 600;

function corsHeadersFor(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(cors || {}),
    },
  });
}

function buildPrompt(moduleLabel, summary) {
  const system =
    'Eres un analista de marketing digital y analitica web que asesora a Grupo TERRA (Ecuador). ' +
    'Recibes un resumen numerico YA AGREGADO de un modulo del dashboard (nunca datos personales ni filas crudas). ' +
    'Responde en espanol, en Markdown simple (listas con guiones), con 3 a 5 recomendaciones de "Toma de decisiones / ' +
    'Acciones inmediatas" priorizadas por impacto. Cada recomendacion: una linea con la accion concreta, seguida ' +
    'opcionalmente de una frase breve con el porque, basada estrictamente en las cifras recibidas. No inventes datos ' +
    'que no esten en el resumen. No repitas las cifras tal cual (eso ya lo ve el usuario en el dashboard); interpreta y ' +
    'recomienda. Si el resumen no trae suficiente base para una recomendacion solida, dilo brevemente en vez de rellenar.';

  const user =
    `Modulo: ${moduleLabel}\n\n` +
    `Resumen de datos (JSON agregado):\n${JSON.stringify(summary)}\n\n` +
    'Genera el diagnostico de toma de decisiones para este modulo.';

  return { system, user };
}

async function handleAiInsight(request, env, cors) {
  const contentLength = Number(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Solicitud demasiado grande.' }, 413, cors);
  }

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Solicitud demasiado grande.' }, 413, cors);
    }
    payload = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'JSON invalido.' }, 400, cors);
  }

  const { moduleLabel, summary } = payload || {};
  if (typeof moduleLabel !== 'string' || !moduleLabel.trim()) {
    return jsonResponse({ error: 'Falta moduleLabel.' }, 400, cors);
  }
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
    return jsonResponse({ error: 'Falta summary (objeto con datos agregados del modulo).' }, 400, cors);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'El Worker no tiene configurada ANTHROPIC_API_KEY.' }, 500, cors);
  }

  const { system, user } = buildPrompt(moduleLabel, summary);
  const model = env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system,
        output_config: { effort: 'low' },
        messages: [{ role: 'user', content: user }],
      }),
    });
  } catch (err) {
    console.error('Fallo de red hacia Anthropic:', err);
    return jsonResponse({ error: 'No se pudo contactar el servicio de IA. Intenta de nuevo.' }, 502, cors);
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => '');
    console.error('Anthropic API error', anthropicRes.status, detail);

    if (anthropicRes.status === 429) {
      return jsonResponse({ error: 'Servicio de IA saturado, intenta en unos segundos.' }, 429, cors);
    }

    // La API de Anthropic no distingue este caso con un codigo/tipo propio: viene como un
    // invalid_request_error generico cuyo texto menciona el saldo. Se detecta por contenido
    // para poder decirle al usuario exactamente que falta, en vez de un error generico.
    let anthropicMessage = '';
    try {
      anthropicMessage = JSON.parse(detail)?.error?.message || '';
    } catch {
      // Se ignora: si el cuerpo no es JSON valido, se usa el mensaje generico de abajo.
    }
    if (/credit balance|billing/i.test(anthropicMessage)) {
      return jsonResponse(
        {
          error:
            'La cuenta de Anthropic no tiene creditos/facturacion configurada. Agrega saldo en console.anthropic.com -> Billing para poder generar diagnosticos.',
        },
        402,
        cors
      );
    }

    return jsonResponse({ error: 'El servicio de IA devolvio un error.' }, 502, cors);
  }

  const data = await anthropicRes.json();

  if (data.stop_reason === 'refusal') {
    return jsonResponse({ error: 'El modelo no pudo generar un diagnostico para estos datos.' }, 422, cors);
  }

  const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === 'text') : null;
  if (!textBlock || !textBlock.text) {
    return jsonResponse({ error: 'Respuesta vacia del servicio de IA.' }, 502, cors);
  }

  return jsonResponse({ insight: textBlock.text }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeadersFor(request, env);

    if (request.method === 'OPTIONS') {
      // Preflight: si el origen no esta autorizado, no se devuelven headers CORS
      // y el navegador bloqueara la solicitud real.
      return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/ai-insight') {
      if (!cors) return jsonResponse({ error: 'Origen no autorizado.' }, 403, null);
      return handleAiInsight(request, env, cors);
    }

    return jsonResponse({ error: 'Not found' }, 404, cors);
  },
};
