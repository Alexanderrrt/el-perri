/**
 * Email service using Resend
 * Install: npm install resend
 */
import { Resend } from 'resend';

const emailConfigured = Boolean(process.env.RESEND_API_KEY);
const resend = emailConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Generic template-based sender used by the guest checkout route.
 * No-ops safely (logs only) when RESEND_API_KEY is not configured,
 * so orders still succeed before email is set up.
 */
export async function sendEmail({ to, template, data = {} }) {
  if (!emailConfigured) {
    console.log(`[EMAIL] (skipped — no RESEND_API_KEY) template="${template}" to=${to}`);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: 'noreply@elperri.food',
      to,
      subject:
        template === 'order-confirmation'
          ? 'Your El Perri order confirmation 🌮'
          : template === 'guest-confirm-email'
          ? 'Confirm your email — El Perri'
          : 'El Perri',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#ffd700">El Perri Latin Food</h1>
        <pre style="white-space:pre-wrap;font-family:inherit">${JSON.stringify(data, null, 2)}</pre>
      </div>`,
    });
    return result;
  } catch (error) {
    console.error(`[EMAIL] sendEmail failed (template=${template}):`, error.message);
    return { error: error.message };
  }
}

export async function sendNewsletter(email, name = 'Subscriber') {
  if (!emailConfigured) {
    console.log(`[EMAIL] (skipped — no RESEND_API_KEY) newsletter to=${email}`);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: 'noreply@elperri.food',
      to: email,
      subject: '¡Bienvenido a El Perri! Welcome to Our Newsletter 🌮',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ffd700;">¡Bienvenido, ${name}!</h1>
          <p>Thank you for subscribing to El Perri Latin Food! 🎉</p>

          <p>You'll now receive:</p>
          <ul>
            <li>🌮 New menu item announcements</li>
            <li>🎁 Exclusive offers and promotions</li>
            <li>🚚 Food truck location updates</li>
            <li>📸 Behind-the-scenes stories</li>
          </ul>

          <p>Visit us online: <a href="https://elperri.food" style="color: #ffd700;">elperri.food</a></p>
          <p>Follow us on Instagram: <a href="https://instagram.com/elperri.food" style="color: #ffd700;">@elperri.food</a></p>

          <hr style="border: none; border-top: 2px solid #ffd700; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">
            El Perri Latin Food | San Jose, CA<br>
            960 S First St, San Jose, CA 95110
          </p>
        </div>
      `,
    });

    console.log(`[EMAIL] Newsletter sent to ${email}`, result);
    return result;
  } catch (error) {
    console.error(`[EMAIL] Failed to send newsletter to ${email}:`, error);
    throw error;
  }
}

export async function sendOrderConfirmation(email, orderId, items, total) {
  if (!emailConfigured) {
    console.log(`[EMAIL] (skipped — no RESEND_API_KEY) order confirmation to=${email}`);
    return { skipped: true };
  }
  try {
    const itemsList = items.map((item) => `<li>${item.name} x${item.qty} - $${(item.price * item.qty).toFixed(2)}</li>`).join('');

    const result = await resend.emails.send({
      from: 'orders@elperri.food',
      to: email,
      subject: `Order Confirmation #${orderId} - El Perri 🌮`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ffd700;">Order Confirmed! ✅</h1>
          <p>Thank you for your order at El Perri!</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>

            <h3 style="color: #333; margin-top: 20px;">Items:</h3>
            <ul style="list-style: none; padding: 0;">
              ${itemsList}
            </ul>

            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 18px; font-weight: bold;">
              Total: <span style="color: #ffd700;">$${total.toFixed(2)}</span>
            </p>
          </div>

          <p>Your order is being prepared! We'll notify you when it's ready for pickup or delivery.</p>

          <p><strong>Questions?</strong> Contact us:<br>
          📞 (408) 582-2502<br>
          📧 orders@elperri.food</p>

          <hr style="border: none; border-top: 2px solid #ffd700; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">
            El Perri Latin Food | San Jose, CA<br>
            960 S First St, San Jose, CA 95110
          </p>
        </div>
      `,
    });

    console.log(`[EMAIL] Order confirmation sent to ${email}`, result);
    return result;
  } catch (error) {
    console.error(`[EMAIL] Failed to send order confirmation to ${email}:`, error);
    throw error;
  }
}

export async function sendAdminNotification(adminEmail, subject, message) {
  if (!emailConfigured) {
    console.log(`[EMAIL] (skipped — no RESEND_API_KEY) admin notification to=${adminEmail}`);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: 'admin@elperri.food',
      to: adminEmail,
      subject: `[El Perri Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ffd700;">${subject}</h2>
          <p>${message}</p>
          <p><a href="${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard" style="background: #ffd700; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a></p>
        </div>
      `,
    });

    console.log(`[EMAIL] Admin notification sent to ${adminEmail}`, result);
    return result;
  } catch (error) {
    console.error(`[EMAIL] Failed to send admin notification:`, error);
    throw error;
  }
}

export default resend;
