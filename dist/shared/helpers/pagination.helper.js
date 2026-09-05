"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationResponse = exports.buildPagination = void 0;
const buildPagination = (options) => {
    const page = Math.max(options?.page ?? 1, 1);
    const limit = Math.max(options?.limit ?? 10, 1);
    const offset = (page - 1) * limit;
    return {
        page,
        limit,
        offset,
    };
};
exports.buildPagination = buildPagination;
const buildPaginationResponse = (data, page, limit, total) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
});
exports.buildPaginationResponse = buildPaginationResponse;
