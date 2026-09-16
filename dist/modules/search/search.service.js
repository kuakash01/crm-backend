"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.universalSearch = void 0;
const db_1 = require("../../config/db");
const users_service_1 = require("../users/users.service");
const auth_helper_1 = require("../auth/auth.helper");
const universalSearch = async (organizationId, currentUserId, userRole, userPermissions = [], query) => {
    const trimmed = query.trim();
    const emptyResponse = {
        query: trimmed,
        total: 0,
        results: {
            deals: [],
            leads: [],
            customers: [],
            tasks: [],
            services: [],
        },
    };
    if (!trimmed || !organizationId) {
        return emptyResponse;
    }
    const isElevated = userRole === "OWNER" || userRole === "ADMIN";
    const canViewUnassigned = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "leads:view_unassigned");
    const canReadDeals = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "deals:read");
    const canReadLeads = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "leads:read");
    const canReadCustomers = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "customers:read");
    const canReadTasks = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "tasks:read");
    const canReadServices = isElevated || (0, auth_helper_1.hasPermission)(userPermissions, "services:read");
    const visibleUsers = await (0, users_service_1.getVisibleUserIds)(currentUserId);
    const searchPattern = `%${trimmed}%`;
    const visibilityClause = canViewUnassigned
        ? `(assigned_to = ANY($2::int[]) OR assigned_to IS NULL)`
        : `assigned_to = ANY($2::int[])`;
    // Parallel database queries across all permitted modules
    const [dealsResult, leadsResult, customersResult, tasksResult, servicesResult] = await Promise.all([
        // Deals Query
        canReadDeals
            ? db_1.pool.query(`
            SELECT id, title, price, stage
            FROM deals
            WHERE organization_id = $1
              AND ${visibilityClause}
              AND (
                title ILIKE $3
                OR stage::text ILIKE $3
              )
            ORDER BY created_at DESC
            LIMIT 6
            `, [organizationId, visibleUsers, searchPattern])
            : Promise.resolve({ rows: [] }),
        // Leads Query
        canReadLeads
            ? db_1.pool.query(`
            SELECT id, fname, lname, email, company, phone1, phone2, status
            FROM leads
            WHERE organization_id = $1
              AND ${visibilityClause}
              AND (
                fname ILIKE $3
                OR lname ILIKE $3
                OR email ILIKE $3
                OR company ILIKE $3
                OR COALESCE(phone1, '') ILIKE $3
                OR COALESCE(phone2, '') ILIKE $3
                OR status::text ILIKE $3
              )
            ORDER BY created_at DESC
            LIMIT 6
            `, [organizationId, visibleUsers, searchPattern])
            : Promise.resolve({ rows: [] }),
        // Customers Query
        canReadCustomers
            ? db_1.pool.query(`
            SELECT id, fname, lname, email, company, phone1, phone2, status
            FROM customers
            WHERE organization_id = $1
              AND ${visibilityClause}
              AND (
                fname ILIKE $3
                OR lname ILIKE $3
                OR email ILIKE $3
                OR company ILIKE $3
                OR COALESCE(phone1, '') ILIKE $3
                OR COALESCE(phone2, '') ILIKE $3
                OR status::text ILIKE $3
              )
            ORDER BY created_at DESC
            LIMIT 6
            `, [organizationId, visibleUsers, searchPattern])
            : Promise.resolve({ rows: [] }),
        // Tasks Query
        canReadTasks
            ? db_1.pool.query(`
            SELECT id, title, description, status, priority, entity_type, entity_id
            FROM tasks
            WHERE organization_id = $1
              AND ${visibilityClause}
              AND (
                title ILIKE $3
                OR COALESCE(description, '') ILIKE $3
                OR status::text ILIKE $3
              )
            ORDER BY created_at DESC
            LIMIT 6
            `, [organizationId, visibleUsers, searchPattern])
            : Promise.resolve({ rows: [] }),
        // Services Query
        canReadServices
            ? db_1.pool.query(`
            SELECT id, name, description, base_price, is_active
            FROM services
            WHERE organization_id = $1
              AND (
                name ILIKE $2
                OR COALESCE(description, '') ILIKE $2
              )
            ORDER BY created_at DESC
            LIMIT 6
            `, [organizationId, searchPattern])
            : Promise.resolve({ rows: [] }),
    ]);
    const deals = dealsResult.rows.map((row) => ({
        id: row.id,
        type: "deal",
        title: row.title,
        subtitle: row.price ? `₹${Number(row.price).toLocaleString("en-IN")}` : "Deal",
        badge: row.stage,
        url: `/dashboard/deals/${row.id}`,
    }));
    const leads = leadsResult.rows.map((row) => {
        const fullName = `${row.fname || ""} ${row.lname || ""}`.trim();
        return {
            id: row.id,
            type: "lead",
            title: fullName || row.email || "Unnamed Lead",
            subtitle: row.company || row.email || row.phone1 || "Lead record",
            badge: row.status,
            url: `/dashboard/leads/${row.id}`,
        };
    });
    const customers = customersResult.rows.map((row) => {
        const fullName = `${row.fname || ""} ${row.lname || ""}`.trim();
        return {
            id: row.id,
            type: "customer",
            title: fullName || row.email || "Unnamed Customer",
            subtitle: row.company || row.email || row.phone1 || "Customer record",
            badge: row.status,
            url: `/dashboard/customers/${row.id}`,
        };
    });
    const tasks = tasksResult.rows.map((row) => ({
        id: row.id,
        type: "task",
        title: row.title,
        subtitle: row.entity_type
            ? `${row.entity_type} • ${row.description || "Task"}`
            : row.description || "Task",
        badge: row.status,
        meta: row.priority,
        url: `/dashboard/tasks/${row.id}`,
    }));
    const services = servicesResult.rows.map((row) => ({
        id: row.id,
        type: "service",
        title: row.name,
        subtitle: row.base_price ? `₹${Number(row.base_price).toLocaleString("en-IN")}` : undefined,
        badge: row.is_active ? "Active" : "Inactive",
        url: `/dashboard/services/${row.id}`,
    }));
    const total = deals.length + leads.length + customers.length + tasks.length + services.length;
    return {
        query: trimmed,
        total,
        results: {
            deals,
            leads,
            customers,
            tasks,
            services,
        },
    };
};
exports.universalSearch = universalSearch;
