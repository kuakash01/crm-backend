"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = void 0;
const hasPermission = (permissions, permission) => {
    return permissions.includes(permission);
};
exports.hasPermission = hasPermission;
