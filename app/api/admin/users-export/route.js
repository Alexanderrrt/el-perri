/**
 * GET /api/admin/users-export - Export users for marketing
 * Returns CSV data of all users and subscribers
 */

export async function GET(request) {
  try {
    // In production, fetch from database
    // Combining users and subscribers for export
    const users = []; // Would come from database
    const subscribers = []; // Would come from database

    // Create CSV format
    const csvHeaders = ["Email", "Name", "Type", "Signed Up"];
    const csvRows = [];

    // Add users
    users.forEach(user => {
      csvRows.push([
        user.email,
        user.name || "N/A",
        "User",
        user.createdAt || new Date().toISOString()
      ]);
    });

    // Add subscribers
    subscribers.forEach(sub => {
      csvRows.push([
        sub.email,
        sub.name || "N/A",
        "Subscriber",
        sub.subscribedAt || new Date().toISOString()
      ]);
    });

    // Build CSV
    const csv = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Return as downloadable file
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="el-perri-users-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
