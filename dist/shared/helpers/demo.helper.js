"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDemoAccount = exports.DEMO_EMAILS = void 0;
exports.DEMO_EMAILS = [
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
const isDemoAccount = (email) => {
    if (!email)
        return false;
    return exports.DEMO_EMAILS.includes(email.toLowerCase().trim());
};
exports.isDemoAccount = isDemoAccount;
