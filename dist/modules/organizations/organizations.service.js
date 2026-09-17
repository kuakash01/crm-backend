"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateInboundKey = exports.updateOrganization = exports.getOrganization = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../shared/errors/AppError");
const crypto_1 = __importDefault(require("crypto"));
const mapOrganization = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "",
    zipCode: row.zip_code ?? "",
    industry: row.industry ?? "",
    description: row.description ?? "",
    logo: row.logo ?? null,
    inboundLeadKey: row.inbound_lead_key ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
const getOrganization = async (organizationId) => {
    const orgResult = await db_1.pool.query(`
    SELECT
      id,
      name,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      zip_code,
      industry,
      description,
      logo,
      inbound_lead_key,
      created_at,
      updated_at
    FROM organizations
    WHERE id = $1
    `, [organizationId]);
    if (!orgResult.rows.length) {
        throw new AppError_1.AppError("Organization not found", 404);
    }
    const statsResult = await db_1.pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE is_active = TRUE)::int AS team_members
    FROM users
    WHERE organization_id = $1
    `, [organizationId]);
    return {
        ...mapOrganization(orgResult.rows[0]),
        teamMembers: statsResult.rows[0]?.team_members ?? 0,
    };
};
exports.getOrganization = getOrganization;
const updateOrganization = async (organizationId, data) => {
    const existing = await (0, exports.getOrganization)(organizationId);
    const next = {
        name: data.name?.trim() || existing.name,
        email: data.email ?? existing.email,
        phone: data.phone ?? existing.phone,
        website: data.website ?? existing.website,
        address: data.address ?? existing.address,
        city: data.city ?? existing.city,
        state: data.state ?? existing.state,
        country: data.country ?? existing.country,
        zipCode: data.zipCode ?? existing.zipCode,
        industry: data.industry ?? existing.industry,
        description: data.description ?? existing.description,
        logo: data.logo ?? existing.logo,
    };
    const result = await db_1.pool.query(`
    UPDATE organizations
    SET
      name = $1,
      email = NULLIF($2, ''),
      phone = NULLIF($3, ''),
      website = NULLIF($4, ''),
      address = NULLIF($5, ''),
      city = NULLIF($6, ''),
      state = NULLIF($7, ''),
      country = NULLIF($8, ''),
      zip_code = NULLIF($9, ''),
      industry = NULLIF($10, ''),
      description = NULLIF($11, ''),
      logo = NULLIF($12, ''),
      updated_at = NOW()
    WHERE id = $13
    RETURNING
      id,
      name,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      zip_code,
      industry,
      description,
      logo,
      inbound_lead_key,
      created_at,
      updated_at
    `, [
        next.name,
        next.email,
        next.phone,
        next.website,
        next.address,
        next.city,
        next.state,
        next.country,
        next.zipCode,
        next.industry,
        next.description,
        next.logo,
        organizationId,
    ]);
    const statsResult = await db_1.pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE is_active = TRUE)::int AS team_members
    FROM users
    WHERE organization_id = $1
    `, [organizationId]);
    return {
        ...mapOrganization(result.rows[0]),
        teamMembers: statsResult.rows[0]?.team_members ?? 0,
    };
};
exports.updateOrganization = updateOrganization;
const regenerateInboundKey = async (organizationId) => {
    const newKey = `crm_pub_${crypto_1.default.randomBytes(18).toString("hex")}`;
    const result = await db_1.pool.query(`UPDATE organizations
     SET inbound_lead_key = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING inbound_lead_key`, [newKey, organizationId]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Organization not found", 404);
    }
    return { inboundLeadKey: result.rows[0].inbound_lead_key };
};
exports.regenerateInboundKey = regenerateInboundKey;
