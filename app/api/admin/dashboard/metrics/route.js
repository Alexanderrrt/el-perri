/**
 * GET /api/admin/dashboard/metrics
 * Fetch dashboard metrics for admin panel.
 * Requires authentication (Authorization header).
 *
 * Response: { todayOrders, revenueToday, registeredUsers, marketingOptInPercent, ... }
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

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    // In production, query from database:
    // SELECT COUNT(*) as todayOrders FROM orders WHERE DATE(created_at) = ?
    // SELECT SUM(total) as revenueToday FROM orders WHERE DATE(created_at) = ?
    // SELECT COUNT(*) as registeredUsers FROM customers WHERE customer_type = 'registered'
    // SELECT AVG(total) as avgOrderValue FROM orders WHERE DATE(created_at) = ?
    // SELECT ROUND(100 * SUM(CASE WHEN marketing_consent = 'opted_in' THEN 1 ELSE 0 END) / COUNT(*)) as marketingOptInPercent FROM customers WHERE marketing_consent != 'pending_confirmation'

    // Mock data
    const metrics = {
      adminName: "Maria Rodriguez",
      todayOrders: 47,
      todayOrdersChange: 12, // percentage change from yesterday
      revenueToday: 1847.5,
      avgOrderValue: 39.3,
      registeredUsers: 284,
      newUsersWeek: 18,
      marketingOptInPercent: 68,
      guestOrdersToday: 23,
      avgDeliveryTime: 38, // minutes
      peakOrderTime: "12:30 PM",
    };

    console.log(`[ADMIN] Dashboard metrics accessed by: ${admin.email}`);

    return Response.json(metrics, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Dashboard metrics failed:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
