"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWorkspace = void 0;
const search_service_1 = require("./search.service");
const searchWorkspace = async (req, res, next) => {
    try {
        const query = req.query.q ||
            req.query.query ||
            "";
        const results = await (0, search_service_1.universalSearch)(req.user.organization_id, req.user.id, req.user.role, req.user.permissions || [], query);
        res.status(200).json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.searchWorkspace = searchWorkspace;
