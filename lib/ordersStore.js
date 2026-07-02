/**
 * Orders store (server-only — never import into a "use client" component).
 *
 * Orders hold customer PII (name/phone/address), so — unlike menu items or
 * promotions — there is no anon-key read path at all. Every read/write goes
 * through the service-role client. When Supabase isn't configured (local dev,
 * CI) everything falls back to an in-memory array so the checkout and the
 * WhatsApp bot still work end-to-end without any setup.
 */
import { supabaseAdmin, isAdminDbConfigured } from "./supabaseAdmin";
import { makeOrderNumber } from "./orderPricing";

let memoryOrders = [];

const ACTIVE_STATUSES = ["pendiente", "preparando", "listo"];

/**
 * Create an order. `source` is 'web' or 'whatsapp'. Returns the created row.
 */
export async function createOrder({
  orderNumber,
  customer,
  email,
  phone,
  address,
  items,
  total,
  fulfillment,
  source,
  paid = false,
}) {
  orderNumber = orderNumber || makeOrderNumber();
  const row = {
    id: orderNumber,
    order_number: orderNumber,
    customer: customer || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    items,
    total,
    status: "pendiente",
    fulfillment,
    source,
    paid,
  };

  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin.from("orders").insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  const stored = { ...row, created_at: new Date().toISOString() };
  memoryOrders.unshift(stored);
  return stored;
}

/** List orders, newest first. Pass {active: true} for kitchen-relevant orders only. */
export async function listOrders({ active = false } = {}) {
  if (isAdminDbConfigured) {
    let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
    if (active) query = query.in("status", ACTIVE_STATUSES);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  const list = active ? memoryOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)) : memoryOrders;
  return list;
}

/** Update an order's status (admin). Returns the updated row or null. */
export async function updateOrderStatus(id, status) {
  if (isAdminDbConfigured) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return data;
  }

  const order = memoryOrders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  return order;
}
