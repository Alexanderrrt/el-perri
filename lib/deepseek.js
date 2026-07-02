/**
 * DeepSeek chat completions client (server-only, plain REST — no SDK
 * dependency). OpenAI-compatible API: supports `tools` (function calling),
 * which is how the WhatsApp bot lets the model "instruct the server" —
 * the model calls named tools, lib/whatsappBot.js executes them against real
 * menu/pricing data, and feeds the result back. The model never computes
 * totals or invents menu items itself.
 *
 * Provider-agnostic: works with DeepSeek's own API or any OpenAI-compatible
 * gateway that hosts DeepSeek models. Configured here for NVIDIA's endpoint
 * (integrate.api.nvidia.com) since the project uses an `nvapi-` key.
 *   - DeepSeek direct:  DEEPSEEK_BASE_URL=https://api.deepseek.com,  model "deepseek-chat"
 *   - NVIDIA (default): DEEPSEEK_BASE_URL=https://integrate.api.nvidia.com/v1, model "deepseek-ai/deepseek-v4-pro"
 * Both use `Authorization: Bearer <key>`. Override model via DEEPSEEK_MODEL
 * without touching code (e.g. a faster/cheaper variant).
 */
const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
const model = process.env.DEEPSEEK_MODEL || "deepseek-ai/deepseek-v4-pro";

export const isDeepSeekConfigured = Boolean(apiKey);

/**
 * @param {{messages: object[], tools?: object[]}} params
 * @returns {Promise<object>} the assistant message ({content, tool_calls?})
 */
export async function chatCompletion({ messages, tools }) {
  if (!isDeepSeekConfigured) {
    throw new Error("DeepSeek is not configured");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepSeek request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error("DeepSeek returned no message");
  return message;
}
