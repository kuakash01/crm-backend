export const DEMO_EMAILS = [
  "org1@test.com",
  "org2@test.com",
  "manager1@xyz.com",
  "manager2@xyz.com",
  "sales1@xyz.com",
  "sales2@xyz.com",
  "admin@acme.com",
  "admin@acme-corp.com",
  "agent@acme.com",
  "agent@acme-corp.com",
  "admin@globex.com",
  "admin@demo.com",
  "agent@demo.com",
  "demo@crm.com",
];

/**
 * Checks if the given email belongs to a protected demo / test account.
 */
export const isDemoAccount = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  
  if (DEMO_EMAILS.includes(normalized)) return true;
  if (normalized.endsWith("@demo.com") || normalized.endsWith("@crmdemo.com")) return true;
  if (
    normalized.includes("demo-admin") ||
    normalized.includes("demo-agent") ||
    normalized.startsWith("demo_") ||
    normalized.startsWith("demo-")
  ) {
    return true;
  }
  return false;
};
