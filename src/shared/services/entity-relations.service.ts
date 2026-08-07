import { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";


export const deleteEntityRelations = async (
  organizationId: number,
  entityType: "LEAD" | "CUSTOMER" | "DEAL",
  entityId: number,
  db: Pool | PoolClient = pool
) => {
  await db.query(
    `
    DELETE FROM activities
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `,
    [organizationId, entityType, entityId]
  );

  await db.query(
    `
    DELETE FROM notes
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `,
    [organizationId, entityType, entityId]
  );

  await db.query(
    `
    DELETE FROM tasks
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `,
    [organizationId, entityType, entityId]
  );
};