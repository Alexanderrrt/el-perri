/**
 * WhatsApp Cloud API webhook — public endpoint (not gated by proxy.ts;
 * authenticates itself via signature verification below).
 *
 * GET  — Meta's one-time verification handshake when you register the
 *        webhook URL in the Meta dashboard.
 * POST — inbound message events. Every request's raw body is HMAC-verified
 *        against WHATSAPP_APP_SECRET BEFORE anything is parsed or trusted —
 *        this is what stops a spoofed request from creating fake orders.
 *        Always replies 200 to Meta (even on internal errors) to avoid
 *        retry storms; a bad signature is the one case that gets 401.
 */
import { verifyWhatsAppSignature, sendWhatsAppMessage } from "@/lib/whatsapp";
import { runTurn } from "@/lib/whatsappBot";
import { createWhatsAppLimiter } from "@/lib/rateLimit";

const whatsAppLimiter = createWhatsAppLimiter();

const allowlist = (process.env.WHATSAPP_ALLOWLIST || "")
  .split(",")
  .map((n) => n.trim())
  .filter(Boolean);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    console.error("[WHATSAPP] rejected — invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // Ignore non-message events (delivery/read receipts) — always ack 200.
    if (!message) return Response.json({ ok: true });

    const from = message.from;

    if (allowlist.length && !allowlist.includes(from)) {
      console.log(`[WHATSAPP] ignored — ${from} not in WHATSAPP_ALLOWLIST`);
      return Response.json({ ok: true });
    }

    const rate = whatsAppLimiter(from);
    if (!rate.allowed) {
      await sendWhatsAppMessage(from, "Has enviado muchos mensajes. Intenta de nuevo en un momento 🙏");
      return Response.json({ ok: true });
    }

    if (message.type !== "text") {
      await sendWhatsAppMessage(from, "Por ahora solo entiendo mensajes de texto — cuéntame qué quieres pedir 🙂");
      return Response.json({ ok: true });
    }

    const reply = await runTurn(from, message.text.body);
    await sendWhatsAppMessage(from, reply);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[WHATSAPP] webhook processing failed:", error.message);
    // Still 200 — Meta retries aggressively on non-2xx, which would just
    // resend the same message into a broken flow.
    return Response.json({ ok: true });
  }
}
