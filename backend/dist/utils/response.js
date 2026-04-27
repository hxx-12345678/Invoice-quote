"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.fail = fail;
function success(res, data, message = 'Success') {
    return res.json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
    });
}
function fail(res, statusCode, error, message) {
    return res.status(statusCode).json({
        success: false,
        error,
        message: message || error,
        timestamp: new Date().toISOString(),
    });
}
