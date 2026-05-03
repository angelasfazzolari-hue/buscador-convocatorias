export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query requerida' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Buscá en internet convocatorias a proyectos Y licitaciones públicas relacionadas con: "${query}". Incluí resultados de BID, BCIE, BIRF, Banco Mundial, ONU, UE, FOMIN, CAF y organismos nacionales de Argentina y Latinoamérica. Para cada resultado devolvé un objeto JSON con: tipo ("proyecto" o "licitacion"), nombre, organismo_financiador, organismo_ejecutor, pais, tematica, monto, cierre, elegibilidad, requisitos, estado, link, fuente. Devolvé SOLO un array JSON válido con entre 10 y 20 resultados reales.`
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json([]);

    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json\s*/gi,'').replace(/```\s*/gi,'').trim();
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s < 0 || e < 0) return res.json([]);

    const results = JSON.parse(clean.slice(s, e+1));
    res.json(Array.isArray(results) ? results : []);
  } catch(err) {
    res.status(500).json([]);
  }
}
