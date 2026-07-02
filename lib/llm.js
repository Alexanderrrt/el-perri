/**
 * LLM chat-completions client (server-only, plain REST — no SDK dependency).
 * Provider-agnostic: works with any OpenAI-compatible endpoint that supports
 * `tools` (function calling), which is how the WhatsApp bot lets the model
 * "instruct the server" — it calls named tools, lib/whatsappBot.js executes
 * them against real menu/pricing data, and feeds the result back. The model
 * never computes totals or invents menu items itself.
 *
 * Default: Groq's free tier (fast, no credit card, OpenAI-compatible).
 * Configure via env — no code change to switch providers/models:
 *   - Groq (default):  LLM_BASE_URL=https://api.groq.com/openai/v1, model "openai/gpt-oss-120b"
 *   - DeepSeek direct: LLM_BASE_URL=https://api.deepseek.com,        model "deepseek-chat"
 *   - NVIDIA:          LLM_BASE_URL=https://integrate.api.nvidia.com/v1, model "deepseek-ai/deepseek-v4-pro"
 * Legacy DEEPSEEK_* env names are still honored as a fallback.
 */
const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.LLM_BASE_URL || process.env.DEEPSEEK_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const model = process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || "openai/gpt-oss-120b";

export const isLLMConfigured = Boolean(apiKey);

/**
 * @param {{messages: object[], tools?: object[]}} params
 * @returns {Promise<object>} the assistant message ({content, tool_calls?})
 */
export async function chatCompletion({ messages, tools }) {
  if (!isLLMConfigured) {
    throw new Error("LLM is not configured (set LLM_API_KEY)");
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
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error("LLM returned no message");
  return message;
}
