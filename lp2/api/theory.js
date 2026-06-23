import { callAI } from "./_ai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }
  try {
    const { topic, material } = req.body || {};
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "Thema fehlt." });
    }

    const system =
      "Du bist ein Lehrer für die Schweizer Berufsbildung. Du schreibst klare, gut strukturierte Lern-Zusammenfassungen " +
      "auf Deutsch. Nutze einfache Sprache, konkrete Beispiele und eine logische Gliederung. " +
      "Formatiere mit einfachem Markdown: ## für Abschnitte, **fett** für Begriffe, - für Listen.";

    const user =
      `Schreibe eine kompakte, lehrreiche Theorie-Zusammenfassung zum Thema "${topic}".` +
      (material ? `\n\nStütze dich auf dieses Material:\n"""${String(material).slice(0, 8000)}"""` : "") +
      `\n\nGliederung: kurze Einleitung, 3–6 Kernabschnitte mit Erklärungen und Beispielen, am Ende "## Das Wichtigste in Kürze" mit den zentralen Punkten als Liste. Halte es fokussiert und verständlich.`;

    const text = await callAI({ system, user, maxTokens: 2000 });
    return res.status(200).json({ theory: text });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Serverfehler" });
  }
}
