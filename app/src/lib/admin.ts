function emailList(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Admin = ADMIN_EMAILS. Om den saknas används PRODUCER_EMAILS, så att en
 * installation som uppgraderats från enprojektsversionen fortsätter fungera.
 */
export function isAdminEmail(email: string): boolean {
  const admins = emailList(process.env.ADMIN_EMAILS || process.env.PRODUCER_EMAILS);
  return admins.includes(email.trim().toLowerCase());
}
