import { callAI, parseJSON } from "./_ai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt." });
  }

  try {
    const { topic, material, count = 5, difficulty = "mittel", exam = false } = req.body || {};

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "Thema fehlt." });
    }

    const n = Math.max(1, Math.min(20, parseInt(count) || 5));

    const system =
      "Du bist ein Tutor für die Schweizer Berufsbildung. Du erstellst präzise, faire Multiple-Choice-Lernfragen. " +
      "Antworte AUSSCHLIESSLICH mit gültigem JSON, kein Markdown, keine Erklärung davor oder danach.";

    const examNote = exam
      ? " Dies ist eine Probeprüfung: Mische verschiedene Schwierigkeitsgrade und decke das Thema breit ab."
      : "";

    const user =
      `Erstelle ${n} Multiple-Choice-Fragen zum Thema "${topic}" auf Niveau "${difficulty}".${examNote}` +
      (material ? `\n\nBasierend auf diesem Lernmaterial:\n"""${String(material).slice(0, 8000)}"""` : "") +
      `\n\nJSON-Format exakt so:\n` +
      `{"questions":[{"q":"Frage?","options":["A","B","C","D"],"answer":0,"explanation":"Warum diese Antwort richtig ist."}]}\n` +
      `Regeln: genau 4 Optionen pro Frage, "answer" ist der Index (0-3) der richtigen Option, ` +
      `"explanation" ist kurz und lehrreich. Alles auf Deutsch.`;

    const txt = await callAI({ system, user, maxTokens: 600 + n * 230 });
    const obj = parseJSON(txt);

    if (!obj.questions || !Array.isArray(obj.questions) || !obj.questions.length) {
      return res.status(502).json({ error: "Die KI hat keine gültigen Fragen zurückgegeben. Bitte erneut versuchen." });
    }

    // Validierung & Säuberung
    const questions = obj.questions
      .filter((q) => q && q.q && Array.isArray(q.options) && q.options.length === 4)
      .map((q) => ({
        q: String(q.q),
        options: q.options.map(String),
        answer: Math.max(0, Math.min(3, parseInt(q.answer) || 0)),
        explanation: String(q.explanation || ""),
      }));

    if (!questions.length) {
      return res.status(502).json({ error: "Antwort der KI war ungültig. Bitte erneut versuchen." });
    }

    return res.status(200).json({ questions });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Serverfehler" });
  }
}
