export const DEMO_EMAILS = [
  "org1@xyz.com",
  "org2@abc.com",
  "manager1@xyz.com",
  "manager2@xyz.com",
  "sales1@xyz.com",
  "sales2@xyz.com",
];

/**
 * Checks if the given email belongs to a protected demo / test account.
 */
export const isDemoAccount = (email?: string | null): boolean => {
  if (!email) return false;
  return DEMO_EMAILS.includes(email.toLowerCase().trim());
};
