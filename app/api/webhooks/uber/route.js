/**
 * POST /api/webhooks/uber
 * Receives delivery status updates from Uber Direct.
 *
 * Uber sends events like: delivery_status (pending, pickup, dropoff,
 * delivered, canceled, returned). We log them and can update the order
 * status in the database.
 *
 * Webhook URL to register in Uber Developer Dashboard:
 *   https://elperrilatinfood.vercel.app/api/webhooks/uber
 */
import { logAudit } from "@/lib/audit";

export async function POST(request) {
  try {
    const event = await request.json();

    const deliveryId = event.id || event.delivery_id;
    const status = event.status || event.data?.status;
    const externalId = event.external_delivery_id || event.data?.external_delivery_id;

    console.log(`[UBER WEBHOOK] delivery=${deliveryId} status=${status} order=${externalId}`);

    await logAudit({
      entityType: "delivery",
      entityId: deliveryId || "unknown",
      action: `uber_${status || "event"}`,
      actorType: "system",
      newValues: {
        orderNumber: externalId,
        status,
        trackingUrl: event.tracking_url || event.data?.tracking_url,
        courierName: event.courier?.name || event.data?.courier?.name,
        courierPhone: event.courier?.phone_number || event.data?.courier?.phone_number,
      },
    });

    return Response.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[UBER WEBHOOK] failed to process:", error.message);
    return Response.json({ status: "ok" }, { status: 200 });
  }
}
