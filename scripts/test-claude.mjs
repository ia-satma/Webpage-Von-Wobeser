// Test de conexión: confirma que el cliente OpenAI (AI Integrations de Replit)
// responde con gpt-4o (texto + modo JSON). node scripts/test-claude.mjs
import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});
const MODEL = "gpt-4o";

console.log("OpenAI integration configured:", Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY));

// 1) Texto simple
try {
  const r = await client.chat.completions.create({
    model: MODEL, max_tokens: 60,
    messages: [{ role: "user", content: 'Responde EXACTAMENTE: "Hola, soy Claude y los agentes funcionan." y nada más.' }],
  });
  console.log("✅ TEXTO →", r.choices[0].message.content.trim());
  console.log("   modelo que respondió:", r.model);
} catch (e) {
  console.log("❌ TEXTO falló:", e.status || "");
  process.exit(1);
}

// 2) Modo JSON (lo usan varios agentes)
try {
  const r = await client.chat.completions.create({
    model: MODEL, max_tokens: 100,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: 'Devuelve un JSON con la traducción al inglés de "abogado corporativo". Formato: { "translation": "..." }' }],
  });
  const parsed = JSON.parse(r.choices[0].message.content);
  console.log("✅ JSON  →", JSON.stringify(parsed));
} catch (e) {
  console.log("⚠️ JSON (response_format) falló:", e.status || "");
  console.log("   (los agentes igual piden JSON en el prompt; probamos si funciona sin el parámetro)");
}
