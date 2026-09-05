"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceOptions = exports.deleteService = exports.updateService = exports.getServiceById = exports.getServices = exports.createService = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_helper_1 = require("../../shared/helpers/pagination.helper");
const createService = async (organizationId, data) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const { name, description, base_price } = data;
        const result = await client.query(`
      INSERT INTO services(
        name,
        description,
        base_price,
        organization_id
      )
      VALUES(
        $1,$2,$3,$4
      )
      RETURNING *
      `, [
            name,
            description ?? null,
            base_price,
            organizationId
        ]);
        await client.query("COMMIT");
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
exports.createService = createService;
const getServices = async (organizationId, filters) => {
    try {
        const { page, limit, offset, } = (0, pagination_helper_1.buildPagination)(filters);
        const values = [
            organizationId,
        ];
        let index = 2;
        let whereClause = `
      WHERE
        s.organization_id = $1
    `;
        if (!filters?.includeInactive) {
            whereClause += `
        AND s.is_active = TRUE
      `;
        }
        if (filters?.search?.trim()) {
            values.push(`%${filters.search.trim()}%`);
            whereClause += `
        AND (
          s.name ILIKE $${index}
          OR COALESCE(
            s.description,
            ''
          ) ILIKE $${index}
        )
      `;
            index++;
        }
        // Total count
        const totalResult = await db_1.pool.query(`
        SELECT
          COUNT(*)::int AS total

        FROM services s

        ${whereClause}
        `, values);
        const total = totalResult.rows[0].total;
        // Pagination
        const queryParams = [
            ...values,
            limit,
            offset,
        ];
        const result = await db_1.pool.query(`
        SELECT
          s.*

        FROM services s

        ${whereClause}

        ORDER BY
          s.name

        LIMIT $${queryParams.length - 1}

        OFFSET $${queryParams.length}
        `, queryParams);
        return {
            services: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    catch (error) {
        console.log("Error fetching services", error);
        throw new AppError_1.AppError("Error fetching services", 500);
    }
};
exports.getServices = getServices;
const getServiceById = async (serviceId, organizationId) => {
    const result = await db_1.pool.query(`
    SELECT *
    FROM services
    WHERE
      id = $1
      AND organization_id = $2
    `, [
        serviceId,
        organizationId
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Service not found", 404);
    }
    return result.rows[0];
};
exports.getServiceById = getServiceById;
const updateService = async (serviceId, organizationId, data) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const { name, description, base_price, is_active } = data;
        const result = await client.query(`
      UPDATE services
      SET
        name = $1,
        description = $2,
        base_price = $3,
        is_active = $4,
        updated_at = NOW()
      WHERE
        id = $5
        AND organization_id = $6
      RETURNING *
      `, [
            name,
            description ?? null,
            base_price,
            is_active,
            serviceId,
            organizationId
        ]);
        if (!result.rows.length) {
            throw new AppError_1.AppError("Service not found", 404);
        }
        await client.query("COMMIT");
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
exports.updateService = updateService;
const deleteService = async (serviceId, organizationId) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const dealResult = await client.query(`
      SELECT 1
      FROM deals
      WHERE
        service_id = $1
      LIMIT 1
      `, [serviceId]);
        if (dealResult.rows.length) {
            throw new AppError_1.AppError("This service is used by existing deals. Deactivate it instead.", 400);
        }
        const result = await client.query(`
      DELETE
      FROM services
      WHERE
        id = $1
        AND organization_id = $2
      RETURNING *
      `, [
            serviceId,
            organizationId
        ]);
        if (!result.rows.length) {
            throw new AppError_1.AppError("Service not found", 404);
        }
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
};
exports.deleteService = deleteService;
const getServiceOptions = async (organizationId, filters) => {
    try {
        const { page, limit, offset, } = (0, pagination_helper_1.buildPagination)(filters);
        const params = [
            organizationId,
        ];
        let whereClause = `
      WHERE
        s.organization_id = $1
        AND s.is_active = TRUE
    `;
        if (filters?.search?.trim()) {
            params.push(`%${filters.search.trim()}%`);
            whereClause += `
        AND (
          s.name ILIKE $${params.length}
          OR COALESCE(s.description, '') ILIKE $${params.length}
        )
      `;
        }
        const countResult = await db_1.pool.query(`
        SELECT COUNT(*)::int AS total
        FROM services s
        ${whereClause}
        `, params);
        const total = countResult.rows[0].total;
        const queryParams = [
            ...params,
            limit,
            offset,
        ];
        const result = await db_1.pool.query(`
        SELECT
          s.id,
          s.name,
          s.base_price
        FROM services s

        ${whereClause}

        ORDER BY
          s.name ASC

        LIMIT $${queryParams.length - 1}
        OFFSET $${queryParams.length}
        `, queryParams);
        return {
            services: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    catch (error) {
        console.log("Error fetching service options", error);
        throw new AppError_1.AppError("Error fetching service options", 500);
    }
};
exports.getServiceOptions = getServiceOptions;
