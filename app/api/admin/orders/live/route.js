/**
 * GET /api/admin/orders/live
 * Fetch live orders (pending, confirmed, preparing, ready).
 * Requires admin authentication.
 *
 * Query params: ?status=pending&limit=50&offset=0
 * Response: [{ id, orderNumber, customerName, total, status, createdAt }, ...]
 */
import { verifyAdminToken } from "@/lib/auth";

export async function GET(request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const admin = await verifyAdminToken(token);

    if (!admin) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || null;
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;

    // In production, query from database:
    // SELECT o.id, o.order_number, c.first_name || ' ' || c.last_name as customerName, o.total, o.status, o.created_at
    // FROM orders o
    // JOIN customers c ON o.customer_id = c.id
    // WHERE o.status IN ('pending', 'confirmed', 'preparing', 'ready')
    //   AND (? IS NULL OR o.status = ?)
    // ORDER BY o.created_at DESC
    // LIMIT ? OFFSET ?

    // Mock data
    const orders = [
      {
        id: "uuid-1",
        orderNumber: "ORD-20260623-0047",
        customerName: "Maria Rodriguez",
        total: 67.5,
        status: "Delivered",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: "uuid-2",
        orderNumber: "ORD-20260623-0046",
        customerName: "Guest",
        total: 45.2,
        status: "Ready for Pickup",
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        id: "uuid-3",
        orderNumber: "ORD-20260623-0045",
        customerName: "Juan Montoya",
        total: 89.75,
        status: "Preparing",
        createdAt: new Date(Date.now() - 900000),
      },
      {
        id: "uuid-4",
        orderNumber: "ORD-20260623-0044",
        customerName: "Sarah Chen",
        total: 52.0,
        status: "Pending",
        createdAt: new Date(Date.now() - 300000),
      },
    ];

    console.log(
      `[ADMIN] Live orders accessed by: ${admin.email} (${orders.length} orders)`
    );

    return Response.json(orders, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Live orders failed:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
