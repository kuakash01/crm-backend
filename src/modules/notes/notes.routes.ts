import express from "express";
import { getNotes, createNote, updateNote, deleteNote } from "./notes.controller";
import { verifyToken, authorize } from "../../middleware/auth.middleware";
const router = express.Router();

router.use(verifyToken);

router.post('/:entityType/:entityId', authorize("notes", "create"), createNote)
router.get('/:entityType/:entityId', authorize("notes", "read"), getNotes)
router.patch('/:entityType/:entityId/:noteId', authorize("notes", "update"), updateNote)
router.delete('/:entityType/:entityId/:noteId', authorize("notes", "delete"), deleteNote)

export default router;