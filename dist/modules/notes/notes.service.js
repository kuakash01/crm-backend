"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.getNotes = exports.createNote = void 0;
const db_1 = require("../../config/db");
const activites_service_1 = require("../activities/activites.service");
const AppError_1 = require("../../shared/errors/AppError");
const pagination_helper_1 = require("../../shared/helpers/pagination.helper");
const createNote = async (organizationId, entityType, entityId, note, createdBy) => {
    const result = await db_1.pool.query(`
    WITH inserted AS (
      INSERT INTO notes(
        organization_id,
        entity_type,
        entity_id,
        note,
        created_by
      )
      VALUES(
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING *
    )
    SELECT
      i.*,
      u.fullname AS created_by_name
      FROM inserted i
      INNER JOIN users u
      ON u.id = i.created_by;
    `, [
        organizationId,
        entityType,
        entityId,
        note,
        createdBy
    ]);
    const activity = {
        organizationId,
        entityType,
        entityId,
        activityType: "NOTE_ADDED",
        description: "Added a note",
        createdBy
    };
    await (0, activites_service_1.createActivities)([activity]);
    return result.rows[0];
};
exports.createNote = createNote;
const getNotes = async (organizationId, entityType, entityId, options) => {
    const { page, limit, offset } = (0, pagination_helper_1.buildPagination)(options);
    const [notesResult, countResult] = await Promise.all([
        db_1.pool.query(`
      SELECT
        n.id,
        n.note,
        n.created_at,
        n.updated_at,
        u.fullname AS created_by_name
      FROM notes n
      INNER JOIN users u
        ON u.id = n.created_by
      WHERE
        n.organization_id = $1
        AND n.entity_type = $2
        AND n.entity_id = $3
      ORDER BY
        n.created_at DESC
      LIMIT $4
      OFFSET $5
      `, [
            organizationId,
            entityType,
            entityId,
            limit,
            offset,
        ]),
        db_1.pool.query(`
      SELECT COUNT(*)::int AS total
      FROM notes
      WHERE
        organization_id = $1
        AND entity_type = $2
        AND entity_id = $3
      `, [
            organizationId,
            entityType,
            entityId,
        ]),
    ]);
    return (0, pagination_helper_1.buildPaginationResponse)(notesResult.rows, page, limit, countResult.rows[0].total);
};
exports.getNotes = getNotes;
const updateNote = async (entityType, entityId, noteId, note) => {
    const result = await db_1.pool.query(`
    UPDATE notes
    SET
      note = $1,
      updated_at = NOW()
    WHERE
      id = $2
      AND entity_type = $3
      AND entity_id = $4
    RETURNING *
    `, [
        note,
        noteId,
        entityType,
        entityId
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Note not found", 404);
    }
    return result.rows[0];
};
exports.updateNote = updateNote;
const deleteNote = async (entityType, entityId, noteId) => {
    const result = await db_1.pool.query(`
    DELETE
    FROM notes
    WHERE
      id = $1
      AND entity_type = $2
      AND entity_id = $3
    RETURNING *
    `, [
        noteId,
        entityType,
        entityId
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Note not found", 404);
    }
    return result.rows[0];
};
exports.deleteNote = deleteNote;
