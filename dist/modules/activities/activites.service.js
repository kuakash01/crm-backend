"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = exports.createActivities = void 0;
const db_1 = require("../../config/db");
const pagination_helper_1 = require("../../shared/helpers/pagination.helper");
const createActivities = async (activities, db = db_1.pool) => {
    if (!activities.length) {
        return [];
    }
    const values = [];
    const placeholders = [];
    activities.forEach((activity, index) => {
        const offset = index * 6;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        values.push(activity.organizationId, activity.entityType, activity.entityId, activity.activityType, activity.description, activity.createdBy);
    });
    const result = await db.query(`
    INSERT INTO activities (
      organization_id,
      entity_type,
      entity_id,
      activity_type,
      description,
      created_by
    )
    VALUES
      ${placeholders.join(",")}
    RETURNING *
    `, values);
    return result.rows;
};
exports.createActivities = createActivities;
const getActivities = async (organizationId, entityType, entityId, options) => {
    const { page, limit, offset } = (0, pagination_helper_1.buildPagination)(options);
    const [activitiesResult, countResult] = await Promise.all([
        db_1.pool.query(`
      SELECT
        a.id,
        a.activity_type,
        a.description,
        a.created_at,
        u.fullname AS created_by_name
      FROM activities a
      INNER JOIN users u
        ON u.id = a.created_by
      WHERE
        a.entity_type = $1
        AND a.entity_id = $2
        AND a.organization_id = $3
      ORDER BY
        a.created_at DESC
      LIMIT $4
      OFFSET $5
      `, [
            entityType,
            entityId,
            organizationId,
            limit,
            offset,
        ]),
        db_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM activities
      WHERE
        entity_type = $1
        AND entity_id = $2
        AND organization_id = $3
      `, [
            entityType,
            entityId,
            organizationId,
        ]),
    ]);
    const total = countResult.rows[0].total;
    return (0, pagination_helper_1.buildPaginationResponse)(activitiesResult.rows, page, limit, total);
};
exports.getActivities = getActivities;
