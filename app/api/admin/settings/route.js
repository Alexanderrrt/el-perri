/**
 * GET /api/admin/settings - Get business settings from admin panel
 * Returns: name, phone, address, hours, and other settings
 */

let adminSettings = {
  name: "El Perri Latin Food",
  phone: "(408) 582-2502",
  address: ["Food Truck: 1358 S Winchester Blvd", "Local: 960 S First St, San Jose, CA 95110"],
  hours: "12pm - 11pm Daily",
  email: "elperrilatinfood.com",
  instagram: "@elperri.food"
};

export async function GET(request) {
  return Response.json({ success: true, settings: adminSettings });
}

export async function POST(request) {
  try {
    const body = await request.json();
    adminSettings = { ...adminSettings, ...body };
    return Response.json({ success: true, settings: adminSettings });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
