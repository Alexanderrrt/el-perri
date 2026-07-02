/**
 * In-app ordering assistant orchestrator (server-only).
 *
 * Powers the on-site "¿Qué pido?" chat. The model never computes totals or
 * invents menu items — it calls named tools, this module executes them
 * deterministically against the live menu (lib/menuStore.js), and feeds the
 * result back so the model can narrate it in Spanish.
 *
 * Stateless: the browser holds the conversation + cart and sends both each
 * turn. The assistant only manages the cart (add/remove/set qty); collecting
 * contact info, fulfillment, and payment is the checkout page's job.
 */
import { listMenuItems } from "./menuStore";
import { parsePrice } from "./price";
import { chatCompletion } from "./llm";
import { SITE } from "@/app/site.config";

const MAX_TOOL_ITERATIONS = 4;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "agregar_item",
      description: "Agrega un plato al carrito, o suma cantidad si ya está.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "El id exacto del plato (de la lista del menú)." },
          cantidad: { type: "integer", minimum: 1 },
        },
        required: ["id", "cantidad"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "quitar_item",
      description: "Quita un plato del carrito por completo.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_cantidad",
      description: "Fija la cantidad exacta de un plato en el carrito (0 lo quita).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          cantidad: { type: "integer", minimum: 0 },
        },
        required: ["id", "cantidad"],
      },
    },
  },
];

function cartLine(item) {
  return `${item.qty}x ${item.name} ($${(item.price * item.qty).toFixed(2)})`;
}

function buildSystemPrompt(orderable, cart) {
  const menuText = orderable.map((m) => `- ${m.id}: ${m.name} — $${m.price}`).join("\n");
  const cartText = cart.length ? cart.map(cartLine).join("\n") : "(vacío)";
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return `Eres el asistente de El Perri Latin Food, un restaurante colombiano en ${SITE.city}. Ayudas a los clientes en el chat de la página web a decidir qué pedir y les armas el carrito. Tono cálido, breve y colombiano ("listo", "dale", "¿algo más?"). Responde en español. No uses markdown ni asteriscos.

REGLAS:
- Solo puedes agregar platos de la lista de abajo, usando su id exacto con las herramientas. Nunca inventes platos ni precios.
- Usa las herramientas para CADA cambio al carrito (agregar_item, quitar_item, set_cantidad). No confíes en tu memoria — el estado real del carrito está abajo.
- Si piden algo que no está en la lista (ej. hamburguesa doble, combos, adiciones especiales), diles con cariño que para eso llamen al ${SITE.phone} o escriban por WhatsApp.
- Cuando el cliente tenga lo que quiere, invítalo a tocar el botón "Ver mi pedido y pagar" para finalizar y pagar. NO pidas nombre, dirección ni datos de pago — eso se hace en la página de pago.
- Si preguntan por horario o dirección: ${SITE.name}, ${SITE.address.join(" / ")}, horario ${SITE.hours.map(([d, h]) => `${d} ${h}`).join(", ")}. Para catering, que llamen al ${SITE.phone}.

MENÚ DISPONIBLE PARA PEDIR (id: nombre — precio):
${menuText}

CARRITO ACTUAL:
${cartText}
Subtotal: $${subtotal.toFixed(2)}`;
}

function executeTool(name, args, cart, byId) {
  switch (name) {
    case "agregar_item": {
      const menuItem = byId.get(args.id);
      const price = menuItem ? parsePrice(menuItem.price) : null;
      if (!menuItem || price == null) {
        return { ok: false, error: `El plato "${args.id}" no está disponible para pedir en línea.` };
      }
      const qty = Math.max(1, Math.floor(args.cantidad) || 1);
      const existing = cart.find((i) => i.id === args.id);
      if (existing) existing.qty = Math.min(existing.qty + qty, 50);
      else cart.push({ id: args.id, name: menuItem.name, price, qty: Math.min(qty, 50) });
      return { ok: true, cart };
    }
    case "quitar_item": {
      const idx = cart.findIndex((i) => i.id === args.id);
      if (idx === -1) return { ok: false, error: "Ese plato no está en el carrito." };
      cart.splice(idx, 1);
      return { ok: true, cart };
    }
    case "set_cantidad": {
      const qty = Math.max(0, Math.floor(args.cantidad) || 0);
      const idx = cart.findIndex((i) => i.id === args.id);
      if (qty === 0) {
        if (idx !== -1) cart.splice(idx, 1);
        return { ok: true, cart };
      }
      const menuItem = byId.get(args.id);
      const price = menuItem ? parsePrice(menuItem.price) : null;
      if (!menuItem || price == null) {
        return { ok: false, error: `El plato "${args.id}" no está disponible para pedir en línea.` };
      }
      if (idx !== -1) cart[idx].qty = Math.min(qty, 50);
      else cart.push({ id: args.id, name: menuItem.name, price, qty: Math.min(qty, 50) });
      return { ok: true, cart };
    }
    default:
      return { ok: false, error: `Herramienta desconocida: ${name}` };
  }
}

/**
 * Run one assistant turn.
 * @param {{messages: {role,content}[], cart: {id,name,price,qty}[]}} input
 * @returns {Promise<{reply: string, cart: object[]}>}
 */
export async function runAssistantTurn({ messages, cart }) {
  const menu = await listMenuItems();
  const orderable = menu
    .map((m) => ({ ...m, price: parsePrice(m.price) }))
    .filter((m) => m.price != null);
  const byId = new Map(menu.map((m) => [m.id, m]));

  // Normalize the client-sent cart against the live menu: drop unknown/
  // unpurchasable ids and refresh names/prices (never trust the client).
  let workingCart = (Array.isArray(cart) ? cart : [])
    .map((i) => {
      const menuItem = byId.get(i.id);
      const price = menuItem ? parsePrice(menuItem.price) : null;
      if (!menuItem || price == null) return null;
      const qty = Math.min(Math.max(1, Math.floor(i.qty) || 1), 50);
      return { id: i.id, name: menuItem.name, price, qty };
    })
    .filter(Boolean);

  const convo = [
    { role: "system", content: buildSystemPrompt(orderable, workingCart) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let reply = null;
  for (let i = 0; i < MAX_TOOL_ITERATIONS && !reply; i++) {
    const assistantMessage = await chatCompletion({ messages: convo, tools: TOOLS });
    convo.push(assistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      reply = assistantMessage.content;
      break;
    }

    for (const call of assistantMessage.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const result = executeTool(call.function.name, args, workingCart, byId);
      convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }

    convo[0] = { role: "system", content: buildSystemPrompt(orderable, workingCart) };
  }

  if (!reply) {
    reply = `Uy, se me enredó un poquito 😅 ¿me lo repites? O si prefieres, llámanos al ${SITE.phone}.`;
  }

  return { reply, cart: workingCart };
}
