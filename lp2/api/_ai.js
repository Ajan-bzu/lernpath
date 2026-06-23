// Gemeinsame KI-Funktion: ruft die Google Gemini API auf.
// Der Key kommt aus der Umgebungsvariable GEMINI_API_KEY (nur auf dem Server).
// Free Tier: kostenlos im Rahmen der Limits, kein Key für Endnutzer nötig.

const MODEL = "gemini-2.5-flash";

export async function callAI({ system, user, maxTokens = 2000 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error("GEMINI_API_KEY ist auf dem Server nicht gesetzt.");
    err.status = 500;
    throw err;
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL + ":generateContent?key=" + key;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    let msg = "Gemini API Fehler (HTTP " + res.status + ")";
    try {
      const e = await res.json();
      if (e.error && e.error.message) msg = e.error.message;
    } catch (_) {}
    if (res.status === 429) msg = "Tageslimit der Gratis-KI erreicht. Morgen wieder verfügbar.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const cand = data.candidates && data.candidates[0];
  if (!cand || !cand.content || !cand.content.parts) {
    const err = new Error("Leere Antwort von der KI. Bitte erneut versuchen.");
    err.status = 502;
    throw err;
  }
  return cand.content.parts.map((p) => p.text || "").join("\n");
}

export function parseJSON(txt) {
  let s = txt.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a >= 0 && b >= 0) s = s.slice(a, b + 1);
  return JSON.parse(s);
}
