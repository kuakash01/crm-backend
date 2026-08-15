import { pool } from "../../config/db";
import { Pool, PoolClient } from "pg";
import { buildPagination, PaginationOptions, buildPaginationResponse } from "../../shared/helpers/pagination.helper";
import { ActivityInput } from "./activities.types";


export const createActivities = async (
  activities: ActivityInput[],
  db: Pool | PoolClient = pool
) => {
  if (!activities.length) {
    return [];
  }

  const values: unknown[] = [];
  const placeholders: string[] = [];

  activities.forEach((activity, index) => {
    const offset = index * 6;

    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );

    values.push(
      activity.organizationId,
      activity.entityType,
      activity.entityId,
      activity.activityType,
      activity.description,
      activity.createdBy
    );
  });

  const result = await db.query(
    `
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
    `,
    values
  );

  return result.rows;
};



export const getActivities = async (
  organizationId: number,
  entityType: string,
  entityId: number,
  options?: PaginationOptions
) => {
  const { page, limit, offset } = buildPagination(options);

  const [activitiesResult, countResult] = await Promise.all([
    pool.query(
      `
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
      `,
      [
        entityType,
        entityId,
        organizationId,
        limit,
        offset,
      ]
    ),

    pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM activities
      WHERE
        entity_type = $1
        AND entity_id = $2
        AND organization_id = $3
      `,
      [
        entityType,
        entityId,
        organizationId,
      ]
    ),
  ]);

  const total = countResult.rows[0].total;
  return buildPaginationResponse(
    activitiesResult.rows,
    page,
    limit,
    total
  );

};