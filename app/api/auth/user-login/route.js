/**
 * POST /api/auth/user-login - User login
 */

// This should reference the same users array as signup
// In production, this would be a database query
let users = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Find user (in production, verify password hash)
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log(`[USER] Login: ${email}`);

    return Response.json({
      userId: user.userId,
      email: user.email,
      name: user.name
    }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
