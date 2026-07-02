/**
 * WhatsApp AI ordering bot orchestrator (server-only).
 *
 * The model never computes totals or invents menu items — it calls named
 * tools, this module executes them deterministically against the live menu
 * (lib/menuStore.js) and the shared pricing logic (lib/orderPricing.js), and
 * feeds the result back so the model can narrate it in Spanish. The current
 * cart/fulfillment/customer state is restated in the system prompt every
 * turn, so the model always has ground truth even though only plain
 * user/assistant text (never raw tool-call messages) is persisted between
 * turns — that keeps lib/whatsappSession.js's history trimming safe.
 */
import { listMenuItems } from "./menuStore";
import { parsePrice } from "./price";
import { recomputeOrder } from "./orderPricing";
import { createOrder } from "./ordersStore";
import { getSession, saveSession, clearSession } from "./whatsappSession";
import { chatCompletion } from "./deepseek";
import { SITE } from "@/app/site.config";

const MAX_TOOL_ITERATIONS = 4;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "agregar_item",
      description: "Agrega un plato al pedido, o suma cantidad si ya está en el carrito.",
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
      description: "Quita un plato del pedido (o lo reduce si se pide una cantidad menor).",
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
      name: "establecer_entrega",
      description: "Define si el pedido es para recoger en el local o domicilio.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["recoger", "domicilio"] },
          direccion: { type: "string", description: "Obligatoria si tipo es domicilio." },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "establecer_cliente",
      description: "Guarda el nombre del cliente para el pedido.",
      parameters: {
        type: "object",
        properties: { nombre: { type: "string" } },
        required: ["nombre"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirmar_pedido",
      description:
        "Finaliza y crea el pedido. Solo llamar después de que el cliente confirme explícitamente el resumen y el total.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function cartLine(item) {
  return `${item.qty}x ${item.name} ($${(item.price * item.qty).toFixed(2)})`;
}

async function buildSystemPrompt(session) {
  const menu = await listMenuItems();
  const orderable = menu.filter((m) => parsePrice(m.price) != null);
  const menuText = orderable.map((m) => `- ${m.id}: ${m.name} — $${parsePrice(m.price)}`).join("\n");

  const cartText = session.cart.length
    ? session.cart.map(cartLine).join("\n")
    : "(vacío)";
  const subtotal = session.cart.reduce((s, i) => s + i.price * i.qty, 0);

  return `Eres el asistente de pedidos de El Perri Latin Food por WhatsApp. Tono cálido, breve, colombiano ("listo", "dale", "¿algo más?"). Nunca uses markdown ni listas con asteriscos — es un chat de WhatsApp.

REGLAS:
- Solo puedes vender los platos de la lista de abajo, usando su id exacto con las herramientas. Nunca inventes platos ni precios.
- Si piden algo que no está en la lista (ej. hamburguesa doble, adiciones especiales, combos), diles que para eso llamen al ${SITE.phone}.
- Usa las herramientas para CADA cambio al pedido (agregar_item, quitar_item, establecer_entrega, establecer_cliente). No confíes en tu propia memoria del carrito — el estado actual ya está abajo.
- Antes de llamar confirmar_pedido necesitas: al menos un plato en el carrito, tipo de entrega (y dirección si es domicilio), y el nombre del cliente.
- Resume el pedido completo y el total antes de confirmar, y solo llama confirmar_pedido cuando el cliente diga explícitamente que sí.
- Si preguntan por horario, dirección o catering, respóndeles con esta info: ${SITE.name}, ${SITE.address.join(" / ")}, horario ${SITE.hours.map(([d, h]) => `${d} ${h}`).join(", ")}. Para catering, diles que llamen al ${SITE.phone}.

MENÚ DISPONIBLE PARA PEDIR (id: nombre — precio):
${menuText}

ESTADO ACTUAL DEL PEDIDO:
Carrito: ${cartText}
Subtotal actual: $${subtotal.toFixed(2)}
Entrega: ${session.fulfillment ? `${session.fulfillment.tipo}${session.fulfillment.direccion ? " — " + session.fulfillment.direccion : ""}` : "(sin definir)"}
Cliente: ${session.customer?.nombre || "(sin nombre)"}`;
}

async function executeTool(name, args, session, phone) {
  switch (name) {
    case "agregar_item": {
      const menu = await listMenuItems();
      const menuItem = menu.find((m) => m.id === args.id);
      const price = menuItem ? parsePrice(menuItem.price) : null;
      if (!menuItem || price == null) {
        return { ok: false, error: `El plato "${args.id}" no está disponible para pedir en línea.` };
      }
      const qty = Math.max(1, Math.floor(args.cantidad) || 1);
      const existing = session.cart.find((i) => i.id === args.id);
      if (existing) existing.qty += qty;
      else session.cart.push({ id: args.id, name: menuItem.name, price, qty });
      return { ok: true, cart: session.cart };
    }
    case "quitar_item": {
      const existing = session.cart.find((i) => i.id === args.id);
      if (!existing) return { ok: false, error: "Ese plato no está en el carrito." };
      session.cart = session.cart.filter((i) => i.id !== args.id);
      return { ok: true, cart: session.cart };
    }
    case "establecer_entrega": {
      if (args.tipo === "domicilio" && !args.direccion?.trim()) {
        return { ok: false, error: "Falta la dirección para el domicilio." };
      }
      session.fulfillment = { tipo: args.tipo, direccion: args.direccion?.trim() || null };
      return { ok: true, fulfillment: session.fulfillment };
    }
    case "establecer_cliente": {
      if (!args.nombre?.trim()) return { ok: false, error: "Falta el nombre." };
      session.customer = { nombre: args.nombre.trim() };
      return { ok: true, customer: session.customer };
    }
    case "confirmar_pedido": {
      if (session.cart.length === 0) return { ok: false, error: "El carrito está vacío." };
      if (!session.fulfillment) return { ok: false, error: "Falta definir recoger o domicilio." };
      if (session.fulfillment.tipo === "domicilio" && !session.fulfillment.direccion) {
        return { ok: false, error: "Falta la dirección de entrega." };
      }
      if (!session.customer?.nombre) return { ok: false, error: "Falta el nombre del cliente." };

      const items = session.cart.map((i) => ({ id: i.id, name: i.name, quantity: i.qty }));
      const computed = await recomputeOrder(items, null);
      if (computed.error) return { ok: false, error: computed.error };

      const order = await createOrder({
        customer: session.customer.nombre,
        phone,
        address: session.fulfillment.tipo === "domicilio" ? session.fulfillment.direccion : null,
        items: computed.lines,
        total: computed.total,
        fulfillment: session.fulfillment.tipo,
        source: "whatsapp",
        paid: false,
      });
      session._confirmedOrder = order;
      return { ok: true, order_number: order.order_number, total: computed.total };
    }
    default:
      return { ok: false, error: `Herramienta desconocida: ${name}` };
  }
}

/** Run one turn of the conversation for `phone`. Returns the reply text to send. */
export async function runTurn(phone, userText) {
  const session = await getSession(phone);
  session.cart = session.cart || [];

  const messages = [
    { role: "system", content: await buildSystemPrompt(session) },
    ...session.history,
    { role: "user", content: userText },
  ];

  let reply = null;
  for (let i = 0; i < MAX_TOOL_ITERATIONS && !reply; i++) {
    const assistantMessage = await chatCompletion({ messages, tools: TOOLS });
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls?.length) {
      reply = assistantMessage.content;
      break;
    }

    for (const call of assistantMessage.tool_calls) {
      const args = JSON.parse(call.function.arguments || "{}");
      const result = await executeTool(call.function.name, args, session, phone);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }

    // Refresh the system prompt so the next model call sees the updated cart/state.
    messages[0] = { role: "system", content: await buildSystemPrompt(session) };
  }

  if (!reply) {
    reply = `Uy, se me enredó el pedido 😅 ¿me lo repites o prefieres llamarnos al ${SITE.phone}?`;
  }

  session.history = [...session.history, { role: "user", content: userText }, { role: "assistant", content: reply }];

  if (session._confirmedOrder) {
    await clearSession(phone);
  } else {
    await saveSession(phone, session);
  }

  return reply;
}
