"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerOptions = exports.getCustomerDeals = exports.assignCustomer = exports.deleteCustomer = exports.updateCustomerStatus = exports.updateCustomer = exports.getCustomerById = exports.createCustomer = exports.getCustomers = void 0;
const db_1 = require("../../config/db");
const activites_service_1 = require("../activities/activites.service");
const AppError_1 = require("../../shared/errors/AppError");
const users_service_1 = require("../users/users.service");
// helpers
const pagination_helper_1 = require("../../shared/helpers/pagination.helper");
const sql_helper_1 = require("../../shared/helpers/sql.helper");
const customers_helper_1 = require("./customers.helper");
const entity_relations_service_1 = require("../../shared/services/entity-relations.service");
const notification_helper_1 = require("../notifications/notification.helper");
const socket_1 = require("../../config/socket");
const getCustomers = async (organizationId, currentUserId, filters) => {
    try {
        const { conditions, params, } = (0, customers_helper_1.buildCustomerFilters)(filters);
        const { page, limit, offset, } = (0, pagination_helper_1.buildPagination)(filters);
        const visibleUsers = await (0, users_service_1.getVisibleUserIds)(currentUserId);
        params.unshift(organizationId);
        params.unshift(visibleUsers);
        const visibilityCondition = `
          c.assigned_to = ANY($1::int[])
        `;
        const whereClause = `
      WHERE
        c.organization_id = $2
        AND ${visibilityCondition}
        ${conditions.length
            ? "AND " +
                (0, sql_helper_1.shiftSqlParams)(conditions, 2)
            : ""}
    `;
        const counts = await (0, customers_helper_1.getCustomerCounts)(visibilityCondition, organizationId, visibleUsers, filters);
        const total = await (0, customers_helper_1.getFilteredCustomerCount)(visibilityCondition, organizationId, visibleUsers, filters);
        const queryParams = [
            ...params,
            limit,
            offset,
        ];
        const result = await db_1.pool.query(`
        SELECT
          c.*,

          u.fullname AS assigned_to_name

        FROM customers c

        LEFT JOIN users u
          ON u.id = c.assigned_to

        ${whereClause}

        ORDER BY
          c.created_at DESC

        LIMIT $${queryParams.length - 1}

        OFFSET $${queryParams.length}
        `, queryParams);
        return {
            customers: result.rows,
            counts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    catch (error) {
        console.log(error);
        throw new AppError_1.AppError("Error fetching customers", 500);
    }
};
exports.getCustomers = getCustomers;
const createCustomer = async (organizationId, currentUserId, data, db = db_1.pool) => {
    const { fname, lname, email, phone1, phone2, company, assigned_to, lead_id, created_from } = data;
    // Prevent duplicate customer creation from same lead
    if (lead_id) {
        const existingCustomer = await db.query(`
      SELECT id
      FROM customers
      WHERE lead_id = $1
      `, [lead_id]);
        if (existingCustomer.rows.length) {
            throw new AppError_1.AppError("Customer already exists for this lead", 400);
        }
    }
    const result = await db.query(`
    INSERT INTO customers(
      fname,
      lname,
      email,
      phone1,
      phone2,
      company,
      assigned_to,
      created_from,
      lead_id,
      organization_id
    )
    VALUES(
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
    )
    RETURNING *
    `, [
        fname,
        lname ?? null,
        email,
        phone1,
        phone2 ?? null,
        company ?? null,
        assigned_to ?? null,
        created_from ?? 'LEAD',
        lead_id ?? null,
        organizationId
    ]);
    const customer = result.rows[0];
    const activity = {
        organizationId,
        entityType: "CUSTOMER",
        entityId: customer.id,
        activityType: "CREATED",
        description: lead_id
            ? "Customer created from lead"
            : `Customer created using ${created_from}`,
        createdBy: currentUserId
    };
    await (0, activites_service_1.createActivities)([activity], db);
    (0, socket_1.emitDashboardUpdate)(organizationId, {
        entityType: "CUSTOMER",
        entityId: customer.id,
        action: "CREATED",
    });
    return customer;
};
exports.createCustomer = createCustomer;
const getCustomerById = async (organizationId, customerId) => {
    const result = await db_1.pool.query(`
    SELECT
      c.*,
      u.fullname AS assigned_to_name
    FROM customers c
    LEFT JOIN users u
      ON u.id = c.assigned_to
    WHERE
      c.id = $1
      AND c.organization_id = $2
    `, [
        customerId,
        organizationId
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Customer not found", 404);
    }
    return result.rows[0];
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (organizationId, customerId, currentUserId, data) => {
    const { fname, lname, email, phone1, phone2, company } = data;
    const result = await db_1.pool.query(`
    UPDATE customers
    SET
      fname = $1,
      lname = $2,
      email = $3,
      phone1 = $4,
      phone2 = $5,
      company = $6,
      updated_at = NOW()
    WHERE
      id = $7
      AND organization_id = $8
    RETURNING *
    `, [
        fname,
        lname,
        email,
        phone1,
        phone2,
        company,
        customerId,
        organizationId
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Customer not found", 404);
    }
    const activities = [
        {
            organizationId,
            entityType: "CUSTOMER",
            entityId: customerId,
            activityType: "UPDATED",
            description: "Customer updated",
            createdBy: currentUserId,
        },
    ];
    await (0, activites_service_1.createActivities)(activities);
    (0, socket_1.emitDashboardUpdate)(organizationId, {
        entityType: "CUSTOMER",
        entityId: customerId,
        action: "UPDATED",
    });
    return result.rows[0];
};
exports.updateCustomer = updateCustomer;
const updateCustomerStatus = async (organizationId, customerId, status, currentUserId) => {
    const customerResult = await db_1.pool.query(`
    SELECT
      status,
      assigned_to,
      fname,
      lname
    FROM customers
    WHERE
      id = $1
      AND organization_id = $2
    `, [
        customerId,
        organizationId,
    ]);
    if (!customerResult.rows.length) {
        throw new AppError_1.AppError("Customer not found", 404);
    }
    const customer = customerResult.rows[0];
    const oldStatus = customer.status;
    const assignedUserId = customer.assigned_to;
    if (oldStatus === status) {
        throw new AppError_1.AppError("Customer is already in this status", 400);
    }
    const result = await db_1.pool.query(`
    UPDATE customers
    SET
      status = $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND organization_id = $3
    RETURNING *
    `, [
        status,
        customerId,
        organizationId,
    ]);
    // Notify assigned user
    if (assignedUserId &&
        assignedUserId !== currentUserId) {
        await (0, notification_helper_1.createNotifications)({
            organizationId,
            userIds: [assignedUserId],
            type: "CUSTOMER",
            action: "STATUS_CHANGED",
            title: "Customer Status Changed",
            message: `Customer '${customer.fname} ${customer.lname}' status changed from ${oldStatus} to ${status}.`,
            entityType: "CUSTOMER",
            entityId: customerId,
        });
    }
    // Activity log
    await (0, activites_service_1.createActivities)([
        {
            organizationId,
            entityType: "CUSTOMER",
            entityId: customerId,
            activityType: "STATUS_CHANGED",
            description: `Status changed from ${oldStatus} to ${status}`,
            createdBy: currentUserId,
        },
    ]);
    (0, socket_1.emitDashboardUpdate)(organizationId, {
        entityType: "CUSTOMER",
        entityId: customerId,
        action: status,
    });
    return result.rows[0];
};
exports.updateCustomerStatus = updateCustomerStatus;
const deleteCustomer = async (organizationId, customerId) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
      DELETE
      FROM customers
      WHERE
        id = $1
        AND organization_id = $2
      RETURNING *
      `, [
            customerId,
            organizationId
        ]);
        if (!result.rows.length) {
            throw new AppError_1.AppError("Customer not found", 404);
        }
        await (0, entity_relations_service_1.deleteEntityRelations)(organizationId, "CUSTOMER", customerId, client);
        await client.query("COMMIT");
        (0, socket_1.emitDashboardUpdate)(organizationId, {
            entityType: "CUSTOMER",
            entityId: customerId,
            action: "DELETED",
        });
        return result.rows[0];
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteCustomer = deleteCustomer;
const assignCustomer = async (currentUserId, customerIds, assignedTo) => {
    if (!customerIds.length) {
        throw new AppError_1.AppError("No customers selected", 400);
    }
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const currentUserResult = await client.query(`
      SELECT organization_id
      FROM users
      WHERE id = $1
      `, [currentUserId]);
        if (!currentUserResult.rows.length) {
            throw new AppError_1.AppError("User not found", 404);
        }
        const organizationId = currentUserResult.rows[0].organization_id;
        await (0, users_service_1.validateAssignee)(currentUserId, assignedTo);
        const assigneeResult = await client.query(`
      SELECT fullname
      FROM users
      WHERE id = $1
      `, [assignedTo]);
        if (!assigneeResult.rows.length) {
            throw new AppError_1.AppError("Assignee not found", 404);
        }
        const newAssigneeName = assigneeResult.rows[0].fullname;
        const customerResult = await client.query(`
      SELECT
        c.id,
        c.assigned_to,
        u.fullname AS assigned_to_name
      FROM customers c
      LEFT JOIN users u
        ON u.id = c.assigned_to
      WHERE
        c.id = ANY($1::int[])
        AND c.organization_id = $2
      `, [
            customerIds,
            organizationId,
        ]);
        if (customerResult.rows.length !==
            customerIds.length) {
            throw new AppError_1.AppError("One or more customers do not belong to your organization", 403);
        }
        await client.query(`
      UPDATE customers
      SET
        assigned_to = $1,
        updated_at = NOW()
      WHERE
        id = ANY($2::int[])
      `, [
            assignedTo,
            customerIds,
        ]);
        const activities = customerResult.rows.map((customer) => ({
            organizationId,
            entityType: "CUSTOMER",
            entityId: customer.id,
            activityType: "ASSIGNED",
            description: customer.assigned_to_name
                ? `Reassigned from ${customer.assigned_to_name} to ${newAssigneeName}`
                : `Assigned to ${newAssigneeName}`,
            createdBy: currentUserId,
        }));
        await (0, activites_service_1.createActivities)(activities, client);
        // send notification 
        if (assignedTo !== currentUserId) {
            if (customerIds.length === 1) {
                const customer = customerResult.rows[0];
                await (0, notification_helper_1.createNotifications)({
                    organizationId,
                    userIds: [assignedTo],
                    type: "CUSTOMER",
                    action: "ASSIGNED",
                    title: "Customer Assigned",
                    message: `${currentUserResult.rows[0].fullname} assigned you a customer.`,
                    entityType: "CUSTOMER",
                    entityId: customer.id,
                });
            }
            else {
                await (0, notification_helper_1.createNotifications)({
                    organizationId,
                    userIds: [assignedTo],
                    type: "CUSTOMER",
                    action: "ASSIGNED",
                    title: "Multiple Customers Assigned",
                    message: `${currentUserResult.rows[0].fullname} assigned ${customerIds.length} customers to you.`,
                    entityType: null,
                    entityId: null,
                });
            }
        }
        await client.query("COMMIT");
        (0, socket_1.emitDashboardUpdate)(organizationId, {
            entityType: "CUSTOMER",
            action: "ASSIGNED",
        });
        return {
            assignedTo,
            totalAssigned: customerIds.length,
        };
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
};
exports.assignCustomer = assignCustomer;
const getCustomerDeals = async (customerId, organizationId) => {
    const customer = await db_1.pool.query(`
  SELECT id
  FROM customers
  WHERE
    id = $1
    AND organization_id = $2
  `, [
        customerId,
        organizationId
    ]);
    if (!customer.rows.length) {
        throw new AppError_1.AppError("Customer not found", 404);
    }
    const result = await db_1.pool.query(`
    SELECT
      d.*,

      s.name AS service_name,

      assigned.fullname AS assigned_to_name

    FROM deals d

    INNER JOIN services s
      ON s.id = d.service_id

    LEFT JOIN users assigned
      ON assigned.id = d.assigned_to

    WHERE
      d.customer_id = $1
      AND d.organization_id = $2

    ORDER BY
      d.created_at DESC
    `, [
        customerId,
        organizationId
    ]);
    return result.rows;
};
exports.getCustomerDeals = getCustomerDeals;
const getCustomerOptions = async (organizationId, currentUserId, filters, canViewUnassigned = false) => {
    try {
        const { page, limit, offset } = (0, pagination_helper_1.buildPagination)(filters);
        const visibleUsers = await (0, users_service_1.getVisibleUserIds)(currentUserId);
        const params = [
            visibleUsers,
            organizationId,
        ];
        const visibilityCondition = canViewUnassigned
            ? `
        (
          c.assigned_to IS NULL
          OR c.assigned_to = ANY($1::int[])
        )
      `
            : `
        c.assigned_to = ANY($1::int[])
      `;
        let whereClause = `
      WHERE
        c.organization_id = $2
        AND ${visibilityCondition}
    `;
        if (filters?.search) {
            params.push(`%${filters.search}%`);
            whereClause += `
        AND (
          CONCAT(c.fname, ' ', c.lname) ILIKE $${params.length}
          OR c.company ILIKE $${params.length}
          OR c.email ILIKE $${params.length}
          OR c.phone1 ILIKE $${params.length}
        )
      `;
        }
        const countResult = await db_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM customers c
      ${whereClause}
      `, params);
        const total = countResult.rows[0].total;
        params.push(limit);
        params.push(offset);
        const result = await db_1.pool.query(`
      SELECT
        c.id,
        c.fname,
        c.lname,
        c.company,
        c.email,
        c.phone1,
        c.assigned_to,
        u.fullname AS assigned_to_name

FROM customers c

LEFT JOIN users u
  ON u.id = c.assigned_to

      ${whereClause}

      ORDER BY
        c.fname ASC,
        c.lname ASC

      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `, params);
        return {
            customers: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    catch (error) {
        console.log(error);
        throw new AppError_1.AppError("Error fetching customer options", 500);
    }
};
exports.getCustomerOptions = getCustomerOptions;
