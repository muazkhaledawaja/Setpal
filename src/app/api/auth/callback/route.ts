import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth email callback. Supabase redirects here after the user clicks an
 * auth email link (password recovery, etc.), with either a PKCE `code`
 * or a `token_hash` + `type` pair depending on the email template.
 * On success the session cookies are set and the user is sent to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let next = searchParams.get("next") ?? "/";
  // Only allow same-origin relative redirects
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const locale = next.split("/")[1] === "en" ? "en" : "ar";
  return NextResponse.redirect(
    new URL(`/${locale}/forgot-password?error=invalid_link`, origin)
  );
}
