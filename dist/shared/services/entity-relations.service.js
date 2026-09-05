"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEntityRelations = void 0;
const db_1 = require("../../config/db");
const deleteEntityRelations = async (organizationId, entityType, entityId, db = db_1.pool) => {
    await db.query(`
    DELETE FROM activities
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `, [organizationId, entityType, entityId]);
    await db.query(`
    DELETE FROM notes
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `, [organizationId, entityType, entityId]);
    await db.query(`
    DELETE FROM tasks
    WHERE
      organization_id = $1
      AND entity_type = $2
      AND entity_id = $3
    `, [organizationId, entityType, entityId]);
};
exports.deleteEntityRelations = deleteEntityRelations;
