"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notes_controller_1 = require("./notes.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyToken);
router.post('/:entityType/:entityId', (0, auth_middleware_1.authorize)("notes", "create"), notes_controller_1.createNote);
router.get('/:entityType/:entityId', (0, auth_middleware_1.authorize)("notes", "read"), notes_controller_1.getNotes);
router.patch('/:entityType/:entityId/:noteId', (0, auth_middleware_1.authorize)("notes", "update"), notes_controller_1.updateNote);
router.delete('/:entityType/:entityId/:noteId', (0, auth_middleware_1.authorize)("notes", "delete"), notes_controller_1.deleteNote);
exports.default = router;
