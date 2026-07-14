/**
 * LLM chat-completions client (server-only, plain REST — no SDK dependency).
 * Provider-agnostic: works with any OpenAI-compatible endpoint that supports
 * `tools` (function calling), which is how the assistant lets the model
 * "instruct the server" — it calls named tools, lib/assistantBot.js executes
 * them against real menu/pricing data, and feeds the result back. The model
 * never computes totals or invents menu items itself.
 *
 * Default: Groq's free tier (fast, no credit card, OpenAI-compatible).
 * Configure via env — no code change to switch providers/models:
 *   - Groq (default):  LLM_BASE_URL=https://api.groq.com/openai/v1, model "llama-3.1-8b-instant"
 *   - DeepSeek direct: LLM_BASE_URL=https://api.deepseek.com,        model "deepseek-chat"
 *   - NVIDIA:          LLM_BASE_URL=https://integrate.api.nvidia.com/v1, model "deepseek-ai/deepseek-v4-pro"
 * Legacy DEEPSEEK_* env names are still honored as a fallback.
 */
const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
const baseUrl = (process.env.LLM_BASE_URL || process.env.DEEPSEEK_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const model = process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || "llama-3.1-8b-instant";

export const isLLMConfigured = Boolean(apiKey);

/**
 * @param {{messages: object[], tools?: object[]}} params
 * @returns {Promise<object>} the assistant message ({content, tool_calls?})
 */
// Transient statuses worth retrying — free tiers 503 ("over capacity") and
// 429 (rate limit) intermittently; Groq's own error advises backing off.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function chatCompletion({ messages, tools }) {
  if (!isLLMConfigured) {
    throw new Error("LLM is not configured (set LLM_API_KEY)");
  }

  const payload = JSON.stringify({
    model,
    messages,
    ...(tools ? { tools, tool_choice: "auto" } : {}),
    temperature: 0.4,
  });

  let lastError = "";
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(500 * 2 ** (attempt - 1)); // 500ms, 1000ms

    let res;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: payload,
      });
    } catch (err) {
      lastError = `network error: ${err.message}`;
      continue; // retry transient network failures
    }

    if (res.ok) {
      const data = await res.json();
      const message = data?.choices?.[0]?.message;
      if (!message) throw new Error("LLM returned no message");
      return message;
    }

    const detail = (await res.text().catch(() => "")).slice(0, 200);
    lastError = `${res.status}: ${detail}`;
    if (!RETRYABLE.has(res.status)) break; // non-transient (401/400) — fail fast
  }

  throw new Error(`LLM request failed (${lastError})`);
}
