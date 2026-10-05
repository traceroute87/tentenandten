/* Email one-time-code sign-in helpers. Supabase generates, emails, and checks the code;
   nothing here stores it. */

/** Supabase's per-address email rate limit window. */
export const OTP_RESEND_SECONDS = 60;

/** Supabase email codes are digits: 6 by default, up to 10 when the project is configured so. */
export const OTP_MAX_LENGTH = 10;
export const OTP_MIN_LENGTH = 6;

/** Keeps digits only, so pasted codes like "123 456" or "Code: 123456" work. */
export const normalizeOtp = (value: string) => value.replace(/\D/g, "").slice(0, OTP_MAX_LENGTH);

/** Neutral, user-facing messages. They never reveal whether an address has an account. */
export function otpErrorMessage(error: unknown, step: "send" | "verify"): string {
  const e = (error && typeof error === "object" ? error : {}) as { name?: string; status?: number };
  if (error instanceof TypeError || e.name === "AuthRetryableFetchError" || e.status === 0) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (e.status === 429) return "Too many attempts. Wait a minute, then try again.";
  return step === "verify"
    ? "That code is invalid or has expired."
    : "Couldn't send a code. Check the email address and try again.";
}
