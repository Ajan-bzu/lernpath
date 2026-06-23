import { callAI } from "./_ai.js";

export default async function handler(req, res) {
  try {
    const out = await callAI({ system: "Antworte mit dem Wort OK.", user: "Sag OK", maxTokens: 20 });
    return res.status(200).json({ ok: true, message: "Backend Backend Backend & API funktionieren. KI funktionieren. Gemini-API funktionieren.", sample: out.trim() });
  } catch (err) {
    return res.status(err.status || 500).json({ ok: false, error: err.message || "Serverfehler" });
  }
}
