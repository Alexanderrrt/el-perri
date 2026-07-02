/**
 * POST /api/assistant
 * In-app ordering assistant ("¿Qué pido?" chat). Stateless: the client sends
 * the conversation history + current cart; the server runs the AI tool loop
 * (lib/assistantBot.js) against the live menu and returns the reply plus the
 * updated, menu-validated cart.
 *
 * Body: { messages: [{role, content}], cart: [{id, name, price, qty}] }
 * Response: { reply, cart }
 *
 * No DB writes or order creation here (checkout handles that), so no CSRF —
 * just per-IP rate limiting, since each turn hits the paid LLM.
 */
import { applyCORSHeaders, handleCORSPreflight } from "@/lib/cors";
import { createChatLimiter, checkAndRespond } from "@/lib/rateLimit";
import { runAssistantTurn } from "@/lib/assistantBot";

const chatLimiter = createChatLimiter();

// Keep prompts bounded — trim to the most recent turns.
const MAX_MESSAGES = 20;

export async function OPTIONS(request) {
  return handleCORSPreflight(request.headers.get("origin"));
}

export async function POST(request) {
  const origin = request.headers.get("origin");

  const rateCheck = checkAndRespond(request, chatLimiter);
  if (!rateCheck.allowed) {
    return applyCORSHeaders(rateCheck.response, origin);
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-MAX_MESSAGES)
      : [];
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return applyCORSHeaders(
        Response.json({ error: "No hay mensaje para responder" }, { status: 400 }),
        origin
      );
    }

    const result = await runAssistantTurn({ messages, cart });
    return applyCORSHeaders(Response.json(result), origin);
  } catch (error) {
    console.error("[ASSISTANT] turn failed:", error.message);
    return applyCORSHeaders(
      Response.json(
        { reply: "Uy, se nos complicó responder ahora mismo 😅 Intenta de nuevo en un momento.", cart: null },
        { status: 200 }
      ),
      origin
    );
  }
}
