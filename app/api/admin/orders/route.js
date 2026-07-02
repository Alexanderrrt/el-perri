/**
 * GET   /api/admin/orders           -> active orders (pendiente/preparando/listo)
 * GET   /api/admin/orders?all=1     -> every order, including entregado/cancelado
 * PATCH /api/admin/orders           -> { id, status } advance/cancel an order
 *
 * Gated by proxy.ts's /api/admin/* matcher (signed admin_session cookie) —
 * no additional auth code needed here.
 */
import { listOrders, updateOrderStatus } from "@/lib/ordersStore";

const VALID_STATUSES = ["pendiente", "preparando", "listo", "entregado", "cancelado"];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";
    const orders = await listOrders({ active: !all });
    return Response.json({ success: true, orders });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !VALID_STATUSES.includes(status)) {
      return Response.json({ success: false, error: "Estado inválido" }, { status: 400 });
    }
    const order = await updateOrderStatus(id, status);
    if (!order) {
      return Response.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }
    return Response.json({ success: true, order });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
