/**
 * POST /api/subscribers - Subscribe to newsletter
 */
import { sendNewsletter } from '@/lib/email';

const SUBSCRIBERS = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return Response.json(
        { success: false, error: "Email required" },
        { status: 400 }
      );
    }

    const existing = SUBSCRIBERS.find(s => s.email === email);
    if (existing) {
      return Response.json(
        { success: false, error: "Already subscribed" },
        { status: 400 }
      );
    }

    const subscriber = {
      id: Date.now(),
      email,
      name: name || "Subscriber",
      subscribedAt: new Date()
    };

    SUBSCRIBERS.push(subscriber);
    console.log(`[NEWSLETTER] New subscriber: ${email}`);

    try {
      await sendNewsletter(email, name);
    } catch (emailError) {
      console.warn(`[NEWSLETTER] Email failed but subscription succeeded:`, emailError.message);
    }

    return Response.json({ success: true, subscriber }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
