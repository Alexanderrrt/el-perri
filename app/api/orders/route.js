/**
 * GET /api/orders - Get all orders
 * POST /api/orders - Create new order
 */
import { sendOrderConfirmation } from '@/lib/email';

const ORDERS_STORAGE = [];

export async function GET(request) {
  return Response.json({ success: true, orders: ORDERS_STORAGE });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { customer, email, items, total, phone, address } = body;

    if (!customer || !items || !total) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = {
      id: `ORD-${Date.now()}`,
      customer,
      email,
      phone,
      address,
      items,
      total: parseFloat(total),
      status: "pending",
      createdAt: new Date()
    };

    ORDERS_STORAGE.push(order);

    try {
      if (email) {
        await sendOrderConfirmation(email, order.id, items, order.total);
      }
    } catch (emailError) {
      console.warn(`[ORDERS] Email failed but order created:`, emailError.message);
    }

    return Response.json({ success: true, order }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
