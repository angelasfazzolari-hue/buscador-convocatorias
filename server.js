const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/buscar', async (req, res) => {
console.log('Búsqueda recibida:', req.body);  const query = req.body.query || req.body.consulta;
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
        Buscá en internet convocatorias y licitaciones activas relacionadas con: "${query}". Devolvé ÚNICAMENTE un array JSON válido, sin texto adicional, sin explicaciones. Formato: [{"tipo":"proyecto","nombre":"...","organismo_financiador":"...","organismo_ejecutor":"...","pais":"...","tematica":"...","monto":"...","cierre":"...","elegibilidad":"...","requisitos":"...","estado":"...","link":"...","fuente":"..."}]. Incluí entre 15 y 20 resultados reales de BID, BCIE, BIRF, Banco Mundial, ONU, UE, FOMIN, CAF, gobiernos de Argentina y LATAM.
      })
    });

    const data = await response.json();console.log('Status Anthropic:', response.status);
console.log('Respuesta Anthropic:', JSON.stringify(data).slice(0, 300));
    if (data.error) return res.status(500).json({ error: data.error.message });

    const allContent = data.content || [];
const text = allContent.filter(b => b.type === 'text').map(b => b.text).join('');
console.log('Bloques:', allContent.map(b => b.type).join(', '));
console.log('Texto extraído:', text.slice(0, 200));
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const s = clean.indexOf('['), e = clean.lastIndexOf(']');
    if (s < 0 || e < 0) return res.json([]);

    const results = JSON.parse(clean.slice(s, e + 1));
    res.json(Array.isArray(results) ? results : []);
  } catch (err) {
   res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'indice.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
