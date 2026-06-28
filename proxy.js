/**
 * Edge proxy (Next.js 16's successor to "middleware") — server-side access
 * gate for the admin panel.
 *
 * Any request to /admin/dashboard (and subpaths) must carry a valid, signed
 * admin_session cookie issued by /api/auth/admin-login. Without it, the request
 * is redirected to the login page before the dashboard ever renders — so the
 * panel cannot be reached by typing the URL, and this cannot be bypassed from
 * the browser (the cookie is HttpOnly and signed).
 */
import { NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

export async function proxy(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSession(token);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*"],
};
