/**
 * POST /api/auth/user-signup - Create user account
 */

let users = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = users.find(u => u.email === email);
    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create user (in production, hash password with bcryptjs)
    const user = {
      userId: Date.now().toString(),
      email,
      password, // TODO: hash this with bcryptjs in production
      name: name || "User",
      createdAt: new Date().toISOString(),
      newsletter: true
    };

    users.push(user);
    console.log(`[USER] New signup: ${email}`);

    return Response.json({
      userId: user.userId,
      email: user.email,
      name: user.name
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
