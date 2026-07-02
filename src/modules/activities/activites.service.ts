import { pool } from "../../config/db";
import { Pool, PoolClient } from "pg";


// export const createActivity = async (
//   organizationId: number,
//   entityType: string,
//   entityIds: number | number[],
//   activityType: string,
//   description: string,
//   createdBy: number
// ) => {

//   const ids = Array.isArray(entityIds)
//     ? entityIds
//     : [entityIds];

//   const result = await pool.query(
//     `
//     INSERT INTO activities(
//       entity_type,
//       entity_id,
//       activity_type,
//       description,
//       organization_id,
//       created_by
//     )
//     SELECT
//       $1,
//       UNNEST($2::int[]),
//       $3,
//       $4,
//       $5,
//       $6
//     RETURNING *
//     `,
//     [
//       entityType,
//       ids,
//       activityType,
//       description,
//       organizationId,
//       createdBy
//     ]
//   );

//   return result.rows;

// };


export const createActivity = async (
  organizationId: number,
  entityType: string,
  entityId: number | number[],
  activityType: string,
  description: string,
  createdBy: number,
  db: Pool | PoolClient = pool
) => {

  const ids = Array.isArray(entityId)
    ? entityId
    : [entityId];

  const result = await db.query(
    `
    INSERT INTO activities(
      organization_id,
      entity_type,
      entity_id,
      activity_type,
      description,
      created_by
    )
    SELECT
      $1,
      $2,
      UNNEST($3::int[]),
      $4,
      $5,
      $6
    RETURNING *
    `,
    [
      organizationId,
      entityType,
      ids,
      activityType,
      description,
      createdBy
    ]
  );

  return result.rows;
};

export const getActivities = async (
  organizationId: number,
  entityType: string,
  entityId: number
) => {

  const result = await pool.query(
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
    INNER JOIN organizations og 
      ON a.organization_id = og.id
    WHERE
      a.entity_type = $1
      AND a.entity_id = $2 
      AND a.organization_id = $3
    ORDER BY
      a.created_at DESC
    `,
    [
      entityType,
      entityId,
      organizationId
    ]
  );

  return result.rows;

};